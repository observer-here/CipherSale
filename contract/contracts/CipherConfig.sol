// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ve_uint256} from "@primuslabs/fhe-contracts/contracts/lib/FHE.sol";
import {FHEConfig} from "@primuslabs/fhe-contracts/contracts/lib/Impl.sol";
import {FheType} from "@primuslabs/fhe-contracts/contracts/core/FheType.sol";
import {IFHEExecutor} from "@primuslabs/fhe-contracts/contracts/core/IFHEExecutor.sol";
import {IACL, PermissionType} from "@primuslabs/fhe-contracts/contracts/core/IACL.sol";
import {uve_uint256} from "./Uve.sol";

interface IPrimusFee {
    function chargeFee(address user) external payable;
}

interface IPrimusDecryption {
    function verifyPublicDecryptionEIP712KMSSignature(
        bytes32[] calldata handlesList,
        bytes calldata decryptedResult,
        bytes calldata decryptionProof
    ) external returns (bool);
}

abstract contract CipherConfig {
    address internal constant ACL = 0x73d8e6Aa72DFD64ADcdF388411A6EE3F3CFa98B5;
    address internal constant FHE_EXECUTOR = 0xfA1f2CF8B46BA9D0FCa7b6AD484dc69E4A0E1ceb;
    address internal constant DECRYPTION = 0x979A0Ccee4546dCDd0234db28cFf1A06DE2eb4d7;

    error UnsupportedChain(uint256 chainId);

    constructor() {
        if (block.chainid != 97) revert UnsupportedChain(block.chainid);
        FHE.setCoprocessor(
            FHEConfig({ACLAddress: ACL, FHEExecutorAddress: FHE_EXECUTOR, DecryptionOracleAddress: address(0)})
        );
    }

    modifier chargeFee() {
        // The executor reverts when the payer is a contract. A sale funds its token
        // through the factory, so that call is charged to the wallet that sent it.
        address payer = msg.sender == tx.origin ? msg.sender : tx.origin;
        IPrimusFee(FHE_EXECUTOR).chargeFee{value: msg.value}(payer);
        _;
    }

    function verify(uve_uint256 calldata input) internal returns (ve_uint256) {
        bytes32 result = IFHEExecutor(FHE_EXECUTOR).verifyAttestation(
            input.handle,
            msg.sender,
            input.data,
            FheType.Uint256
        );
        IACL(ACL).accessPolicy(result, msg.sender, PermissionType.Transient);
        IACL(ACL).accessPolicy(result, address(this), PermissionType.Transient);
        return ve_uint256.wrap(result);
    }

    // cleartexts is abi.encode of the values in handle order, as Jazz returns them.
    function checkReveal(bytes32[] memory handles, bytes memory cleartexts, bytes calldata proof) internal {
        require(IPrimusDecryption(DECRYPTION).verifyPublicDecryptionEIP712KMSSignature(handles, cleartexts, proof), "proof");
    }
}
