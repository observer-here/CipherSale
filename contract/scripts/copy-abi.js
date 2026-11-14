// Copies compiled ABIs from artifacts into web/src/abi. Run after `npm run build`: npm run abi
const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "..", "..", "web", "src", "abi");
const files = {
  "cipher-sale.ts": [
    ["cipherSaleAbi", "CipherSale.sol/CipherSale"],
    ["bep20Abi", "TokenFactory.sol/ProjectToken"],
  ],
  "sale-factory.ts": [["saleFactoryAbi", "CipherSaleFactory.sol/CipherSaleFactory"]],
  "cipher-token.ts": [["cipherTokenAbi", "CipherToken.sol/CipherToken"]],
  "token-factory.ts": [["tokenFactoryAbi", "TokenFactory.sol/TokenFactory"]],
  "usdt.ts": [["usdtAbi", "USDT.sol/USDT"]],
};

for (const [file, entries] of Object.entries(files)) {
  const body = entries.map(([name, artifact]) => {
    const source = `contracts/${artifact}.json`;
    const { abi } = require(path.join(__dirname, "..", "artifacts", source));
    return `// Copied from contract/artifacts/${source}\nexport const ${name} = ${JSON.stringify(abi, null, 2)} as const;\n`;
  });
  fs.writeFileSync(path.join(out, file), body.join("\n"));
  console.log(`web/src/abi/${file}`);
}
