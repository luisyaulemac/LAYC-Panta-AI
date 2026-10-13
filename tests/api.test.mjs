import test from 'node:test';import assert from 'node:assert/strict';
import {handleApi} from '../src/api.mjs';
async function call(path,env={},options={}){const res=await handleApi(new Request('http://localhost'+path,options),env);return {status:res.status,data:await res.json()};}
test('Health status marks all trades disabled and Panta key not configured',async()=>{
 const x=await call('/api/status');assert.equal(x.status,200);assert.equal(x.data.tradingEnabled,false);assert.equal(x.data.pantaConfigured,false);
});
test('Status reports Live as default only when server key is present',async()=>{
 const demo=await call('/api/status');assert.equal(demo.data.defaultMode,'demo');
 const live=await call('/api/status',{PANTA_API_KEY:'mock-key'});assert.equal(live.data.defaultMode,'live');
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
test('Live market pagination forwards safe cursors without exposing credentials',async()=>{
 const old=globalThis.fetch;let requested='';
 globalThis.fetch=async(u)=>{requested=String(u);return new Response(JSON.stringify({items:[],nextCursor:null}),{status:200,headers:{'content-type':'application/json'}})};
 try{
  const ok=await call('/api/markets?mode=live&cursor=eyJpZCI6IjEifQ%3D%3D',{PANTA_API_KEY:'fake'});
  assert.equal(ok.status,200);assert.match(requested,/cursor=eyJpZCI6IjEifQ%3D%3D/);
  const bad=await call('/api/markets?mode=live&cursor=%2E%2E',{PANTA_API_KEY:'fake'});
  assert.equal(bad.status,400);assert.equal(bad.data.code,'INVALID_CURSOR');
 }finally{globalThis.fetch=old;}
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

test('Analysis returns the identical fresh market quote for synchronizing Spotlight',async()=>{
 const prior=globalThis.fetch;
 const id='9C8HiJqpnZDGt3DZBZgg9zG44aVEnJ5RRqwCumnWSMb9';
 globalThis.fetch=async(url,options)=>{
  assert.match(String(url),/\/markets\/9C8HiJqpnZDGt3DZBZgg9zG44aVEnJ5RRqwCumnWSMb9\/$/);
  assert.equal(options.headers['X-Api-Key'],'mock-secret');
  return new Response(JSON.stringify({
   title:'A real Panta market',category:'finance',phase:'secondary',
   yesPrice:'0.495',noPrice:'0.505',volumeUsdc:'499'
  }),{status:200,headers:{'content-type':'application/json'}});
 };
 try{
  const env={PANTA_API_KEY:'mock-secret'};
  const detail=await call('/api/market/'+id+'?mode=live',env);
  const explained=await call('/api/explain',env,{
   method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({id,mode:'live',generative:false})
  });
  assert.equal(detail.status,200);
  assert.equal(explained.status,200);
  assert.equal(explained.data.market.id,id);
  assert.deepEqual(explained.data.market,detail.data.market);
  assert.equal(explained.data.market.yes,0.495);
  assert.equal(explained.data.market.no,0.505);
  assert.equal(explained.data.market.volume,499);
  assert.match(explained.data.summary,/YES: 49\.5%/);
  assert.doesNotMatch(JSON.stringify(explained.data),/mock-secret/);
 }finally{globalThis.fetch=prior;}
});

test('Official Panta status filter narrows the upstream catalog and validates input',async()=>{
 const prior=globalThis.fetch;let requested='';
 globalThis.fetch=async(url)=>{requested=String(url);return new Response(JSON.stringify({items:[],nextCursor:null}),{status:200,headers:{'content-type':'application/json'}})};
 try{
  const ok=await call('/api/markets?mode=live&status=secondary',{PANTA_API_KEY:'mock'});
  assert.equal(ok.status,200);assert.match(requested,/status=secondary/);
  const primary=await call('/api/markets?mode=live&status=primary',{PANTA_API_KEY:'mock'});
  assert.equal(primary.status,200);assert.match(requested,/status=primary/);
  const unsafe=await call('/api/markets?mode=live&status=invalid',{PANTA_API_KEY:'mock'});
  assert.equal(unsafe.status,400);assert.equal(unsafe.data.code,'INVALID_STATUS');
  assert.doesNotMatch(JSON.stringify(ok.data),/mock/);
 }finally{globalThis.fetch=prior;}
});
