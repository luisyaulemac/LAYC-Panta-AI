const num = v => v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export function normalizeMarket(item,{demo=false}={}) {
  if (!item || typeof item !== 'object') throw new Error('Invalid market');
  const yes=num(item.yesPrice??item.primaryYesPrice??item.secondaryYesPrice);
  const no=num(item.noPrice??item.primaryNoPrice??item.secondaryNoPrice);
  return {
    id:String(item.marketId??item.id??'').slice(0,130),title:String(item.title??'').trim().slice(0,300)||'Untitled market',
    description:String(item.description??'').slice(0,1000),category:String(item.category??'other').toLowerCase().slice(0,40),
    phase:String(item.phase??item.status??'unknown').toLowerCase().slice(0,32),volume:num(item.volumeUsdc),
    yes:yes===null?null:clamp(yes,0,1),no:no===null?null:clamp(no,0,1),
    endTime:num(item.endTime),region:String(item.region??'Global').slice(0,60),
    source:demo?'demo':'panta',history:demo?item.history??[]:[]
  };
}
export function analyzeMarket(market,history=[]) {
  const yes=num(market?.yes), no=num(market?.no), volume=num(market?.volume);
  const priceAvailable=yes!==null&&no!==null&&yes>=0&&yes<=1&&no>=0&&no<=1;
  const uncertainty=priceAvailable?Math.round((1-Math.abs(yes-.5)*2)*100):null;
  const imbalance=priceAvailable?Math.round(Math.abs(yes-no)*100):null;
  const parity=priceAvailable?Math.abs((yes+no)-1):null;
  const snapshotValues=history.filter(v=>num(v)!==null).map(Number);
  const delta=snapshotValues.length>=2 ? Math.round((snapshotValues.at(-1)-snapshotValues[0])*10)/10:null;
  const alerts=[];
  const endTime=num(market?.endTime);
  const eventEnd=endTime!==null&&endTime>1577836800&&endTime<4102444800?new Date(endTime*1000):null;
  const ended=eventEnd!==null&&eventEnd.getTime()<=Date.now();
  if (!priceAvailable) alerts.push({level:'info',label:'Current quotes unavailable',detail:'This Panta response did not provide both YES and NO prices. Market-detail prices depend on upstream on-chain RPC availability; missing values are not estimated.'});
  if (parity!==null&&parity>0.06) alerts.push({level:'warning',label:'Price parity gap',detail:'YES + NO differs substantially from 1. Secondary-market prices may be independently quoted; do not interpret this as arbitrage.'});
  if (priceAvailable && uncertainty>=85) alerts.push({level:'insight',label:'High disagreement',detail:'Prices imply a closely balanced YES/NO market. Market-implied prices are not verified real-world probabilities.'});
  if (priceAvailable && imbalance>=55) alerts.push({level:'insight',label:'Concentrated market signal',detail:'One side currently has a substantially higher quoted price; this is not a guaranteed outcome.'});
  if(ended && !['resolved','cancelled'].includes(String(market?.phase).toLowerCase())) alerts.push({level:'info',label:'Scheduled end passed',detail:'The catalog end timestamp is in the past. Market phase and final settlement must be checked with Panta.'});
  if (volume!==null&&volume<1000) alerts.push({level:'warning',label:'Low reported volume',detail:'Limited recorded activity can weaken price discovery.'});
  if (delta!==null&&Math.abs(delta)>=8) alerts.push({level:'insight',label:'Observed price movement',detail:`Recorded snapshots show a ${delta>0?'rise':'fall'} of ${Math.abs(delta)} percentage points. This is not a forecast.`});
  const strength= !priceAvailable?'Unknown':uncertainty>=80?'Contested':uncertainty<=25?'One-sided':'Mixed';
  const observed=delta===null?'Insufficient snapshots':(delta>2?'Rising YES':delta< -2?'Falling YES':'Stable');
  const reasons=[
    priceAvailable?`YES: ${(yes*100).toFixed(1)}% · NO: ${(no*100).toFixed(1)}%.`:'Spot prices are not available from this response.',
    volume===null?'Reported volume unavailable from Panta.':`Reported volume: ${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Math.max(0,volume))} USDC.`, 
    delta===null?'Not enough timestamped snapshots for momentum.':`Observed YES change: ${delta>0?'+':''}${delta.toFixed(1)} percentage points across recorded snapshots.`,
    eventEnd?`Scheduled market end (UTC): ${eventEnd.toISOString().slice(0,16).replace('T',' ')}. ${ended?'This deadline is in the past.':''}`:'Market end timestamp unavailable.'
  ];
  return {uncertainty,imbalance,parity,delta,alertCount:alerts.length,alerts,strength,observed,reasons,disclaimer:'Market-implied prices are signals, not objective probabilities or financial advice. No trades are available in this application.'};
}
export function filterMarkets(markets,{search='',category='all',phase='all',sort='volume'}={}){
  const s=String(search).toLowerCase().trim();
  return markets.filter(m=>(category==='all'||m.category===category)&&(phase==='all'||m.phase===phase)&&(!s||(`${m.title} ${m.category} ${m.description}`).toLowerCase().includes(s))).sort((a,b)=>{
    if(sort==='uncertainty')return (analyzeMarket(b).uncertainty??-1)-(analyzeMarket(a).uncertainty??-1);
    if(sort==='yes')return (b.yes??-1)-(a.yes??-1);
    return (b.volume??-1)-(a.volume??-1);
  });
}
