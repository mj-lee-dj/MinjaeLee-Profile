const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const published = JSON.parse(fs.readFileSync(path.join(root, 'data_v3.json'), 'utf8'));
const key = 'profileDraft.contentV1';
const videoId = 'youtubeVideos_20261103_gemini_notebook_live_4';
const lectureIds = ['lectures_20261103_gemini_notebook_materials_4', 'lectures_20261102_google_certified_trainer', 'lectures_20261028_duncheon_digital_routines'];
const plain = value => JSON.parse(JSON.stringify(value));
function start(data = published, storage = new Map()) {
  const writes = [];
  const context = { profileData: structuredClone(data), structuredClone, console,
    CustomEvent: class {}, window: { dispatchEvent() {} },
    localStorage: { getItem: k => storage.get(k) || '', setItem: (k,v) => { writes.push(k); storage.set(k,v); }, removeItem: k => storage.delete(k) } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'draft-content-store.js'), 'utf8'), context);
  return { data: context.profileData, store: context.window.ProfileContentStore, storage, writes };
}
function stale() {
  const before = structuredClone(published);
  before.lectures = before.lectures.filter(x => !lectureIds.includes(x.id));
  before.youtubeVideos = before.youtubeVideos.filter(x => x.id !== videoId);
  return plain(start(before).store.state);
}
test('November content has three illustrated lectures and exactly one new Watch entry', () => {
  assert.equal(published.lectures.length,72);
  assert.equal(published.youtubeVideos.length,22);
  assert.equal(published.youtubeVideos[0].id,'youtubeVideos_20261007_canva_korea');
  assert.equal(published.youtubeVideos[1].id,videoId);
  const records=lectureIds.map(id=>published.lectures.find(x=>x.id===id));
  assert.deepEqual(records.map(x=>x.topic),['AI','Google','교사 업무·학급경영']);
  assert.equal(records[1].org,'충남대학교 x GEG대전 x 오늘배움');
  for(const record of records){
    assert.equal(record.images.length,3);
    assert.equal(record.image,record.images[0]);
    record.images.forEach(image=>assert.ok(fs.existsSync(path.join(root,image)),image));
  }
  const watch=published.youtubeVideos.find(x=>x.id===videoId);
  assert.equal(watch.link,'https://www.youtube.com/live/z8dgqCXs6TY');
  for(const section of ['lectures','youtubeVideos']) assert.equal(new Set(published[section].map(x=>x.id)).size,published[section].length);
});
for(const legacy of [false,true]) test(`November additions preserve existing edits, hidden entries and stored bytes (legacy: ${legacy})`,()=>{
  const candidate=stale();
  if(legacy){delete candidate.version;delete candidate.sourceYoutubeIds;delete candidate.sourceLectureIds;}
  candidate.lectures[0].title='편집한 강의';
  candidate.youtubeVideos[2].visible=false;
  candidate.youtubeVideos[2].title='숨긴 영상';
  const serialized=JSON.stringify(candidate);
  const first=start(published,new Map([[key,serialized]]));
  assert.equal(first.data.lectures.length,72);
  assert.equal(first.data.youtubeVideos.length,22);
  assert.deepEqual(plain(first.data.lectures.filter(x=>!lectureIds.includes(x.id))),candidate.lectures);
  assert.deepEqual(plain(first.data.youtubeVideos.filter(x=>x.id!==videoId)),candidate.youtubeVideos);
  assert.equal(first.data.youtubeVideos[1].id,videoId);
  assert.equal(first.storage.get(key),serialized);
  assert.deepEqual(first.writes,[]);
  assert.equal(start(published,first.storage).data.youtubeVideos.filter(x=>x.id===videoId).length,1);
});
test('November migration preserves a customized equivalent broadcast without duplication',()=>{
  const candidate=stale();
  candidate.youtubeVideos.unshift({...published.youtubeVideos.find(x=>x.id===videoId),id:'local-live-four',link:'https://youtu.be/z8dgqCXs6TY',title:'로컬 영상',visible:false});
  const result=start(published,new Map([[key,JSON.stringify(candidate)]]));
  assert.equal(result.data.youtubeVideos.length,22);
  assert.equal(result.data.youtubeVideos.some(x=>x.id===videoId),false);
  assert.equal(result.data.youtubeVideos.find(x=>x.id==='local-live-four').visible,false);
});
test('November saved deletions and explicit ordering remain authoritative on reload and publish',()=>{
  const first=start(published,new Map([[key,JSON.stringify(stale())]]));
  const candidate=plain(first.store.state);
  candidate.lectures=candidate.lectures.filter(x=>!lectureIds.includes(x.id));
  candidate.youtubeVideos=candidate.youtubeVideos.filter(x=>x.id!==videoId).reverse();
  first.store.save(candidate);
  const reloaded=start(published,first.storage);
  assert.deepEqual(plain(reloaded.data.lectures),candidate.lectures);
  assert.deepEqual(plain(reloaded.data.youtubeVideos),candidate.youtubeVideos);
  const payload=reloaded.store.merge(published,reloaded.store.load());
  assert.deepEqual(plain(payload.youtubeVideos),candidate.youtubeVideos);
  assert.equal(Object.hasOwn(payload,'sourceYoutubeIds'),false);
  assert.equal(Object.hasOwn(payload,'sourceLectureIds'),false);
  reloaded.store.save(payload);
  assert.deepEqual(plain(start(published,reloaded.storage).data.youtubeVideos),candidate.youtubeVideos);
});
test('November does not resurrect previously deleted baseline records',()=>{
  const candidate=stale();
  const deletedLecture=candidate.lectures.pop().id;
  const deletedVideo=candidate.youtubeVideos.pop().id;
  const result=start(published,new Map([[key,JSON.stringify(candidate)]]));
  assert.equal(result.data.lectures.some(x=>x.id===deletedLecture),false);
  assert.equal(result.data.youtubeVideos.some(x=>x.id===deletedVideo),false);
});

