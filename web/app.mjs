const $=s=>document.querySelector(s);
const state={mode:'demo',all:[],selected:null,status:null,search:'',category:'all',sort:'volume',showResolved:false,showUntitled:false,nextCursor:null,loadingMore:false,requestId:0};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const usd=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n)||0);
const pct=v=>v===null||v===undefined?'—':`${(Number(v)*100).toFixed(0)}%`;
const prettynum=n=>{const x=Math.max(0,Number(n)||0);return x>=1e6?`${(x/1e6).toFixed(2)}M`:x>=1e3?`${(x/1e3).toFixed(1)}K`:`${x.toLocaleString('en-US',{maximumFractionDigits:2})}`};
const niceTime=()=>new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
const categoryIcon={crypto:'₿',finance:'▥',sports:'◉',science:'✦',world:'◈',politics:'⚑',entertainment:'★',other:'◇'};
async function api(url,options={}){const resp=await fetch(url,options);let data;try{data=await resp.json()}catch{throw new Error(`Invalid server response (${resp.status})`)}if(!resp.ok)throw new Error(data.error||'Request failed');return data;}
function observed(m){
 if(m.source==='demo')return m.history||[];
 const key=`layc:panta:market:${m.id}`,now=Date.now();let history=[];
 try{history=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(history))history=[];}catch{history=[];}
 if(m.yes!==null){const val={t:now,v:Math.round(m.yes*1000)/10};if(!history.length||now-history.at(-1).t>60000)history.push(val);else history[history.length-1]=val;history=history.slice(-48);try{localStorage.setItem(key,JSON.stringify(history))}catch{}}
 return history.map(v=>v.v);
}
function quickAnalysis(m){let c=0;if(m.yes===null)return {uncertainty:null,alerts:0};const u=Math.round((1-Math.abs(m.yes-.5)*2)*100);if(u>=85)c++;if(Math.abs(m.yes-m.no)>=.55)c++;if(m.volume<1000)c++;return{uncertainty:u,alerts:c};}
function filtered(){const q=state.search.toLowerCase().trim();return state.all.filter(m=>{
 if(state.mode==='live'){
  if(!state.showResolved&&(['resolved','closed','settled','expired'].includes(String(m.phase).toLowerCase())||(Number(m.endTime)>0&&Number(m.endTime)*1000<Date.now())))return false;
  if(!state.showUntitled&&(!m.title||m.title==='Untitled market'))return false;
 }
 return (state.category==='all'||m.category===state.category)&&(!q||`${m.title} ${m.description} ${m.category}`.toLowerCase().includes(q));
 }).sort((a,b)=>state.sort==='uncertainty'?(quickAnalysis(b).uncertainty??-1)-(quickAnalysis(a).uncertainty??-1):state.sort==='yes'?(b.yes??-1)-(a.yes??-1):b.volume-a.volume)}
