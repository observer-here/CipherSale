# CipherSale

Confidential token sales on BNB Smart Chain testnet. Buyers pay hidden cCHT. The amount raised stays encrypted until the sale ends. The first buy also needs a Primus zkTLS proof that the wallet owns a Spotify account.

Network: BNB testnet, chain id `97`.

## What it does

1. A creator deploys a normal BEP-20. The full supply is minted to that wallet once.
2. The creator opens a sale and sends two piles of that token into the sale: tokens for buyers, and tokens for the PancakeSwap pool.
3. A buyer wraps CHT into cCHT, proves Spotify account ownership once, and pays a hidden amount.
4. The sale keeps the cCHT and writes a hidden note for how many project tokens that wallet is owed. The plain project token does not move yet.
5. After the window, the raised total and the tokens sold are decrypted.
6. Under the soft cap, or if the owner cancels, both token piles return to the owner and buyers take their cCHT back.
7. Over the soft cap, the sold tokens are locked and minted 1:1 as a confidential token to the sale. Buyers then claim that hidden token. Unsold tokens return to the owner. The liquidity share of cCHT is unwrapped to CHT and paired with the project token on PancakeSwap. The LP tokens stay in the sale.

## Sale states

| State | Name | What can happen |
| --- | --- | --- |
| 1 | Active | Buy, or the owner can cancel before the end |
| 2 | Finalizing | Raised and sold are waiting on a public decrypt |
| 3 | Refunding | Buyers settle their cCHT back |
| 4 | Succeeded | Buyers settle the hidden project token. Owner lists liquidity |

## Repo

```text
CipherSale
├── contract        Hardhat, Solidity 0.8.27
│   ├── contracts   sales, tokens, Primus wiring
│   ├── deploy      one script for BNB testnet
│   └── scripts     copies ABIs into the web app
└── web             Next.js 15 app
    └── src
        ├── app           pages and the zkTLS sign route
        ├── components    sale, token, layout
        ├── primus        fees, proofs, encrypt, decrypt
        ├── lib           reads, formatting, metadata
        └── abi           generated from contract artifacts
```

### Contract files

| File | Role |
| --- | --- |
| `CHT.sol` | Plain test payment token. `faucet()` mints 1,000 CHT once per wallet |
| `TokenFactory.sol` | Deploys a project BEP-20 and mints the supply to the creator |
| `CipherToken.sol` | Confidential wrapper. `deposit` locks the underlying and mints the same amount encrypted. `unwrap` burns it and releases the plain token after a decrypt |
| `CipherTokenFactory.sol` | Deploys one `CipherToken` wrapper per project token |
| `CipherSale.sol` | One sale. Buy, cancel, finalize, settle, list |
| `CipherSaleFactory.sol` | Deploys the wrapper and the sale, then pulls the sale tokens in |
| `CipherSaleLib.sol` | Min, max, and hard-cap math on encrypted amounts |
| `CipherConfig.sol` | Primus ACL, executor, decryption oracle. Sale calls only run on chain 97 |
| `IPrimusZKTLS.sol` | Attestation struct the buy proof must match |

### Web files

| Path | Role |
| --- | --- |
| `app/page.tsx` | Home |
| `app/sales` | Sale list |
| `app/sale/[address]` | One sale: terms, countdown, join, contribution, owner actions |
| `app/create-sale` | Sale form. Spotify account ownership is the buyer check |
| `app/create-token` | Deploy the project BEP-20 |
| `app/assets` | Wrap CHT and unwrap cCHT. Test faucet |
| `app/purchases` | Sales this wallet created or joined |
| `app/api/primus/sign` | Signs the zkTLS request. The app secret never reaches the browser |
| `primus/attestation.ts` | Browser proof through the Primus extension |
| `primus/gates.ts` | Buyer checks. Today: Spotify account ownership |
| `primus/fee.ts` | tBNB sent with each FHE call. Primus keeps the fee |
| `components/sale` | Form, buy, claim or refund, liquidity |
| `lib/read.ts` | Loads a sale from chain without a connected wallet |
| `lib/chain.ts` | Public RPC and the deployed addresses |

## How a buy works

The buyer pays cCHT, not the project token.

