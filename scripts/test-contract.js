import assert from "node:assert/strict";
import {
  JsonRpcProvider,
  ContractFactory,
  keccak256,
  toUtf8Bytes,
  ZeroHash,
} from "ethers";
import { compile } from "./compile-contract.js";
// Intentionally fixed to an ephemeral local test chain; never uses a funded wallet.
const provider = new JsonRpcProvider("http://127.0.0.1:8545");
assert.equal(
  (await provider.getNetwork()).chainId,
  1337n,
  "Use a local Ganache chain with ID 1337",
);
const signer = await provider.getSigner(0);
const other = await provider.getSigner(1);
const artifact = compile();
const contract = await new ContractFactory(
  artifact.abi,
  artifact.bytecode,
  signer,
).deploy();
await contract.waitForDeployment();
const block = await provider.getBlock("latest");
const deadline = block.timestamp + 3600;
const digest = keccak256(toUtf8Bytes("local-test-receipt"));
const tx = await contract.commit(digest, deadline);
const receipt = await tx.wait();
assert.equal(receipt.status, 1);
assert.ok((await contract.commitments(await signer.getAddress(), digest)) > 0n);
const event = receipt.logs
  .map((l) => {
    try {
      return contract.interface.parseLog(l);
    } catch {
      return null;
    }
  })
  .find((l) => l?.name === "PredictionCommitted");
assert.equal(event.args.digest, digest);
assert.equal(event.args.player, await signer.getAddress());
await assert.rejects(() => contract.commit.staticCall(digest, deadline));
await assert.rejects(() => contract.commit.staticCall(ZeroHash, deadline));
await assert.rejects(() =>
  contract.commit.staticCall(keccak256(toUtf8Bytes("expired")), 1),
);
await (await contract.connect(other).commit(digest, deadline)).wait();
assert.ok((await contract.commitments(await other.getAddress(), digest)) > 0n);
await assert.rejects(() =>
  signer.estimateGas({ to: contract.target, value: 1n }),
);
console.log(
  "PASS: local EVM deployment, timestamp storage, event fields, duplicate protection, empty digest rejection, expired deadline rejection, per-wallet isolation, and rejection of value transfers.",
);
await provider.destroy();
