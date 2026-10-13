import { normalizeMarket } from './analytics.mjs';
import { summarizeTradeActivity } from './activity.mjs';
import {demoMarkets,demoTrades} from './demo.mjs';
const cache=new Map();
const API_BASE='https://live-api.panta.market/api/v1';
const MAX_CACHE=150;
function config(env){
  const base=String(env.PANTA_API_BASE_URL||API_BASE).replace(/\/$/,'');
  if(!/^https:\/\/[a-z0-9.-]+\/api\/v1$/i.test(base)) throw new Error('Invalid PANTA_API_BASE_URL');
  return {base,key:String(env.PANTA_API_KEY||'')};
}
export function isLiveReady(env){return Boolean(env.PANTA_API_KEY)}
export async function pantaGet(env,path,ttl=45000){
  const {base,key}=config(env);
  if(!key) throw Object.assign(new Error('Panta API key is missing. Configure PANTA_API_KEY in server/worker secrets.'),{status:503,code:'PANTA_KEY_REQUIRED'});
  if(!/^\/(?:markets\/|categories\/)/.test(path)||/\.{2}|\/\//.test(path)) throw new Error('Invalid Panta path');
  const ck=`${base}|${path}|${key.slice(-8)}`;
  const old=cache.get(ck);if(old && Date.now()<old.expires)return old.data;
  let response;
  try { response=await fetch(`${base}${path}`,{method:'GET',headers:{'X-Api-Key':key,'Accept':'application/json'},signal:AbortSignal.timeout(7500)}); }
  catch(e){throw Object.assign(new Error('Panta network request failed or timed out'),{status:502,code:'PANTA_NETWORK'});}
  let payload;try{payload=await response.json();}catch{throw Object.assign(new Error('Panta returned a non-JSON response'),{status:502,code:'PANTA_BAD_RESPONSE'});}
  if(!response.ok) throw Object.assign(new Error(String(payload.message||`Panta responded HTTP ${response.status}`).slice(0,250)),{status:response.status===429?429:502,code:String(payload.code||'PANTA_UPSTREAM')});
  if(cache.size>=MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(ck,{data:payload,expires:Date.now()+ttl}); return payload;
}
export async function listMarkets(env,{mode='demo',limit=30,cursor='',status=''}={}){
  if(mode==='demo')return {items:demoMarkets.map(m=>normalizeMarket(m,{demo:true})),nextCursor:null,source:'demo'};
  const size=Math.max(1,Math.min(50,Math.floor(limit)||30));
  if(cursor && (cursor.length>1000 || !/^[A-Za-z0-9+/_=-]+$/.test(cursor))) throw Object.assign(new Error('Invalid pagination cursor'),{status:400,code:'INVALID_CURSOR'});
  if(status && !['primary','secondary','resolved','cancelled'].includes(status)) throw Object.assign(new Error('Invalid Panta market status'),{status:400,code:'INVALID_STATUS'});
  const query=`/markets/?limit=${size}${status?`&status=${status}`:''}${cursor?`&cursor=${encodeURIComponent(cursor)}`:''}`;
  const data=await pantaGet(env,query,60000);
  if(!Array.isArray(data.items)) throw Object.assign(new Error('Unexpected Panta market list schema'),{status:502,code:'PANTA_SCHEMA'});
  return {items:data.items.map(m=>normalizeMarket(m)),nextCursor:data.nextCursor||null,source:'panta'};
}
export async function getMarket(env,id,{mode='demo'}={}){
  if(mode==='demo') {const m=demoMarkets.find(x=>x.marketId===id);if(!m)throw Object.assign(new Error('Demo market not found'),{status:404,code:'MARKET_NOT_FOUND'});return normalizeMarket(m,{demo:true});}
  if(!/^[1-9A-HJ-NP-Za-km-z]{30,60}$/.test(id))throw Object.assign(new Error('Invalid Panta market identifier'),{status:400,code:'INVALID_MARKET_ID'});
  const row=await pantaGet(env,`/markets/${id}/`,30000);
  const market=normalizeMarket(row);
  return {...market,id:market.id||id};
}
export async function getTrades(env,id,{mode='demo'}={}){
  if(mode==='demo') {if(!demoMarkets.some(x=>x.marketId===id))throw Object.assign(new Error('Demo market not found'),{status:404});const items=demoTrades(id);return {items,activity:summarizeTradeActivity(items),source:'demo'};}
  if(!/^[1-9A-HJ-NP-Za-km-z]{30,60}$/.test(id))throw Object.assign(new Error('Invalid Panta market identifier'),{status:400});
  const row=await pantaGet(env,`/markets/${id}/trades/?limit=40`,30000);
  const items=Array.isArray(row.items)?row.items.slice(0,40):[];
  return {items,activity:summarizeTradeActivity(items),source:'panta'};
}
