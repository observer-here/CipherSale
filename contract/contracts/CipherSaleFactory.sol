// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// One call deploys the confidential project token and the sale, then pulls the presale tokens in.
// Payment is cUSDT. Sold tokens are wrapped only at finalize, like PrivacyPad.
import {CipherSale} from "./CipherSale.sol";
import {CipherTokenFactory} from "./CipherTokenFactory.sol";
import {IBEP20} from "./interfaces/IBEP20.sol";

contract CipherSaleFactory {
    address public payment;
    address public primus;
    CipherTokenFactory public wrappers;
    address[] public allSales;
    mapping(address => address[]) private salesByCreator;

    event SaleCreated(address indexed creator, address sale, address token, address ctoken);

    constructor(address payment_, address primus_, address wrappers_) {
        require(payment_ != address(0) && primus_ != address(0) && wrappers_ != address(0), "address");
        payment = payment_;
        primus = primus_;
        wrappers = CipherTokenFactory(wrappers_);
    }

    function createSale(
        address projectToken,
        string calldata attConditions,
        string calldata metadata,
        CipherSale.SaleOptions calldata opts
    ) external returns (address sale) {
        IBEP20 token = IBEP20(projectToken);
        address ctoken = wrappers.create(
            string.concat("Confidential ", token.name()), string.concat("c", token.symbol()), projectToken
        );
        sale = address(new CipherSale(primus, payment, ctoken, projectToken, msg.sender, attConditions, metadata, opts));
        require(token.transferFrom(msg.sender, sale, opts.tokenPresale), "token");
        allSales.push(sale);
        salesByCreator[msg.sender].push(sale);
        emit SaleCreated(msg.sender, sale, projectToken, ctoken);
    }

    function getSalesByCreator(address creator) external view returns (address[] memory) {
        return salesByCreator[creator];
    }
}
