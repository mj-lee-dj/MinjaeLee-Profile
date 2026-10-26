const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../site-refresh.js'), 'utf8');

function start({latest='release-a', hidden=false, failure=false}={}) {
  const events={}, calls=[];
  let reloads=0;
  const nodes=version=>[{getAttribute:name=>name==='src'?`data_v3.js?v=${version}`:null}];
  const document={visibilityState:hidden?'hidden':'visible',querySelectorAll:()=>nodes('release-a'),addEventListener:(type,cb)=>events[type]=cb};
  vm.runInNewContext(source,{
    document, window:{addEventListener:(type,cb)=>events[type]=cb},
    location:{pathname:'/',reload:()=>reloads++},
    DOMParser:class {parseFromString(value){return {querySelectorAll:()=>nodes(value)};}},
    fetch:async(url,options)=>{calls.push({url,options});if(failure) throw Error('offline');return {ok:true,text:async()=>latest};},
    AbortController, setTimeout, clearTimeout, setInterval:cb=>events.interval=cb,
  });
  return {events,calls,document,get reloads(){return reloads;}};
}
test('returning to a tab checks the published release without clearing storage', async()=>{
  const page=start({latest:'release-b'});
  await page.events.pageshow();
  await page.events.focus();
  assert.equal(page.reloads,1);
  assert.equal(page.calls.length,1);
  assert.equal(page.calls[0].options.cache,'no-store');
});
test('unchanged and offline pages remain usable without reload loops',async()=>{
  for(const failure of [false,true]){
    const page=start({failure});
    await page.events.focus();
    await page.events.interval();
    assert.equal(page.reloads,0);
    assert.equal(page.calls.length,2);
  }
});
test('hidden tabs defer the release check until visible',async()=>{
  const page=start({latest:'release-b',hidden:true});
  await page.events.interval();
  assert.equal(page.calls.length,0);
  page.document.visibilityState='visible';
  await page.events.visibilitychange();
  assert.equal(page.reloads,1);
});
