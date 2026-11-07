# Contracts

Hardhat project for CipherSale on BNB testnet (chain id 97). Solidity 0.8.27.

```bash
npm install
npm run build
npm run abi
npm run deploy
```

`abi` copies artifacts into `web/src/abi`. Deploy reads `PRIVATE_KEY` from `.env` and prints CHT, cCHT, and the factories. The full map of files and the sale flow is in the root README.
