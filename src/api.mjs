import {analyzeMarket} from './analytics.mjs';
import {isLiveReady,listMarkets,getMarket,getTrades} from './panta.mjs';
import {explainMarket} from './ai.mjs';
const requests=new Map();
const aiRequests=new Map();
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'}});
function enforceLimit(req){
 const ip=(req.headers.get('CF-Connecting-IP')||'local').slice(0,100);const now=Date.now();
 const cur=requests.get(ip)||{n:0,t:now};if(now-cur.t>60_000){cur.n=0;cur.t=now;}cur.n++;
 if(requests.size>2000){requests.clear();}
 requests.set(ip,cur);return cur.n<=70;
}
const idFrom=(pathname,suffix='')=>{const p=pathname.slice('/api/market/'.length);return decodeURIComponent(suffix?p.slice(0,-suffix.length):p);};
export async function handleApi(request,env={}){
 try{
  const url=new URL(request.url);
  if(!enforceLimit(request))return json({error:'Too many requests',code:'RATE_LIMITED'},429);
  if(request.method==='GET'&&url.pathname==='/api/status')return json({ok:true,version:'0.1.4',pantaConfigured:isLiveReady(env),aiConfigured:Boolean(env.LLM_ENDPOINT&&env.LLM_API_KEY&&env.LLM_MODEL),defaultMode:isLiveReady(env)?'live':'demo',tradingEnabled:false});
  const mode=url.searchParams.get('mode')||'demo';
  if(!['demo','live'].includes(mode))return json({error:'Invalid mode',code:'INVALID_MODE'},400);
  if(request.method==='GET'&&url.pathname==='/api/markets'){
   const result=await listMarkets(env,{mode,limit:Number(url.searchParams.get('limit')||30),cursor:url.searchParams.get('cursor')||'',status:url.searchParams.get('status')||''});
   return json({...result,analysisCount:result.items.length});
  }
  if(request.method==='GET'&&url.pathname.startsWith('/api/market/')&&url.pathname.endsWith('/trades')){
   const id=idFrom(url.pathname,'/trades'); return json(await getTrades(env,id,{mode}));
  }
  if(request.method==='GET'&&url.pathname.startsWith('/api/market/')){
   const id=idFrom(url.pathname);const item=await getMarket(env,id,{mode}); return json({market:item,analysis:analyzeMarket(item,item.history)});
  }
  if(request.method==='POST'&&url.pathname==='/api/explain'){
   if(Number(request.headers.get('content-length')||0)>3000)return json({error:'Request too large'},413);
   const raw=await request.text();if(raw.length>3000)return json({error:'Request too large'},413);
   let payload;try{payload=JSON.parse(raw);}catch{return json({error:'Malformed JSON'},400);}
   const selection=String(payload?.id||'');if(selection.length>130)return json({error:'Invalid identifier'},400);
   const model=payload?.mode||'demo';if(!['demo','live'].includes(model))return json({error:'Invalid mode'},400);
   const wantsGenerative=Boolean(payload?.generative);
   if(wantsGenerative&&env.LLM_ENDPOINT&&env.LLM_API_KEY&&env.LLM_MODEL){
    const ip=(request.headers.get('CF-Connecting-IP')||'local').slice(0,100);const now=Date.now();
    let quota=aiRequests.get(ip)||{n:0,t:now};if(now-quota.t>3_600_000)quota={n:0,t:now};
    if(quota.n>=12)return json({error:'Hourly AI explanation limit reached',code:'AI_RATE_LIMITED'},429);
    quota.n++;if(aiRequests.size>2000)aiRequests.clear();aiRequests.set(ip,quota);
   }
   const market=await getMarket(env,selection,{mode:model});
   const explanation=await explainMarket(env,market,market.history,wantsGenerative);
   return json({...explanation,market});
  }
  return json({error:'Route not found'},404);
 }catch(err){
  const status=Number.isInteger(err.status)&&err.status>=400&&err.status<=599?err.status:500;
  return json({error:status===500?'Unexpected server error':String(err.message||'Request failed'),code:String(err.code||'SERVER_ERROR')},status);
 }
}
