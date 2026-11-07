// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Encrypted contribution rules. accept() runs before the payment moves, capAtHard() on what actually moved.
import {FHE, ve_bool, ve_uint256} from "@primuslabs/fhe-contracts/contracts/lib/FHE.sol";

library CipherSaleLib {
    function accept(ve_uint256 contributed, ve_uint256 amount, uint256 minContribution, uint256 maxContribution)
        internal
        returns (ve_uint256)
    {
        ve_uint256 room = FHE.sub(maxContribution, contributed);
        ve_uint256 capped = FHE.select(FHE.ge(amount, room), room, amount);
        ve_bool passMin = FHE.ge(FHE.add(capped, contributed), minContribution);
        return FHE.select(passMin, capped, FHE.asVEUint256(0));
    }

    function capAtHard(ve_uint256 raised, ve_uint256 paid, uint256 hardCap)
        internal
        returns (ve_uint256 kept, ve_uint256 overflow, ve_uint256 nextRaised)
    {
        ve_uint256 withPayment = FHE.add(raised, paid);
        overflow = FHE.select(FHE.gt(withPayment, hardCap), FHE.sub(withPayment, hardCap), FHE.asVEUint256(0));
        kept = FHE.sub(paid, overflow);
        nextRaised = FHE.sub(withPayment, overflow);
    }

    function share(ve_uint256 value, address buyer, address owner) internal returns (ve_uint256) {
        FHE.accessPolicy(value, address(this));
        FHE.accessPolicy(value, buyer);
        FHE.accessPolicy(value, owner);
        return value;
    }
}
