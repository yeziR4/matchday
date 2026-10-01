import { JsonRpcProvider, Contract, FetchRequest } from 'ethers';

// Read only: no server signer or funded key is required.
export async function readCommitment(contract, address, digest) {
  const connection = new FetchRequest('https://rpc.botchain.ai');
  connection.timeout = 15000;
  const provider = new JsonRpcProvider(connection, 677);
  try {
    if ((await provider.getNetwork()).chainId !== 677n) throw Error('Wrong network');
    return Number(await new Contract(contract,
      ['function commitments(address,bytes32) view returns (uint64)'], provider
    ).commitments(address, digest));
  } finally { provider.destroy(); }
}
