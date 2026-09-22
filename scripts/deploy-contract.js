import "dotenv/config";
import { JsonRpcProvider, Wallet, ContractFactory } from "ethers";
import { mkdirSync, writeFileSync } from "node:fs";
import { compile } from "./compile-contract.js";
const mainnet = process.argv.includes("--mainnet");
const chainId = mainnet ? 677n : 968n;
const rpc = mainnet ? "https://rpc.botchain.ai" : "https://rpc.bohr.life";
if (!process.env.DEPLOYER_PRIVATE_KEY)
  throw new Error(
    "Set DEPLOYER_PRIVATE_KEY in your local environment. Never commit or share it.",
  );
const provider = new JsonRpcProvider(rpc);
if ((await provider.getNetwork()).chainId !== chainId)
  throw new Error("Unexpected network");
const wallet = new Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
const artifact = compile();
const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
const tx = await factory.getDeployTransaction();
const gas = await provider.estimateGas({ ...tx, from: wallet.address });
const fees = await provider.getFeeData();
console.log(
  `Network ${chainId}; deployer ${wallet.address}; estimated gas ${gas}; gas price ${fees.gasPrice}.`,
);
if (!process.argv.includes("--send")) {
  console.log(
    "Dry run only. Add --send to deploy after reviewing the estimate.",
  );
  process.exit(0);
}
const contract = await factory.deploy();
await contract.waitForDeployment();
const address = await contract.getAddress();
mkdirSync("artifacts", { recursive: true });
writeFileSync(
  `artifacts/deployment-${chainId}.json`,
  JSON.stringify(
    {
      chainId: String(chainId),
      address,
      transactionHash: contract.deploymentTransaction().hash,
    },
    null,
    2,
  ),
);
console.log(
  `Deployed ${address}. Set PREDICTION_CONTRACT_ADDRESS in .env and restart the app.`,
);
