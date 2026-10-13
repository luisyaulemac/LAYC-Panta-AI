import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeTradeActivity} from '../src/activity.mjs';

test('Trade activity classifies only observed positive side amounts, not implied probabilities',()=>{
 const now=1791850000;
 const wallet='9C8HiJqpnZDGt3DZBZgg9zG44aVEnJ5RRqwCumnWSMb9';
 const a=summarizeTradeActivity([
  {yesAmount:'400000000',noAmount:'0',wallet,isPrimary:false,blockTime:now-60},
  {yesAmount:'0',noAmount:'300000000',wallet,isPrimary:true,blockTime:now-90000},
  {yesAmount:'1',noAmount:'2',blockTime:now+1},
  {yesAmount:null,noAmount:null}
 ],now);
 assert.equal(a.sampleCount,4);assert.equal(a.uniqueWallets,1);
 assert.equal(a.yesOnly,1);assert.equal(a.noOnly,1);
 assert.equal(a.both,1);assert.equal(a.unclassified,1);
 assert.equal(a.recent24h,1);assert.equal(a.dated,3);
 assert.equal(a.primary,1);assert.equal(a.secondary,1);
 assert.match(a.limitations,/not probabilities|not market probability|not market probabilities|not market probability/i);
});
test('Empty tape has no invented evidence and incomplete values stay unknown',()=>{
 const empty=summarizeTradeActivity([]);
 assert.equal(empty.sampleCount,0);assert.equal(empty.latestBlockTime,null);
 const partial=summarizeTradeActivity([{yesAmount:null,noAmount:'0',blockTime:null}]);
 assert.equal(partial.unclassified,1);assert.equal(partial.dated,0);
 assert.equal(partial.recent24h,0);
});
