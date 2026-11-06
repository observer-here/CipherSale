// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ve_bool, ve_uint256} from "@primuslabs/fhe-contracts/contracts/lib/FHE.sol";
import {PermissionType} from "@primuslabs/fhe-contracts/contracts/core/IACL.sol";
import {IERC20} from "./interfaces/IERC20.sol";
import {ICipherToken} from "./interfaces/ICipherToken.sol";
import {CipherConfig} from "./CipherConfig.sol";
import {uve_uint256} from "./Uve.sol";

contract CipherToken is CipherConfig, ICipherToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    IERC20 public underlying;

    mapping(address => ve_uint256) private _balances;
    ve_uint256 private _totalSupply;
    mapping(address => mapping(address => bool)) public operators;

    constructor(string memory name_, string memory symbol_, address underlying_) {
        name = name_;
        symbol = symbol_;
        underlying = IERC20(underlying_);
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

    function transfer(address to, uve_uint256 calldata value) external payable chargeFee returns (bool) {
        _update(msg.sender, to, verify(value));
        return true;
    }

    function transferFromVerified(address from, address to, ve_uint256 value) external returns (bool) {
        require(from == msg.sender || operators[from][msg.sender], "operator");
        require(FHE.isAllowed(value, msg.sender), "ciphertext");
        FHE.accessPolicy(value, address(this), PermissionType.Transient);
        _update(from, to, value);
        return true;
    }

    function _update(address from, address to, ve_uint256 value) internal {
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
    }
}
