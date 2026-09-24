import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveOrigin } from '../server/origin.js';
test('normalizes public origins for wallet signing and CSRF comparison',()=>{
  assert.equal(resolveOrigin({APP_ORIGIN:' https://matchday.example/ '}),'https://matchday.example');
  assert.equal(resolveOrigin({APP_ORIGIN:'https://matchday.example:443/'}),'https://matchday.example');
});
test('Railway public domain replaces missing or copied localhost origin',()=>{
  const env={RAILWAY_PUBLIC_DOMAIN:'matchday.up.railway.app'};
  assert.equal(resolveOrigin(env),'https://matchday.up.railway.app');
  assert.equal(resolveOrigin({...env,APP_ORIGIN:'http://localhost:3000'}),'https://matchday.up.railway.app');
  assert.equal(resolveOrigin({...env,APP_ORIGIN:'https://custom.example/'}),'https://custom.example');
});
test('local fallback is retained and unsafe URL schemes are rejected',()=>{
  assert.equal(resolveOrigin({},3000),'http://localhost:3000');
  assert.throws(()=>resolveOrigin({APP_ORIGIN:'javascript:alert(1)'}));
  assert.throws(()=>resolveOrigin({APP_ORIGIN:'https://user:pass@example.com'}));
});
