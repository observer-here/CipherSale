// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

struct Attestor {
    address attestorAddr;
    string url;
}

struct AttNetworkRequest {
    string url;
    string header;
    string method;
    string body;
}

struct AttNetworkResponseResolve {
    string keyName;
    string parseType;
    string parsePath;
}

struct Attestation {
    address recipient;
    AttNetworkRequest request;
    AttNetworkResponseResolve[] reponseResolve;
    string data;
    string attConditions;
    uint64 timestamp;
    string additionParams;
    Attestor[] attestors;
    bytes[] signatures;
}

interface IPrimusZKTLS {
    function verifyAttestation(Attestation calldata attestation) external view;
    function encodeAttestation(Attestation calldata attestation) external pure returns (bytes32);
}