const orderMigration = '2026-11-05-watch-notebook-order';
const requestedOrder = ['youtubeVideos_20261007_canva_korea', videoId, 'youtubeVideos_20261027_gemini_notebook_live_3', 'youtubeVideos_20261020_gemini_notebook_live_2', 'youtubeVideos_20261013_gemini_notebook_live_1'];
for (const legacy of [false,true]) test(`requested Watch order migrates once without altering records or stored bytes (legacy: ${legacy})`,()=>{
  const candidate=plain(start().store.state);
  candidate.contentMigrationIds=candidate.contentMigrationIds.filter(id=>id!==orderMigration);
  if(legacy) delete candidate.version;
  candidate.youtubeVideos.reverse();
  candidate.youtubeVideos.find(item=>item.id===videoId).visible=false;
  candidate.youtubeVideos.find(item=>item.id===videoId).title='편집한 4강';
  const serialized=JSON.stringify(candidate);
  const first=start(published,new Map([[key,serialized]]));
  assert.deepEqual(first.data.youtubeVideos.slice(0,5).map(item=>item.id),requestedOrder);
  for(const original of candidate.youtubeVideos) assert.deepEqual(plain(first.data.youtubeVideos.find(item=>item.id===original.id)),original);
  assert.deepEqual(plain(first.data.youtubeVideos.slice(5)),candidate.youtubeVideos.filter(item=>!requestedOrder.includes(item.id)));
  assert.equal(first.storage.get(key),serialized);
  assert.deepEqual(first.writes,[]);
  assert.equal(first.store.state.contentMigrationIds.filter(id=>id===orderMigration).length,1);
  const reordered=plain(first.store.state);
  reordered.youtubeVideos.reverse();
  first.store.save(reordered);
  assert.deepEqual(plain(start(published,first.storage).data.youtubeVideos),reordered.youtubeVideos);
});
test('requested Watch ordering preserves deletions and explicit source-shaped saves',()=>{
  const candidate=plain(start().store.state);
  candidate.contentMigrationIds=candidate.contentMigrationIds.filter(id=>id!==orderMigration);
  candidate.youtubeVideos=candidate.youtubeVideos.filter(item=>item.id!==videoId && item.id!==requestedOrder[2]).reverse();
  const first=start(published,new Map([[key,JSON.stringify(candidate)]]));
  assert.deepEqual(first.data.youtubeVideos.slice(0,3).map(item=>item.id),requestedOrder.filter(id=>id!==videoId && id!==requestedOrder[2]));
  const payload=first.store.merge(published,first.store.state);
  payload.youtubeVideos.reverse();
  first.store.save(payload);
  assert.deepEqual(plain(start(published,first.storage).data.youtubeVideos),payload.youtubeVideos);
  assert.equal(Object.hasOwn(payload,'contentMigrationIds'),false);
});
test('Watch order migration waits for matching published source order',()=>{
  const before=structuredClone(published);
  before.youtubeVideos.reverse();
  const candidate=plain(start(before).store.state);
  assert.equal(candidate.contentMigrationIds.includes(orderMigration),false);
  const stored=JSON.stringify(candidate);
  const result=start(before,new Map([[key,stored]]));
  assert.equal(result.store.state.contentMigrationIds.includes(orderMigration),false);
  assert.deepEqual(plain(result.data.youtubeVideos),candidate.youtubeVideos);
});
