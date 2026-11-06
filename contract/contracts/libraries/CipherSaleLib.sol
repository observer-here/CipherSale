// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ve_bool, ve_uint256} from "@primuslabs/fhe-contracts/contracts/lib/FHE.sol";

library CipherSaleLib {
    function takePayment(
        ve_uint256 contributed,
        ve_uint256 raised,
        ve_uint256 amount,
        uint256 minContribution,
        uint256 maxContribution,
        uint256 hardCap
    ) internal returns (ve_uint256 kept, ve_uint256 nextContribution, ve_uint256 nextRaised) {
        ve_uint256 room = FHE.sub(maxContribution, contributed);
        ve_bool overMax = FHE.ge(amount, room);
        ve_uint256 capped = FHE.select(overMax, room, amount);
        ve_bool passMin = FHE.ge(FHE.add(capped, contributed), minContribution);
        ve_uint256 accepted = FHE.select(passMin, capped, FHE.asVEUint256(0));

        ve_uint256 withPayment = FHE.add(raised, accepted);
        ve_bool overHard = FHE.gt(withPayment, hardCap);
        ve_uint256 overflow = FHE.select(overHard, FHE.sub(withPayment, hardCap), FHE.asVEUint256(0));

        kept = FHE.sub(accepted, overflow);
        nextContribution = FHE.add(contributed, kept);
        nextRaised = FHE.sub(withPayment, overflow);
    }

    function share(ve_uint256 value, address buyer, address owner) internal returns (ve_uint256) {
        FHE.accessPolicy(value, address(this));
        FHE.accessPolicy(value, buyer);
        FHE.accessPolicy(value, owner);
        return value;
    }
}
