import solc from "solc";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
export function compile() {
  const source = readFileSync(
    new URL("../contracts/PredictionBook.sol", import.meta.url),
    "utf8",
  );
  const input = {
    language: "Solidity",
    sources: { "PredictionBook.sol": { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris",
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"],
        },
      },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors || []).filter((e) => e.severity === "error");
  if (errors.length)
    throw new Error(errors.map((e) => e.formattedMessage).join("\n"));
  const c = output.contracts["PredictionBook.sol"].PredictionBook;
  return {
    contractName: "PredictionBook",
    compiler: solc.version(),
    abi: c.abi,
    bytecode: `0x${c.evm.bytecode.object}`,
    deployedBytecode: `0x${c.evm.deployedBytecode.object}`,
    input,
  };
}
if (process.argv[1]?.endsWith("compile-contract.js")) {
  mkdirSync("artifacts", { recursive: true });
  const artifact = compile();
  writeFileSync(
    "artifacts/PredictionBook.json",
    JSON.stringify(artifact, null, 2),
  );
  console.log(
    `PredictionBook compiled with ${artifact.compiler}. No deployment or transaction submitted.`,
  );
}