function setText(id,text){$(id).textContent=text}
function fillCategories(){const options=[...new Set(state.all.map(m=>m.category))].sort();$('#categoryFilter').innerHTML='<option value="all">All categories</option>'+options.map(c=>`<option value="${esc(c)}">${esc(c[0].toUpperCase()+c.slice(1))}</option>`).join('');if(!options.includes(state.category))state.category='all';$('#categoryFilter').value=state.category;}
function renderStats(){const shown=filtered(),priced=shown.filter(m=>m.yes!==null);setText('#statMarkets',String(shown.length));setText('#statVolume',usd(shown.reduce((s,m)=>s+m.volume,0)));setText('#statContested',priced.length?String(priced.filter(m=>quickAnalysis(m).uncertainty>=80).length):'—');setText('#statAlerts',priced.length?String(shown.reduce((s,m)=>s+quickAnalysis(m).alerts,0)):'—');}
function renderList(){const rows=filtered();setText('#marketCount',`${rows.length} markets`);renderMore();if(!rows.length){$('#marketList').innerHTML='<div class="loading">No markets match your filters. In Live mode, include resolved or untitled markets, or load another page.</div>';return;}
 $('#marketList').innerHTML=rows.map(m=>{
 const total=(m.yes!==null&&m.no!==null)?m.yes+m.no:0;
 const yeswidth=total?Math.round(m.yes/total*100):0;
 return `<button type="button" class="market-row ${state.selected?.id===m.id?'active':''}" data-id="${esc(m.id)}" aria-label="Inspect ${esc(m.title)}">
  <span class="market-info"><span class="market-icon">${esc(categoryIcon[m.category]||'◇')}</span><span><span class="market-title">${esc(m.title)}</span><span class="market-tags">${esc(m.category)} <span class="dot">●</span> ${esc(m.phase)}</span></span></span>
  <span class="market-prices"><span class="yes">${pct(m.yes)}</span><span class="no">${pct(m.no)}</span><span class="price-bar"><span class="green" style="width:${yeswidth}%"></span><span class="pink" style="width:${total?100-yeswidth:0}%"></span></span></span><span class="market-volume">${esc(prettynum(m.volume))}</span></button>`;
 }).join('');
 for(const b of $('#marketList').querySelectorAll('[data-id]'))b.addEventListener('click',()=>selectMarket(b.dataset.id));
}
function makePlot(history){if(history.length<2)return '<div class="loading" style="padding:23px 0">At least two timestamped observations are needed.</div>';
 const w=460,h=92,pad=5,vals=history.map(Number).filter(Number.isFinite),min=Math.max(0,Math.min(...vals)-8),max=Math.min(100,Math.max(...vals)+8),spread=Math.max(1,max-min);
 const pts=vals.map((v,i)=>[(i/Math.max(vals.length-1,1))*(w-pad*2)+pad,h-pad-(v-min)/spread*(h-pad*2)]);
 const d=pts.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' '),area=d+` L${pts.at(-1)[0]},${h} L${pts[0][0]},${h} Z`;
 return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="YES observations from ${vals[0]} to ${vals.at(-1)} percent" preserveAspectRatio="none"><defs><linearGradient id="gradientLine" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#34d4be" stop-opacity=".28"/><stop offset="1" stop-color="#34d4be" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#gradientLine)"/><path d="${d}" fill="none" stroke="#5ee4c5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="4" fill="#8cfce0"/></svg>`;
}
function renderSpotlight(){const m=state.selected;if(!m){$('#spotlightBody').innerHTML='<div class="loading">Choose a market to inspect.</div>';return;}
 const history=observed(m),unc=quickAnalysis(m).uncertainty;
 setText('#spotlightSource',m.source==='demo'?'DEMO':'PANTA API');$('#spotlightSource').classList.toggle('real',m.source!=='demo');
 $('#spotlightBody').innerHTML=`<div class="category-badge">${esc(m.category)} · ${esc(m.phase)}</div><div class="spotlight-title">${esc(m.title)}</div><div class="prob-head"><span>Market YES quote</span><strong>${pct(m.yes)}</strong></div><div class="prob-spectrum"><div class="y" style="width:${m.yes===null?0:Math.round(m.yes*100)}%"></div><div class="n" style="width:${m.no===null?0:Math.round(m.no*100)}%"></div></div><div class="split-legend"><span>YES <b class="yes-c">${pct(m.yes)}</b></span><span>NO <b class="no-c">${pct(m.no)}</b></span></div><div class="spark-panel"><div class="spark-title">YES PRICE OBSERVATIONS <small>${m.source==='demo'?'Synthetic sequence · fiction':'Stored browser snapshots · not backfilled'}</small></div>${makePlot(history)}</div><div class="metrics-grid"><div><small>USDC Volume</small><b>${usd(m.volume)}</b></div><div><small>Uncertainty</small><b class="metric-amber">${unc===null?'—':unc+' / 100'}</b></div><div><small>Data source</small><b class="metric-cyan">${m.source==='demo'?'Demo':'Panta'}</b></div></div>`;
}
async function selectMarket(id){const version=++state.requestId;let market=state.all.find(m=>m.id===id);if(!market)return;
 state.selected=market;renderList();renderSpotlight();setText('#aiSummary','Click “Generate insight” for a transparent data-driven explanation.');$('#insightAlerts').innerHTML='';setText('#aiEngine','Free rules engine');
 if(state.mode==='live'){
  try{const result=await api(`/api/market/${encodeURIComponent(id)}?mode=live`);if(version!==state.requestId)return;market=result.market;state.selected=market;
   const ix=state.all.findIndex(m=>m.id===id);if(ix>=0)state.all[ix]=market;renderStats();renderList();renderSpotlight();}
  catch(e){if(version===state.requestId){setText('#aiSummary',`Cannot load live prices: ${e.message}. The catalog may still be available.`);}}
 }
}
function renderConnection(){const ready=Boolean(state.status?.pantaConfigured),live=state.mode==='live';$('#demoButton').classList.toggle('selected',!live);$('#liveButton').classList.toggle('selected',live);$('#liveButton').disabled=!ready;$('#liveButton').title=ready?'Browse real Panta catalog':'Configure PANTA_API_KEY on the server to unlock live mode';
 const warning=$('#dataWarning');warning.classList.toggle('live',live);warning.textContent=live?'LIVE PANTA MODE — Real catalog data. YES/NO prices load per market; historical charts reflect only browser observations.':'DEMO ENVIRONMENT — All market scenarios, volumes and chart histories are fictional. Connect Panta to view real catalog data.';
 setText('#sourceFooter',live?'Panta live read-only catalog · filtered results':'Fictional demo dataset');$('#liveFilters').hidden=!live;renderMore();}
