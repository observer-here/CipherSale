# Web

Next.js app for CipherSale. Reads sales from the public BNB testnet RPC. zkTLS signing stays in `src/app/api/primus/sign`.

```bash
npm install
npm run build
npm run start
```

Copy `.env.example` to `.env.local` and fill the addresses plus the Primus app id, template id, and server secret. The root README lists the deployed contracts and what each page does.
