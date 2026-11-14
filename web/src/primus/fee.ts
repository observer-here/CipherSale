// msg.value the FHE executor keeps. buy runs several operations, so its fee is higher.
import { parseEther } from "ethers";

const FEES = { deposit: "0.00072", unwrap: "0.00072", settle: "0.00072", finalize: "0.00072", buy: "0.003" };

export const fheFee = (call: keyof typeof FEES) => parseEther(FEES[call]);