- The amount is encrypted in the browser and checked on chain.
- A buy under the min, over the wallet max, or past the hard cap is cut down. The extra cCHT is sent back in the same transaction.
- `claimable` is `paid * presaleRate / 1e18`. That note stays encrypted.
- The first buy from a wallet must carry a fresh zkTLS attestation. The condition hash, the recipient, and the age (1 day) are checked, then Primus verifies the attestor signature. Later buys from that wallet skip the proof.
- `buy` sends `0.003` tBNB. The other FHE calls send `0.00072` tBNB. Primus does not refund the fee.

## How settle works

Finalize decrypts only two numbers: total raised and total sold.

On success the sale calls `deposit` on the project cToken for the sold amount. That locks the plain tokens and mints the same amount of hidden tokens to the sale contract. Each buyer then calls `settle` and receives their share of that hidden token. They can unwrap it later to the plain BEP-20.

The owner is paid `(raised - liquidity share)` in cCHT at finalize. `list` unwraps the liquidity share to CHT. `addLiquidity` pairs that CHT with the listing tokens on PancakeSwap V2. Leftover tokens from the pair return to the owner.

On failure or cancel, `settle` sends the buyer's cCHT back. Both token piles return to the owner. Nothing is wrapped.

## Deployed on BNB testnet

| Contract | Address |
| --- | --- |
| CHT | `0x060014941781296Ad4fBE81C6d80ECe40912dcbC` |
| cCHT | `0x5A6Bb480dCE53b4CbA73f0EDE3F8a34764f38429` |
| Token factory | `0x69E85e44907A3780f546a4934c83f6aA1772ff82` |
| Sale factory | `0x52108018007C71Bb962F32A434199423dA786421` |
| PancakeSwap V2 router | `0xD99D1c33F9fC3444f8101754aBC46c52416550D1` |

zkTLS app `0x347e1761d0ea0d09a16fa5c93761c1d03f90339a`, Spotify template `be6b4aaa-cc05-431e-b304-75e99a4868fc`.

## Run it

Contracts:

```bash
cd contract
npm install
npm run build
npm run abi
```

`contract/.env` needs `PRIVATE_KEY` for deploy. `npm run deploy` sends CHT, cCHT, both factories, and the sale factory. Copy the printed addresses into `web/.env.local`.

Web:

```bash
cd web
npm install
npm run build
npm run start
```

`web/.env.local` needs the public addresses above, `NEXT_PUBLIC_PRIMUS_APP_ID`, `NEXT_PUBLIC_PRIMUS_TEMPLATE_ID`, `PRIMUS_APP_SECRET`, and `NEXT_PUBLIC_REOWN_PROJECT_ID`. Keep the secret on the server. The app reads sales from `https://bsc-testnet-rpc.publicnode.com`.

A buyer needs the Primus browser extension, tBNB for FHE fees, CHT from the Assets faucet, and cCHT from wrapping.

## Primus

These are the Primus contracts CipherSale calls on BNB testnet.

| 🧩 | Contract | Address |
| --- | --- | --- |
| 🔐 | ACL | `0x73d8e6Aa72DFD64ADcdF388411A6EE3F3CFa98B5` |
| ⚙️ | FHE executor | `0xfA1f2CF8B46BA9D0FCa7b6AD484dc69E4A0E1ceb` |
| 🔓 | Decryption oracle | `0x979A0Ccee4546dCDd0234db28cFf1A06DE2eb4d7` |
| 🛡️ | zkTLS verifier | `0xBc074EbE6D39A97Fb35726832300a950e2D94324` |

Docs:

- 📘 [Primus docs](https://docs.primuslabs.xyz)
- 🔒 [zkTLS JS SDK](https://docs.primuslabs.xyz/enterprise/zk-tls-sdk/zktls-js-sdk-api)
- 📜 [Attestation structure](https://docs.primuslabs.xyz/enterprise/attestation-structure)
- 🧪 [Developer Hub](https://dev.primuslabs.xyz)
- 🧮 FHE contracts package `@primuslabs/fhe-contracts` (`nc97-fhe-contracts@0.1.0`)
- 🌐 FHE browser SDK `@primuslabs/fhetransform-sdk@0.4.5`
- 🔌 zkTLS browser SDK `@primuslabs/zktls-js-sdk@0.3.15`

X: [0bserver_here](https://x.com/0bserver_here)
