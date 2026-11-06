// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// One call deploys the confidential project token and the sale. Payment is cCHT.
import {CipherSale} from "./CipherSale.sol";
import {CipherToken} from "./CipherToken.sol";
import {IERC20} from "./interfaces/IERC20.sol";

contract CipherSaleFactory {
    address public payment;
    address public primus;
    address[] public allSales;
    mapping(address => address[]) private salesByCreator;

    event SaleCreated(address indexed creator, address sale, address token, address ctoken);

    constructor(address payment_, address primus_) {
        require(payment_ != address(0) && primus_ != address(0), "address");
        payment = payment_;
        primus = primus_;
    }

    function createSale(
        address projectToken,
        string calldata attConditions,
        CipherSale.SaleOptions calldata opts
    ) external payable returns (address sale) {
        return _create(projectToken, attConditions, opts);
    }

    function getSalesByCreator(address creator) external view returns (address[] memory) {
        return salesByCreator[creator];
    }

    function _create(
        address projectToken,
        string calldata attConditions,
        CipherSale.SaleOptions calldata opts
    ) internal returns (address sale) {
        IERC20 token = IERC20(projectToken);
        CipherToken ctoken = new CipherToken(
            string.concat("Confidential ", token.name()),
            string.concat("c", token.symbol()),
            projectToken
        );
        CipherSale created = new CipherSale(
            primus, payment, address(ctoken), projectToken, msg.sender, attConditions, opts
        );
        require(
            token.transferFrom(msg.sender, address(created), opts.tokenPresale + opts.tokenLiquidity), "token"
        );
        created.fund{value: msg.value}();
        sale = address(created);
        allSales.push(sale);
        salesByCreator[msg.sender].push(sale);
        emit SaleCreated(msg.sender, sale, projectToken, address(ctoken));
    }
}
