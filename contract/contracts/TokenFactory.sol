// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Institution creates the public project token. 18 decimals. Supply goes to the creator.
// ProjectToken is a standard BEP-20: Transfer and Approval events let explorers index holders.
contract TokenFactory {
    address[] public allTokens;
    mapping(address => address[]) private tokensByCreator;

    event TokenCreated(address indexed creator, address token, string name, string symbol, uint256 supply);

    function createToken(string calldata name, string calldata symbol, uint256 supply) external returns (address token) {
        require(bytes(name).length > 0 && bytes(symbol).length > 0 && supply > 0, "token");
        token = address(new ProjectToken(name, symbol, supply, msg.sender));
        allTokens.push(token);
        tokensByCreator[msg.sender].push(token);
        emit TokenCreated(msg.sender, token, name, symbol, supply);
    }

    function getTokensByCreator(address creator) external view returns (address[] memory) {
        return tokensByCreator[creator];
    }
}

contract ProjectToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory name_, string memory symbol_, uint256 supply, address to) {
        name = name_;
        symbol = symbol_;
        totalSupply = supply;
        balanceOf[to] = supply;
        emit Transfer(address(0), to, supply);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _move(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "allowance");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
            emit Approval(from, msg.sender, allowed - amount);
        }
        _move(from, to, amount);
        return true;
    }

    function _move(address from, address to, uint256 amount) internal {
        require(to != address(0), "to");
        require(balanceOf[from] >= amount, "balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
