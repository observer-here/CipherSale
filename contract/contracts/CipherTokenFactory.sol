// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Deploys a CipherToken wrapper. Kept apart from CipherSaleFactory so that factory stays under the 24 KB limit.
import {CipherToken} from "./CipherToken.sol";

contract CipherTokenFactory {
    function create(string calldata name, string calldata symbol, address underlying) external returns (address) {
        return address(new CipherToken(name, symbol, underlying));
    }
}
