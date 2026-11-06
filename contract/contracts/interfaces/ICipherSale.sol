// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ve_uint256} from "@primuslabs/fhe-contracts/contracts/lib/FHE.sol";
import {Attestation} from "./IPrimusZKTLS.sol";
import {uve_uint256} from "../Uve.sol";

interface ICipherSale {
    event Funded(uint256 amount);
    event Eligible(address indexed buyer);
    event Bought(address indexed buyer, ve_uint256 paid);
    event Settled(address indexed buyer);
    event Collected();
    event Canceled();

    function fund() external payable;
    function buy(Attestation calldata attestation, uve_uint256 calldata encryptedAmount) external payable;
    function settle() external payable;
    function collect() external payable;
    function cancel() external;
}
