// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Institution sale. Payment is cCHT. The project token is wrapped into saleToken.
// Rates are project-token wei per 1e18 payment wei.
import {FHE, ve_bool, ve_uint256} from "@primuslabs/fhe-contracts/contracts/lib/FHE.sol";
import {PermissionType} from "@primuslabs/fhe-contracts/contracts/core/IACL.sol";
import {Attestation, IPrimusZKTLS} from "./interfaces/IPrimusZKTLS.sol";
import {ICipherSale} from "./interfaces/ICipherSale.sol";
import {ICipherToken} from "./interfaces/ICipherToken.sol";
import {IERC20} from "./interfaces/IERC20.sol";
import {CipherSaleLib} from "./libraries/CipherSaleLib.sol";
import {CipherConfig} from "./CipherConfig.sol";
import {uve_uint256} from "./Uve.sol";

contract CipherSale is CipherConfig, ICipherSale {
    uint64 public constant MAX_ATTESTATION_AGE = 1 days;
    uint256 public constant BPS = 10000;

    struct SaleOptions {
        uint256 tokenPresale;
        uint256 tokenLiquidity;
        uint256 liquidityBps;
        uint256 softCap;
        uint256 hardCap;
        uint256 minContribution;
        uint256 maxContribution;
        uint256 presaleRate;
        uint256 listingRate;
        uint64 start;
        uint64 end;
    }

    address public owner;
    address public factory;
    IPrimusZKTLS public primus;
    ICipherToken public payment;
    ICipherToken public saleToken;
    IERC20 public token;
    bytes32 public conditionHash;
    SaleOptions public options;
    bool public funded;
    bool public canceled;
    bool public collected;

    ve_uint256 public raised;
    ve_uint256 public tokensSold;
    ve_bool public passedSoft;
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
        factory = msg.sender;
        primus = IPrimusZKTLS(primusVerifier);
        payment = ICipherToken(paymentToken);
        saleToken = ICipherToken(saleToken_);
        token = IERC20(projectToken);
        conditionHash = keccak256(bytes(attConditions));
        options = opts;
    }

    function fund() external payable {
        require((msg.sender == owner || msg.sender == factory) && !funded && !canceled, "fund");
        funded = true;
        uint256 need = options.tokenPresale + options.tokenLiquidity;
        if (token.balanceOf(address(this)) < need) {
            require(token.transferFrom(msg.sender, address(this), need), "token");
        }
        require(token.approve(address(saleToken), options.tokenPresale), "approve");
        saleToken.deposit{value: msg.value}(options.tokenPresale);
        emit Funded(options.tokenPresale + options.tokenLiquidity);
    }

    function buy(Attestation calldata attestation, uve_uint256 calldata encryptedAmount) external payable chargeFee {
        require(funded && !canceled && block.timestamp >= options.start && block.timestamp <= options.end, "closed");
        _prove(attestation);

        (ve_uint256 kept, ve_uint256 nextContribution, ve_uint256 nextRaised) = CipherSaleLib.takePayment(
            contributions[msg.sender],
            raised,
            verify(encryptedAmount),
            options.minContribution,
            options.maxContribution,
            options.hardCap
        );
        ve_uint256 bought = FHE.div(FHE.mul(kept, options.presaleRate), 1 ether);

        raised = CipherSaleLib.share(nextRaised, msg.sender, owner);
        contributions[msg.sender] = CipherSaleLib.share(nextContribution, msg.sender, owner);
        tokensSold = CipherSaleLib.share(FHE.add(tokensSold, bought), msg.sender, owner);
        claimable[msg.sender] = CipherSaleLib.share(FHE.add(claimable[msg.sender], bought), msg.sender, owner);
        passedSoft = FHE.ge(nextRaised, options.softCap);
        FHE.accessPolicy(passedSoft, address(this));
        FHE.accessPolicy(passedSoft, owner);

        FHE.accessPolicy(kept, address(this));
        FHE.accessPolicy(kept, address(payment), PermissionType.Transient);
        payment.transferFromVerified(msg.sender, address(this), kept);
        emit Bought(msg.sender, kept);
    }

    function settle() external payable chargeFee {
        require(canceled || block.timestamp > options.end, "open");
        require(!settled[msg.sender], "settled");
        settled[msg.sender] = true;

        ve_bool ok = FHE.and(passedSoft, !canceled);
        ve_uint256 tokens = FHE.select(ok, claimable[msg.sender], FHE.asVEUint256(0));
        ve_uint256 payback = FHE.select(ok, FHE.asVEUint256(0), contributions[msg.sender]);
        claimable[msg.sender] = CipherSaleLib.share(FHE.asVEUint256(0), msg.sender, owner);
        contributions[msg.sender] = CipherSaleLib.share(FHE.asVEUint256(0), msg.sender, owner);

        FHE.accessPolicy(tokens, address(saleToken), PermissionType.Transient);
        saleToken.transferFromVerified(address(this), msg.sender, tokens);
        FHE.accessPolicy(payback, address(payment), PermissionType.Transient);
        payment.transferFromVerified(address(this), msg.sender, payback);
        emit Settled(msg.sender);
    }

    function collect() external payable chargeFee {
        require(msg.sender == owner && funded && !collected && (canceled || block.timestamp > options.end), "collect");
        collected = true;

        ve_bool ok = FHE.and(passedSoft, !canceled);
        ve_uint256 proceeds = FHE.select(
            ok, FHE.div(FHE.mul(raised, BPS - options.liquidityBps), BPS), FHE.asVEUint256(0)
        );
        ve_uint256 unsold = FHE.sub(FHE.asVEUint256(options.tokenPresale), tokensSold);
        ve_uint256 leftover = FHE.select(ok, unsold, FHE.asVEUint256(options.tokenPresale));

        FHE.accessPolicy(proceeds, address(payment), PermissionType.Transient);
        payment.transferFromVerified(address(this), owner, proceeds);
        FHE.accessPolicy(leftover, address(saleToken), PermissionType.Transient);
        saleToken.transferFromVerified(address(this), owner, leftover);
        if (options.tokenLiquidity > 0) require(token.transfer(owner, options.tokenLiquidity), "liquidity");
        emit Collected();
    }

    function cancel() external {
        require(msg.sender == owner && !canceled && block.timestamp <= options.end, "cancel");
        canceled = true;
        emit Canceled();
    }

    function _check(SaleOptions memory opts) internal pure {
        require(opts.softCap > 0 && opts.softCap <= opts.hardCap, "cap");
        require(
            opts.minContribution > 0 && opts.minContribution <= opts.maxContribution
                && opts.maxContribution <= opts.hardCap,
            "limit"
        );
        require(opts.start < opts.end && opts.liquidityBps <= BPS && opts.presaleRate > 0, "schedule");
        require(opts.tokenPresale == opts.hardCap * opts.presaleRate / 1 ether, "presale");
        uint256 listingPayment = opts.hardCap * opts.liquidityBps / BPS;
        if (listingPayment == 0) require(opts.tokenLiquidity == 0, "listing");
        else require(opts.listingRate > 0 && opts.tokenLiquidity == listingPayment * opts.listingRate / 1 ether, "listing");
    }

    function _prove(Attestation calldata attestation) internal {
        if (eligible[msg.sender]) return;
        require(attestation.recipient == msg.sender, "recipient");
        require(keccak256(bytes(attestation.attConditions)) == conditionHash, "conditions");
        require(
            block.timestamp >= attestation.timestamp && block.timestamp - attestation.timestamp <= MAX_ATTESTATION_AGE,
            "stale"
        );
        bytes32 id = keccak256(abi.encode(attestation));
        require(!usedAttestation[id], "used");
        primus.verifyAttestation(attestation);
        usedAttestation[id] = true;
        eligible[msg.sender] = true;
        emit Eligible(msg.sender);
    }
}
