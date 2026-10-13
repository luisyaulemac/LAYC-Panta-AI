import test from 'node:test';import assert from 'node:assert/strict';
import {handleApi} from '../src/api.mjs';
async function call(path,env={},options={}){const res=await handleApi(new Request('http://localhost'+path,options),env);return {status:res.status,data:await res.json()};}
test('Health status marks all trades disabled and Panta key not configured',async()=>{
 const x=await call('/api/status');assert.equal(x.status,200);assert.equal(x.data.tradingEnabled,false);assert.equal(x.data.pantaConfigured,false);
});
test('Demo list comes from mock data and declares provenance',async()=>{
 const r=await call('/api/markets?mode=demo');assert.equal(r.status,200);assert.equal(r.data.source,'demo');assert.ok(r.data.items.length>=5);assert.ok(r.data.items.every(x=>x.source==='demo'));
});
test('Demo detail and insights use matching market',async()=>{
 const d=await call('/api/market/demo-sol-250?mode=demo');assert.equal(d.status,200);assert.equal(d.data.market.yes,.62);
 const a=await call('/api/explain',{}, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:'demo-sol-250',mode:'demo'})});assert.equal(a.status,200);assert.match(a.data.summary,/fiction|interpretation|prediction/i);assert.match(a.data.limitations,/fiction/i);
});
test('Live mode fails transparently without credentials, never returns demo as live',async()=>{
 const r=await call('/api/markets?mode=live');assert.equal(r.status,503);assert.equal(r.data.code,'PANTA_KEY_REQUIRED');
});
test('Trading and write routes are not exposed',async()=>{
 const r=await call('/api/buy',{},{method:'POST',headers:{'content-type':'application/json'},body:'{}'});assert.equal(r.status,404);
});
test('Disallow unsafe mode and invalid Panta market address',async()=>{
 const bad=await call('/api/markets?mode=unsafe');assert.equal(bad.status,400);
 const id=await call('/api/market/not-base58?mode=live',{PANTA_API_KEY:'fake'});assert.equal(id.status,400);
});
test('Live Panta adapter sends server-side X-Api-Key and handles catalog prices as null',async()=>{
 const prior=globalThis.fetch;let requested='';let key='';
 globalThis.fetch=async(u,options)=>{requested=String(u);key=options.headers['X-Api-Key'];return new Response(JSON.stringify({items:[{marketId:'11111111111111111111111111111111',title:'A live catalog item',yesPrice:null,noPrice:null,volumeUsdc:'30'}],nextCursor:null}),{status:200,headers:{'content-type':'application/json'}})};
 try{const r=await call('/api/markets?mode=live',{PANTA_API_KEY:'fake-secret'});assert.equal(r.status,200);assert.equal(r.data.source,'panta');assert.equal(r.data.items[0].yes,null);assert.equal(key,'fake-secret');assert.match(requested,/\/api\/v1\/markets\/\?limit=/);assert.doesNotMatch(JSON.stringify(r.data),/fake-secret/);}
 finally{globalThis.fetch=prior;}
});
test('Read-only demo trade tape is available',async()=>{
 const d=await call('/api/market/demo-sol-250/trades?mode=demo');assert.equal(d.status,200);assert.equal(d.data.source,'demo');assert.equal(d.data.items.length,7);
});
test('Generative AI is optional; requesting it with no config safely falls back',async()=>{
 const d=await call('/api/explain',{}, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:'demo-cpi',generative:true})});assert.equal(d.status,200);assert.match(d.data.warning,/not configured/i);
});
test('Reject excessively large explanation request',async()=>{
 const d=await call('/api/explain',{}, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:'x'.repeat(3500)})});assert.equal(d.status,413);
});
