# 🔐 CipherSale

Confidential token sales on BNB Smart Chain testnet. Buyers pay hidden **cUSDT**. The raised total stays encrypted until the sale is canceled or the window closes. The first buy needs a Primus zkTLS proof that the wallet owns a Spotify account.

🌐 Network: BNB testnet, chain id `97`.

## ✨ What it does

1. A creator deploys a normal BEP-20. The full supply is minted to that wallet once.
2. The creator opens a sale. The factory pulls the presale allocation from that wallet into the sale.
3. A buyer wraps USDT into cUSDT, proves Spotify account ownership once, and pays a hidden amount.
4. The sale keeps the cUSDT and records a hidden note for how many project tokens that wallet is owed.
5. On cancel, or after the window, the raised total and the tokens sold are decrypted and written in the clear.
6. Under the soft cap, or if the owner canceled, buyers take their cUSDT back and the project tokens return to the owner. The sale shows as canceled.
7. Over the soft cap, the owner is paid the full raised amount in cUSDT. Buyers claim the plain project tokens. Unsold tokens return to the owner.

## 📊 Sale states

| State | Name | What can happen |
| --- | --- | --- |
| 1 | Active | Buy, or the owner can cancel before the end |
| 2 | Finalizing | Raised and sold are waiting on a public decrypt |
| 3 | Refunding | Buyers take their cUSDT back. The sale shows as canceled |
| 4 | Succeeded | Buyers claim the plain project tokens. The owner already received the cUSDT |

## 🗂️ Repo

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

### 📜 Contract files

| File | Role |
| --- | --- |
| `USDT.sol` | Plain test payment token. Name `USDT`. `faucet()` mints 1,000 USDT once per wallet |
| `TokenFactory.sol` | Deploys a project BEP-20 and mints the supply to the creator |
| `CipherToken.sol` | Confidential wrapper, deployed as **Confidential USDT** / **cUSDT**. `deposit` locks USDT and mints the same amount encrypted. `unwrap` burns it and releases USDT after a decrypt |
| `CipherSale.sol` | One sale. Buy, cancel, finalize, refund, claim |
| `CipherSaleFactory.sol` | Deploys a sale and pulls `tokenPresale` in from the creator |
| `CipherSaleLib.sol` | Min, max, and hard-cap math on encrypted amounts |
| `CipherConfig.sol` | Primus ACL, executor, and decryption oracle. Calls only run on chain 97 |
| `IPrimusZKTLS.sol` | Attestation struct the buy proof must match |

### 🖥️ Web files

| Path | Role |
| --- | --- |
| `app/page.tsx` | Home |
| `app/sales` | Explore sales |
| `app/sale/[address]` | One sale: terms, countdown, join, contribution, owner actions |
| `app/create-sale` | Sale form. The price is dollars per token. Spotify account ownership is the buyer check |
| `app/create-token` | Deploy the project BEP-20 |
| `app/my-sales` | Sales this wallet created |
| `app/purchases` | Sales this wallet joined |
| `app/assets` | Wrap USDT and unwrap cUSDT. Test faucet |
| `app/api/primus/sign` | Signs the zkTLS request. The app secret never reaches the browser |
| `primus/attestation.ts` | Browser proof through the Primus extension |
| `primus/gates.ts` | Buyer checks. Today: Spotify account ownership |
| `primus/fee.ts` | tBNB sent with each FHE call. Primus keeps the fee |
| `lib/read.ts` | Loads a sale from chain without a connected wallet |
| `lib/chain.ts` | Public RPC and the deployed addresses |

## 🛒 How a buy works

The buyer pays cUSDT. The project token stays in the sale until a successful claim.

- The amount is encrypted in the browser and checked on chain.
- A buy under the min, over the wallet max, or past the hard cap is cut down. The extra cUSDT is sent back in the same transaction.
- Tokens owed are `payment × presaleRate / 1e18`. The creator types a dollar price. The chain stores `presaleRate`, which is project-token wei per 1 cUSDT.
- The first buy from a wallet must carry a fresh zkTLS attestation. The condition hash, the recipient, and the age (1 day) are checked, then the attestor signature is checked. Later buys from that wallet skip the proof.
- `buy` sends `0.003` tBNB. The other FHE calls send `0.00072` tBNB. Primus does not refund the fee.

## 🏁 How finalize works

Finalize decrypts two numbers: total raised and total tokens sold. Each buyer's own payment stays encrypted.

On success the owner receives the full raised amount in cUSDT. Each buyer calls `requestClaim`, then `claim` with a decryption proof, and receives that many plain project tokens. Unsold tokens return to the owner.

On cancel or a missed soft cap, `settle` sends that buyer's cUSDT back. The project tokens return to the owner. Nothing is listed on an exchange.

## 🚀 Deployed on BNB testnet

| Contract | Address |
| --- | --- |
| USDT | `0xE249c4F91F4bA050Afa7df0EED96D842Ef9737E9` |
| cUSDT | `0xDf37849835556742187FD52a1869FE8B630F5b7C` |
| Token factory | `0x12081697EB224a320D818444323C0d334862Cb34` |
| Sale factory | `0xD5D49dc874dD90Ee9d63e9c221a10c3EcbBAED21` |

zkTLS app `0x347e1761d0ea0d09a16fa5c93761c1d03f90339a`, Spotify template `be6b4aaa-cc05-431e-b304-75e99a4868fc`.

The app still reads these through `NEXT_PUBLIC_CHT` (USDT) and `NEXT_PUBLIC_CCHT` (cUSDT).

## ▶️ Run it

Contracts:

```bash
cd contract
npm install
npm run build
npm run abi
```

`contract/.env` needs `PRIVATE_KEY` for deploy. `npm run deploy` sends USDT, cUSDT, the token factory, and the sale factory. Copy the printed addresses into `web/.env.local`.

Web:

```bash
cd web
npm install
npm run dev
```

`web/.env.local` needs the public addresses above, `NEXT_PUBLIC_PRIMUS_APP_ID`, `NEXT_PUBLIC_PRIMUS_TEMPLATE_ID`, `PRIMUS_APP_SECRET`, and `NEXT_PUBLIC_REOWN_PROJECT_ID`. Keep the secret on the server. The app reads sales from `https://bsc-testnet-rpc.publicnode.com`.

A buyer needs the Primus browser extension, tBNB for FHE fees, USDT from the Assets faucet, and cUSDT from wrapping.

## 🧩 Primus

These are the Primus contracts CipherSale calls on BNB testnet.

| | Contract | Address |
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
