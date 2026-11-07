// Every FHE call sends the executor fee as msg.value and Primus keeps all of it, with no refund.
// The SDK quote (estimateFheFee) prices one operation. buy runs many and reverts with InsufficientBalance() below
// about 0.0025 tBNB in BNB testnet runs, so it carries headroom. The other calls pass at the SDK quote.
import { parseEther } from "ethers";

const FEES = { deposit: "0.00072", unwrap: "0.00072", settle: "0.00072", finalize: "0.00072", list: "0.00072", buy: "0.003" };

export const fheFee = (call: keyof typeof FEES) => parseEther(FEES[call]);
