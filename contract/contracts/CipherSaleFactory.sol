// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// One call deploys the sale and pulls the plain presale tokens in. Payment is cUSDT.
// After a successful sale, buyers claim those plain tokens. Refunds stay in cUSDT.
import {CipherSale} from "./CipherSale.sol";
import {IBEP20} from "./interfaces/IBEP20.sol";

contract CipherSaleFactory {
    address public payment;
    address public primus;
    address[] public allSales;
    mapping(address => address[]) private salesByCreator;

    event SaleCreated(address indexed creator, address sale, address token);

    constructor(address payment_, address primus_) {
        require(payment_ != address(0) && primus_ != address(0), "address");
        payment = payment_;
        primus = primus_;
    }

    function createSale(
        address projectToken,
        string calldata attConditions,
        string calldata metadata,
        CipherSale.SaleOptions calldata opts
    ) external returns (address sale) {
        IBEP20 token = IBEP20(projectToken);
        sale = address(new CipherSale(primus, payment, projectToken, msg.sender, attConditions, metadata, opts));
        require(token.transferFrom(msg.sender, sale, opts.tokenPresale), "token");
        allSales.push(sale);
        salesByCreator[msg.sender].push(sale);
        emit SaleCreated(msg.sender, sale, projectToken);
    }

    function getSalesByCreator(address creator) external view returns (address[] memory) {
        return salesByCreator[creator];
    }
}
