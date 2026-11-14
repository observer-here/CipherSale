// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// cUSDT: confidential wrapper around a BEP-20. deposit() locks the BEP-20 and mints an encrypted balance.
// Unwrap takes two steps. unwrap() burns the encrypted amount and marks the burned value as publicly
// decryptable. Anyone can then call finalizeUnwrap() with the decrypted amount and the KMS proof, which the
// Primus Decryption contract checks before the BEP-20 is released. The burned value, not the requested
// amount, is what gets paid, so a wallet can never unwrap more than its encrypted balance.
// A short balance moves 0, so transferFromVerified returns the amount that actually moved.
import {FHE, ve_bool, ve_uint256} from "@primuslabs/fhe-contracts/contracts/lib/FHE.sol";
import {IACL, PermissionType} from "@primuslabs/fhe-contracts/contracts/core/IACL.sol";
import {IBEP20} from "./interfaces/IBEP20.sol";
import {ICipherToken} from "./interfaces/ICipherToken.sol";
import {CipherConfig} from "./CipherConfig.sol";
import {uve_uint256} from "./Uve.sol";

contract CipherToken is CipherConfig, ICipherToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    IBEP20 public underlying;

    mapping(address => ve_uint256) private _balances;
    ve_uint256 private _totalSupply;
    mapping(address => mapping(address => bool)) public operators;
    mapping(bytes32 => address) public unwrapTo;

    constructor(string memory name_, string memory symbol_, address underlying_) {
        name = name_;
        symbol = symbol_;
        underlying = IBEP20(underlying_);
    }

    function totalSupply() external view returns (ve_uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (ve_uint256) {
        return _balances[account];
    }

    function setOperator(address spender, bool allowed) external {
        operators[msg.sender][spender] = allowed;
        emit OperatorSet(msg.sender, spender, allowed);
    }

    function deposit(uint256 amount) external payable chargeFee {
        require(address(underlying) != address(0) && amount > 0, "deposit");
        require(underlying.transferFrom(msg.sender, address(this), amount), "underlying");
        _update(address(0), msg.sender, FHE.asVEUint256(amount));
    }

    function unwrap(uint256 amount, address to) external payable chargeFee returns (bytes32 id) {
        require(to != address(0) && amount > 0, "unwrap");
        ve_uint256 burned = _update(msg.sender, address(0), FHE.asVEUint256(amount));
        FHE.accessPolicy(burned, address(this));
        id = FHE.toBytes32(burned);
        bytes32[] memory handles = new bytes32[](1);
        handles[0] = id;
        IACL(ACL).allowForDecryption(handles);
        unwrapTo[id] = to;
        emit UnwrapRequested(msg.sender, to, id, amount);
    }

    function finalizeUnwrap(bytes32 id, uint256 amount, bytes calldata proof) external {
        address to = unwrapTo[id];
        require(to != address(0), "request");
        delete unwrapTo[id];
        bytes32[] memory handles = new bytes32[](1);
        handles[0] = id;
        checkReveal(handles, abi.encode(amount), proof);
        require(underlying.transfer(to, amount), "underlying");
        emit Unwrapped(to, id, amount);
    }

    function transfer(address to, uve_uint256 calldata value) external payable chargeFee returns (bool) {
        _update(msg.sender, to, verify(value));
        return true;
    }

    function transferFromVerified(address from, address to, ve_uint256 value) external returns (ve_uint256 moved) {
        require(from == msg.sender || operators[from][msg.sender], "operator");
        require(FHE.isAllowed(value, msg.sender), "ciphertext");
        FHE.accessPolicy(value, address(this), PermissionType.Transient);
        moved = _update(from, to, value);
        FHE.accessPolicy(moved, msg.sender, PermissionType.Transient);
    }

    function _update(address from, address to, ve_uint256 value) internal returns (ve_uint256) {
        if (from == address(0)) {
            _totalSupply = FHE.add(_totalSupply, value);
            FHE.accessPolicy(_totalSupply, address(this));
        } else {
            ve_uint256 fromBalance = _balances[from];
            ve_bool short = FHE.lt(fromBalance, value);
            _balances[from] = FHE.select(short, fromBalance, FHE.sub(fromBalance, value));
            FHE.accessPolicy(_balances[from], address(this));
            FHE.accessPolicy(_balances[from], from);
            value = FHE.select(short, FHE.asVEUint256(0), value);
        }

        if (to == address(0)) {
            _totalSupply = FHE.sub(_totalSupply, value);
            FHE.accessPolicy(_totalSupply, address(this));
        } else {
            _balances[to] = FHE.add(_balances[to], value);
            FHE.accessPolicy(_balances[to], address(this));
            FHE.accessPolicy(_balances[to], to);
        }

        emit Transfer(from, to, value);
        return value;
    }
}
