// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Institution sale. A buyer proves the sale condition once, then pays an encrypted cUSDT amount.
// When the owner cancels, or after the window, anyone reveals raised and tokensSold with a KMS proof.
// A cancel, or a total below the soft cap, refunds buyers their cUSDT. Above it, buyers settle into the confidential project token and the owner is paid in cUSDT.
// The factory pulls tokenPresale into this contract. Unsold tokens return to the owner.
// Rates are project-token wei per 1e18 payment wei.
import {FHE, ve_uint256} from "@primuslabs/fhe-contracts/contracts/lib/FHE.sol";
import {IACL, PermissionType} from "@primuslabs/fhe-contracts/contracts/core/IACL.sol";
import {Attestation, IPrimusZKTLS} from "./interfaces/IPrimusZKTLS.sol";
import {ICipherSale} from "./interfaces/ICipherSale.sol";
import {ICipherToken} from "./interfaces/ICipherToken.sol";
import {IBEP20} from "./interfaces/IBEP20.sol";
import {CipherSaleLib} from "./libraries/CipherSaleLib.sol";
import {CipherConfig} from "./CipherConfig.sol";
import {uve_uint256} from "./Uve.sol";

contract CipherSale is CipherConfig, ICipherSale {
    uint64 public constant MAX_ATTESTATION_AGE = 1 days;
    address private constant ATTESTOR = 0x5Ed3176045F68617B0958a61ac1868875C98C14d;
    uint8 public constant ACTIVE = 1;
    uint8 public constant FINALIZING = 2;
    uint8 public constant REFUNDING = 3;
    uint8 public constant SUCCEEDED = 4;

    struct SaleOptions {
        uint256 tokenPresale;
        uint256 softCap;
        uint256 hardCap;
        uint256 minContribution;
        uint256 maxContribution;
        uint256 presaleRate;
        uint64 start;
        uint64 end;
    }

    address public owner;
    IPrimusZKTLS public primus;
    ICipherToken public payment;
    ICipherToken public saleToken;
    IBEP20 public token;
    bytes32 public conditionHash;
    string public metadata;
    SaleOptions public options;
    uint8 public state;
    bool public cancelled;
    uint256 public totalRaised;
    uint256 public totalSold;
    uint256 public buyers;

    ve_uint256 public raised;
    ve_uint256 public tokensSold;
    mapping(address => ve_uint256) public contributions;
    mapping(address => ve_uint256) public claimable;
    mapping(address => bool) public eligible;
    mapping(address => bool) public settled;
    mapping(bytes32 => bool) public usedAttestation;

    constructor(
        address primusVerifier,
        address paymentToken,
        address saleToken_,
        address projectToken,
        address owner_,
        string memory attConditions,
        string memory metadata_,
        SaleOptions memory opts
    ) {
        require(
            primusVerifier != address(0) && paymentToken != address(0) && saleToken_ != address(0)
                && projectToken != address(0) && owner_ != address(0),
            "address"
        );
        require(address(ICipherToken(saleToken_).underlying()) == projectToken, "underlying");
        _check(opts);
        owner = owner_;
        primus = IPrimusZKTLS(primusVerifier);
        payment = ICipherToken(paymentToken);
        saleToken = ICipherToken(saleToken_);
        token = IBEP20(projectToken);
        conditionHash = keccak256(bytes(attConditions));
        metadata = metadata_;
        options = opts;
        state = ACTIVE;
    }

    function buy(Attestation calldata attestation, uve_uint256 calldata encryptedAmount) external payable chargeFee {
        require(state == ACTIVE && block.timestamp >= options.start && block.timestamp <= options.end, "closed");
        _prove(attestation);

        ve_uint256 accepted = CipherSaleLib.accept(
            contributions[msg.sender], verify(encryptedAmount), options.minContribution, options.maxContribution
        );
        FHE.accessPolicy(accepted, address(payment), PermissionType.Transient);
        ve_uint256 paid = payment.transferFromVerified(msg.sender, address(this), accepted);

        (ve_uint256 kept, ve_uint256 overflow, ve_uint256 nextRaised) =
            CipherSaleLib.capAtHard(raised, paid, options.hardCap);
        FHE.accessPolicy(overflow, address(payment), PermissionType.Transient);
        payment.transferFromVerified(address(this), msg.sender, overflow);

        ve_uint256 bought = FHE.div(FHE.mul(kept, options.presaleRate), 1 ether);
        raised = CipherSaleLib.share(nextRaised, msg.sender, owner);
        contributions[msg.sender] = CipherSaleLib.share(FHE.add(contributions[msg.sender], kept), msg.sender, owner);
        tokensSold = CipherSaleLib.share(FHE.add(tokensSold, bought), msg.sender, owner);
        claimable[msg.sender] = CipherSaleLib.share(FHE.add(claimable[msg.sender], bought), msg.sender, owner);
        emit Bought(msg.sender, kept);
    }

    function cancel() external {
        require(msg.sender == owner && state == ACTIVE && block.timestamp <= options.end, "cancel");
        if (!FHE.isInitialized(raised)) return _fail();
        cancelled = true;
        state = FINALIZING;
        IACL(ACL).allowForDecryption(_totals());
        emit FinalizeRequested();
    }

    function requestFinalize() external {
        require(state == ACTIVE && block.timestamp > options.end, "open");
        if (!FHE.isInitialized(raised)) return _fail();
        state = FINALIZING;
        IACL(ACL).allowForDecryption(_totals());
        emit FinalizeRequested();
    }

    // msg.value is the FHE fee for wrapping the sold tokens. It is only spent when the soft cap is met.
    function finalize(uint256 raisedClear, uint256 soldClear, bytes calldata proof) external payable {
        require(state == FINALIZING, "state");
        checkReveal(_totals(), abi.encode(raisedClear, soldClear), proof);
        totalRaised = raisedClear;
        totalSold = soldClear;
        if (cancelled || raisedClear < options.softCap) {
            _fail();
            if (msg.value > 0) payable(msg.sender).transfer(msg.value);
            return;
        }
        state = SUCCEEDED;

        if (soldClear > 0) {
            require(token.approve(address(saleToken), soldClear), "approve");
            saleToken.deposit{value: msg.value}(soldClear);
        }
        ve_uint256 proceeds = FHE.asVEUint256(raisedClear);
        FHE.accessPolicy(proceeds, address(payment), PermissionType.Transient);
        payment.transferFromVerified(address(this), owner, proceeds);

        uint256 back = options.tokenPresale - soldClear;
        if (back > 0) require(token.transfer(owner, back), "token");
        emit Finalized(raisedClear, soldClear);
    }

    // Claim after success, refund after failure or cancel.
    function settle() external payable chargeFee {
        require(state == SUCCEEDED || state == REFUNDING, "state");
        require(FHE.isInitialized(contributions[msg.sender]) && !settled[msg.sender], "settled");
        settled[msg.sender] = true;
        (ICipherToken asset, ve_uint256 amount) = state == SUCCEEDED
            ? (saleToken, claimable[msg.sender])
            : (payment, contributions[msg.sender]);
        FHE.accessPolicy(amount, address(asset), PermissionType.Transient);
        asset.transferFromVerified(address(this), msg.sender, amount);
        emit Settled(msg.sender);
    }

    function _fail() internal {
        state = REFUNDING;
        require(token.transfer(owner, options.tokenPresale), "token");
        emit Failed();
    }

    function _totals() internal view returns (bytes32[] memory handles) {
        handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(raised);
        handles[1] = FHE.toBytes32(tokensSold);
    }

    function _check(SaleOptions memory opts) internal pure {
        require(opts.softCap > 0 && opts.softCap <= opts.hardCap, "cap");
        require(
            opts.minContribution > 0 && opts.minContribution <= opts.maxContribution
                && opts.maxContribution <= opts.hardCap,
            "limit"
        );
        require(opts.start < opts.end && opts.presaleRate > 0, "schedule");
        require(opts.tokenPresale == opts.hardCap * opts.presaleRate / 1 ether, "presale");
    }

    function _prove(Attestation calldata attestation) internal {
        if (eligible[msg.sender]) return;
        require(attestation.recipient == msg.sender, "recipient");
        require(keccak256(bytes(attestation.attConditions)) == conditionHash, "conditions");
        // The attestor signs the timestamp in milliseconds, so the struct cannot be rewritten in the browser.
        uint256 issued = attestation.timestamp > 1e12 ? attestation.timestamp / 1000 : attestation.timestamp;
        require(block.timestamp >= issued && block.timestamp - issued <= MAX_ATTESTATION_AGE, "stale");
        bytes32 id = keccak256(abi.encode(attestation));
        require(!usedAttestation[id], "used");
        _attestor(attestation);
        usedAttestation[id] = true;
        eligible[msg.sender] = true;
        buyers++;
        emit Eligible(msg.sender);
    }

    // The testnet verifier still lists the old attestor. The extension signs with ATTESTOR.
    function _attestor(Attestation calldata attestation) internal view {
        bytes memory signature = attestation.signatures[0];
        require(attestation.signatures.length == 1 && signature.length == 65, "signature");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }
        require(v == 27 || v == 28, "signature");
        require(ecrecover(primus.encodeAttestation(attestation), v, r, s) == ATTESTOR, "signature");
    }
}
