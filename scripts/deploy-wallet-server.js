import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { JsonRpcProvider } from 'ethers';
import { compile } from './compile-contract.js';

// Local-only signing companion. It never receives private keys or broadcasts transactions.
const artifact = compile();
const account = '0x4ad285a88cd15bf1ade6aa0e66e6fa468a8d8f40';
const origin = 'http://localhost:3003';
const provider = new JsonRpcProvider('https://rpc.botchain.ai');
const html = readFileSync(new URL('./deploy-wallet.html', import.meta.url));
createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
  if (req.headers.host !== 'localhost:3003') { res.writeHead(403); return res.end(); }
  try {
    if (req.method === 'GET' && req.url === '/') { res.setHeader('Content-Type', 'text/html'); return res.end(html); }
    if (req.method === 'GET' && req.url === '/artifact') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ bytecode: artifact.bytecode, account, chainId:'0x2a5' }));
    }
    if (req.method === 'POST' && req.url === '/verify' && req.headers.origin === origin) {
      let body = '';
      for await (const chunk of req) { body += chunk; if (body.length > 512) throw Error('Request too large'); }
      const { hash } = JSON.parse(body);
      if (!/^0x[0-9a-f]{64}$/i.test(hash)) throw Error('Invalid transaction hash');
      if ((await provider.getNetwork()).chainId !== 677n) throw Error('Wrong network');
      const [tx, receipt] = await Promise.all([provider.getTransaction(hash), provider.getTransactionReceipt(hash)]);
      if (!receipt) { res.setHeader('Content-Type','application/json'); return res.end(JSON.stringify({pending:true})); }
      if (!tx || receipt.status !== 1 || tx.to !== null || tx.from.toLowerCase() !== account || tx.data.toLowerCase() !== artifact.bytecode.toLowerCase() || tx.value !== 0n || !receipt.contractAddress) throw Error('Transaction does not match the intended Matchday deployment');
      const code = await provider.getCode(receipt.contractAddress);
      if (code.toLowerCase() !== artifact.deployedBytecode.toLowerCase()) throw Error('Deployed runtime does not match compiled contract');
      const result = {chainId:677,address:receipt.contractAddress,transactionHash:hash,verified:true};
      mkdirSync('artifacts',{recursive:true});
      writeFileSync('artifacts/deployment-677.json',JSON.stringify(result,null,2));
      res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(result));
    }
    res.writeHead(404);res.end('Not found');
  } catch(e) { res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.shortMessage || e.message})); }
}).listen(3003,'127.0.0.1',()=>console.log(`Wallet deployment review ready at ${origin}. No transaction submitted.`));
