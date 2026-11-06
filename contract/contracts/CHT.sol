// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Faucet token. A user wraps CHT into cCHT before joining a sale.
contract CHT {
    string public constant name = "Cipher";
    string public constant symbol = "CHT";
    uint8 public constant decimals = 18;
    uint256 public constant FAUCET_AMOUNT = 1000 ether;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public tapped;

    function faucet() external {
        require(!tapped[msg.sender], "tapped");
        tapped[msg.sender] = true;
        totalSupply += FAUCET_AMOUNT;
        balanceOf[msg.sender] += FAUCET_AMOUNT;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount && allowance[from][msg.sender] >= amount, "balance");
        balanceOf[from] -= amount;
        allowance[from][msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}
