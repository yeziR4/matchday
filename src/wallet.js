function causes(error) {
  return [error?.info?.error?.data?.originalError, error?.data?.originalError,
    error?.info?.error, error?.error, error?.cause, error].filter(Boolean);
}
export function walletError(error) {
  const list = causes(error);
  if (list.some(e => Number(e.code) === 4001 || e.code === 'ACTION_REJECTED'))
    return 'Wallet request cancelled. No new receipt was confirmed.';
  if (list.some(e => Number(e.code) === -32002))
    return 'A wallet request is already open. Open MetaMask and complete or dismiss it, then try again.';
  if (list.some(e => e.code === 'INSUFFICIENT_FUNDS' || /insufficient funds/i.test(e.message || '')))
    return 'You need native BOT on BOT Chain Mainnet to pay the receipt gas fee.';
  const message = list.map(e => e.message || e.shortMessage).find(m => m && !/could not coalesce|unknown error/i.test(m));
  return message || 'MetaMask could not complete the request. Select BOT Chain Mainnet (677) in your wallet and retry.';
}
export async function ensureChain(provider, chain, pause = ms => new Promise(r => setTimeout(r, ms))) {
  const matches = value => BigInt(value) === BigInt(chain.id);
  if (matches(await provider.request({method:'eth_chainId'}))) return;
  try {
    await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:chain.hex}]});
  } catch(e) {
    if (!causes(e).some(x => Number(x.code) === 4902)) throw e;
    await provider.request({method:'wallet_addEthereumChain',params:[{
      chainId:chain.hex,chainName:chain.name,nativeCurrency:{name:'BOT',symbol:'BOT',decimals:18},
      rpcUrls:[chain.rpc],blockExplorerUrls:[chain.explorer]
    }]});
    await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:chain.hex}]});
  }
  // Some injected providers resolve the switch before their chain state updates.
  for(let attempt=0;attempt<20;attempt++) {
    if(matches(await provider.request({method:'eth_chainId'})))return;
    await pause(250);
  }
  throw Error('The wallet has not switched to BOT Chain Mainnet yet. Select network 677 in MetaMask and try again.');
}
