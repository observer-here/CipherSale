// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ve_uint256} from "@primuslabs/fhe-contracts/contracts/lib/FHE.sol";
import {IERC20} from "./IERC20.sol";
import {uve_uint256} from "../Uve.sol";

interface ICipherToken {
    event Transfer(address indexed from, address indexed to, ve_uint256 value);
    event OperatorSet(address indexed holder, address indexed spender, bool allowed);

    function underlying() external view returns (IERC20);
    function totalSupply() external view returns (ve_uint256);
    function balanceOf(address account) external view returns (ve_uint256);
    function setOperator(address spender, bool allowed) external;
    function deposit(uint256 amount) external payable;
    function transfer(address to, uve_uint256 calldata value) external payable returns (bool);
    function transferFromVerified(address from, address to, ve_uint256 value) external returns (bool);
}