function renderMore(){const visible=filtered().length;$('#loadMoreWrap').hidden=state.mode!=='live'||!state.nextCursor;$('#loadMoreButton').disabled=state.loadingMore;setText('#loadMoreButton',state.loadingMore?'Loading Panta markets…':'Load more Panta markets ↓');setText('#catalogNote',`${state.all.length} loaded · ${visible} visible`);}
async function loadMarkets(){state.nextCursor=null;state.loadingMore=false;$('#marketList').innerHTML='<div class="loading">Loading '+(state.mode==='demo'?'demo':'Panta')+' markets…</div>';
 try{const data=await api(`/api/markets?mode=${state.mode}&limit=40`);state.all=data.items;state.nextCursor=data.nextCursor||null;state.selected=null;fillCategories();renderStats();renderList();renderSpotlight();setText('#lastSync',niceTime());const first=filtered()[0];if(first)await selectMarket(first.id);}
 catch(e){state.all=[];state.selected=null;state.nextCursor=null;renderStats();renderSpotlight();renderMore();$('#marketList').innerHTML=`<div class="loading">${esc(e.message)}<br/>Check server configuration or return to Demo scenarios.</div>`;}
}
async function loadMore(){if(state.mode!=='live'||!state.nextCursor||state.loadingMore)return;
 state.loadingMore=true;renderMore();const cursor=state.nextCursor;
 try{const data=await api(`/api/markets?mode=live&limit=40&cursor=${encodeURIComponent(cursor)}`);
  const seen=new Set(state.all.map(m=>m.id));for(const m of data.items||[])if(!seen.has(m.id)){state.all.push(m);seen.add(m.id);}
  state.nextCursor=data.nextCursor&&data.nextCursor!==cursor?data.nextCursor:null;
  fillCategories();renderStats();renderList();setText('#lastSync',niceTime());if(!state.selected&&filtered()[0])await selectMarket(filtered()[0].id);
 }catch(e){setText('#aiSummary',`Could not load next page: ${e.message}`);}
 finally{state.loadingMore=false;renderMore();}
}
async function explain(){const market=state.selected;if(!market)return;const button=$('#explainButton');button.disabled=true;setText('#aiSummary','Building grounded insight…');$('#insightAlerts').innerHTML='';
 try{const response=await api('/api/explain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:market.id,mode:state.mode,generative:Boolean(state.status?.aiConfigured)})});
  if(state.selected?.id!==market.id)return;
  setText('#aiSummary',response.summary+(response.warning?'\n\n'+response.warning:''));setText('#aiEngine',response.engine);
  $('#insightAlerts').innerHTML=(response.analysis?.alerts||[]).slice(0,3).map(a=>`<div class="signal ${a.level==='warning'?'warning':''}"><strong>${esc(a.label)}</strong> — ${esc(a.detail)}</div>`).join('')+`<div class="signal">${esc(response.limitations)}</div>`;
 }catch(e){setText('#aiSummary',e.message);}finally{button.disabled=false;}
}
async function main(){try{state.status=await api('/api/status');if(state.status.pantaConfigured)state.mode='live';setText('#apiStatus',state.status.pantaConfigured?'● Panta Live available':'◌ Demo ready');}catch(e){setText('#apiStatus','● Server unavailable');$('#apiStatus').classList.add('failed');}
 renderConnection();await loadMarkets();
 $('#demoButton').addEventListener('click',async()=>{if(state.mode==='demo')return;state.mode='demo';renderConnection();await loadMarkets();});
 $('#liveButton').addEventListener('click',async()=>{if(!state.status?.pantaConfigured||state.mode==='live')return;state.mode='live';renderConnection();await loadMarkets();});
 $('#refreshButton').addEventListener('click',loadMarkets);
 $('#loadMoreButton').addEventListener('click',loadMore);
 $('#showResolved').addEventListener('change',e=>{state.showResolved=e.target.checked;renderStats();renderList();});
 $('#showUntitled').addEventListener('change',e=>{state.showUntitled=e.target.checked;renderStats();renderList();});
 $('#searchInput').addEventListener('input',e=>{state.search=e.target.value;renderStats();renderList()});
 $('#categoryFilter').addEventListener('change',e=>{state.category=e.target.value;renderStats();renderList()});
 $('#sortFilter').addEventListener('change',e=>{state.sort=e.target.value;renderList()});
 $('#explainButton').addEventListener('click',explain);
}
main();
