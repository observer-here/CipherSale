// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ve_uint256} from "@primuslabs/fhe-contracts/contracts/lib/FHE.sol";
import {IBEP20} from "./IBEP20.sol";
import {uve_uint256} from "../Uve.sol";

interface ICipherToken {
    event Transfer(address indexed from, address indexed to, ve_uint256 value);
    event OperatorSet(address indexed holder, address indexed spender, bool allowed);
    event UnwrapRequested(address indexed from, address indexed to, bytes32 indexed id, uint256 amount);
    event Unwrapped(address indexed to, bytes32 indexed id, uint256 amount);

    function underlying() external view returns (IBEP20);
    function totalSupply() external view returns (ve_uint256);
    function balanceOf(address account) external view returns (ve_uint256);
    function setOperator(address spender, bool allowed) external;
    function unwrapTo(bytes32 id) external view returns (address);
    function deposit(uint256 amount) external payable;
    function unwrap(uint256 amount, address to) external payable returns (bytes32 id);
    function finalizeUnwrap(bytes32 id, uint256 amount, bytes calldata proof) external;
    function transfer(address to, uve_uint256 calldata value) external payable returns (bool);
    function transferFromVerified(address from, address to, ve_uint256 value) external returns (ve_uint256);
}
