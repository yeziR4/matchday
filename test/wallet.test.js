import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureChain,walletError} from '../src/wallet.js';
const chain={id:677,hex:'0x2a5',name:'BOT Chain',rpc:'https://rpc.botchain.ai',explorer:'https://scan.botchain.ai'};
test('already correct chain does not trigger network switch',async()=>{const calls=[];await ensureChain({request:async x=>{calls.push(x.method);return '0x2a5';}},chain);assert.deepEqual(calls,['eth_chainId']);});
test('waits for delayed chain update',async()=>{let reads=0;let waits=0;await ensureChain({request:async x=>x.method==='eth_chainId'?(++reads>2?'0x2a5':'0x1'):null},chain,async()=>{waits++;});assert.equal(waits,1);});
test('nested unknown-chain error adds network before retry',async()=>{let added=false;let switched=false;await ensureChain({request:async x=>{if(x.method==='eth_chainId')return switched?'0x2a5':'0x1';if(x.method==='wallet_addEthereumChain'){added=true;return;}if(!added)throw {info:{error:{code:4902}}};switched=true;}},chain);assert.ok(added&&switched);});
test('extracts actionable nested wallet errors',()=>{assert.match(walletError({shortMessage:'could not coalesce error',info:{error:{code:-32002,message:'pending'}}}),/already open/);assert.match(walletError({info:{error:{message:'RPC unavailable'}}}),/RPC unavailable/);assert.match(walletError({code:4001}),/cancelled/);});
