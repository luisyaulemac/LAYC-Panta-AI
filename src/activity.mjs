// Summarize bounded Panta catalog trade rows. No price, monetary, or probability inference.
const amount=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
const time=v=>Number.isInteger(Number(v))&&Number(v)>=1577836800&&Number(v)<4102444800?Number(v):null;
export function summarizeTradeActivity(rows,nowSeconds=Math.floor(Date.now()/1000)){
 const items=Array.isArray(rows)?rows.slice(0,200):[];
 let yesOnly=0,noOnly=0,both=0,unclassified=0,recent24h=0,dated=0,primary=0,secondary=0,latest=null;
 const wallets=new Set(),signatures=new Set();
 for(const r of items){
  if(!r||typeof r!=='object'){unclassified++;continue;}
  const y=amount(r.yesAmount),n=amount(r.noAmount);
  if(y!==null&&y>0&&n!==null&&n>0)both++;
  else if(y!==null&&y>0)yesOnly++;
  else if(n!==null&&n>0)noOnly++;
  else unclassified++;
  if(r.isPrimary===true)primary++;
  else if(r.isPrimary===false)secondary++;
  const wallet=String(r.wallet??'');
  if(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet))wallets.add(wallet);
  const sig=String(r.signature??'');
  if(/^[1-9A-HJ-NP-Za-km-z]{60,100}$/.test(sig))signatures.add(sig);
  const ts=time(r.blockTime);
  if(ts!==null){dated++;if(latest===null||ts>latest)latest=ts;if(ts<=nowSeconds&&ts>=nowSeconds-86400)recent24h++;}
 }
 return {sampleCount:items.length,yesOnly,noOnly,both,unclassified,uniqueWallets:wallets.size,verifiedSignatures:signatures.size,dated,recent24h,primary,secondary,latestBlockTime:latest,
  observation:yesOnly>noOnly?'More YES-only rows':noOnly>yesOnly?'More NO-only rows':yesOnly+noOnly+both?'Balanced single-sided row counts':'No directional row evidence',
  limitations:'Counts cover only returned Panta trade rows; they are not probabilities, net positions, monetary volume, or a full trading history.'};
}
