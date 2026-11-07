// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ve_uint256} from "@primuslabs/fhe-contracts/contracts/lib/FHE.sol";
import {Attestation} from "./IPrimusZKTLS.sol";
import {uve_uint256} from "../Uve.sol";

interface ICipherSale {
    event Eligible(address indexed buyer);
    event Bought(address indexed buyer, ve_uint256 paid);
    event FinalizeRequested();
    event Finalized(uint256 raised, uint256 sold);
    event Failed();
    event Settled(address indexed buyer);
    event Listed(uint256 payment, uint256 tokens);

    function buy(Attestation calldata attestation, uve_uint256 calldata encryptedAmount) external payable;
    function cancel() external;
    function requestFinalize() external;
    function finalize(uint256 raisedClear, uint256 soldClear, bytes calldata proof) external payable;
    function settle() external payable;
    function list() external payable;
    function addLiquidity(bytes calldata proof) external;
}
