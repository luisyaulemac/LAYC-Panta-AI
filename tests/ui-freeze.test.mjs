import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../web/index.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../web/app.mjs',import.meta.url),'utf8');
const worker=readFileSync(new URL('../worker/index.mjs',import.meta.url),'utf8');

test('Final public homepage has no hero demo, source, or Colosseum marketing CTAs',()=>{
 assert.doesNotMatch(html,/hero-links|Watch demo|View source|Colosseum submission|Prototype for Colosseum/i);
 assert.doesNotMatch(html,/href=["']https:\/\/www\.youtube\.com\/watch\?v=/i);
 assert.doesNotMatch(html,/href=["']https:\/\/github\.com\/luisyaulemac\/LAYC-Panta-AI/i);
 assert.doesNotMatch(html,/href=["']https:\/\/colosseum\.com\//i);
});
test('Core functional dashboard and read-only market evidence stay intact',()=>{
 for(const id of ['demoButton','liveButton','refreshButton','marketList','spotlightBody','tradeEvidenceBody','explainButton','phaseFilter','coverage'])
  assert.ok(html.includes('id="'+id+'"'), 'Missing dashboard element: '+id);
 assert.match(script,/loadTradeEvidence\(id,version\)/);
 assert.match(script,/state\.status\.pantaConfigured/);
 assert.match(script,/api\/market\/.*trades/);
 assert.match(worker,/handleApi/);
});
test('Public version and landing are consistent with the freeze',()=>{
 assert.match(html,/V0\.1\.7/);
 assert.match(html,/Read-only market intelligence/);
});
