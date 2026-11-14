// Copied from contract/artifacts/contracts/CipherSaleFactory.sol/CipherSaleFactory.json
export const saleFactoryAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "payment_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "primus_",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "sale",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SaleCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "allSales",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "projectToken",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "attConditions",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "metadata",
        "type": "string"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "tokenPresale",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "softCap",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "hardCap",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minContribution",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxContribution",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "presaleRate",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "start",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "end",
            "type": "uint64"
          }
        ],
        "internalType": "struct CipherSale.SaleOptions",
        "name": "opts",
        "type": "tuple"
      }
    ],
    "name": "createSale",
    "outputs": [
      {
        "internalType": "address",
        "name": "sale",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "getSalesByCreator",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "payment",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "primus",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
