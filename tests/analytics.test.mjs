import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeMarket,analyzeMarket,filterMarkets} from '../src/analytics.mjs';
import {demoMarkets} from '../src/demo.mjs';
test('Catalog null prices remain unknown, not 0 or fabricated',()=>{
 const m=normalizeMarket({marketId:'abc',title:'Example',yesPrice:null,noPrice:null,volumeUsdc:'3.44'});
 assert.equal(m.yes,null);assert.equal(m.no,null);assert.equal(analyzeMarket(m).uncertainty,null);
});
test('Panta primary price normalization and mathematical uncertainty',()=>{
 const m=normalizeMarket({marketId:'market',title:'Example',primaryYesPrice:'0.5',primaryNoPrice:'0.5',volumeUsdc:'1000'});
 assert.equal(m.yes,.5);assert.equal(m.no,.5);assert.equal(analyzeMarket(m).uncertainty,100);
});
test('Extreme 0% price is represented as actual 0%',()=>{
 const m=normalizeMarket({marketId:'m',yesPrice:'0',noPrice:'1'});assert.equal(m.yes,0);assert.equal(analyzeMarket(m).uncertainty,0);
});
test('Secondary market non-parity is only a warning, not arbitrage advice',()=>{
 const m=normalizeMarket({marketId:'m',yesPrice:'0.8',noPrice:'0.5',volumeUsdc:'4500'});
 assert.ok(analyzeMarket(m).alerts.some(a=>a.label==='Price parity gap'));
});
test('Momentum requires at least two snapshots',()=>{
 const m=normalizeMarket(demoMarkets[0],{demo:true});assert.equal(analyzeMarket(m,[50]).delta,null);assert.equal(analyzeMarket(m,[50,54]).delta,4);
});
test('Market sorting and filtering work with real Panta-shaped data',()=>{
 const markets=demoMarkets.map(x=>normalizeMarket(x,{demo:true}));
 const r=filterMarkets(markets,{category:'crypto',search:'BTC',sort:'volume'});assert.equal(r.length,2);assert.ok(r.every(x=>/BTC/.test(x.title)));
});

test('Live catalog empty titles display a safe placeholder',()=>{
 const m=normalizeMarket({marketId:'89wXZbH7b5JXbfpWAujggNhvGWjtvrSXnbFt8Z2QS5Ec',title:'   ',yesPrice:null,noPrice:null});
 assert.equal(m.title,'Untitled market');
 assert.equal(m.yes,null);
 assert.equal(m.no,null);
 assert.equal(m.source,'panta');
});
