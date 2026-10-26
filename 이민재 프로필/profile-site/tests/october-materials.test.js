const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const published = JSON.parse(fs.readFileSync(path.join(root, 'data_v3.json'), 'utf8'));
const key = 'profileDraft.contentV1';
const migration = '2026-10-26-lecture-materials';
const watchIds = ['youtubeVideos_20261027_gemini_notebook_live_3', 'youtubeVideos_20261007_canva_korea'];
const lectureIds = [
  'lectures_20261027_gemini_notebook_materials_3', 'lectures_20261026_cnu_generative_ai',
  'lectures_20261021_galaxy_teacher_lab', 'lectures_20261020_gemini_notebook_materials_2',
  'lectures_20261013_gemini_notebook_materials_1',
];
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
  before.youtubeVideos = before.youtubeVideos.filter(x => !watchIds.includes(x.id));
  before.lectures.find(x => x.id === 'lectures_20261007_canva_korea').link = '';
  return plain(start(before).store.state);
}
test('October materials use the requested topics, public sources and single Watch entries', () => {
  assert.equal(published.youtubeVideos[0].id,watchIds[1]);
  assert.equal(published.lectures.length, 69);
  assert.equal(published.youtubeVideos.length, 21);
  const records = lectureIds.map(id => published.lectures.find(x => x.id === id));
  assert.deepEqual(records.map(x => x.topic), ['AI','AI','Canva·에듀테크','AI','AI']);
  for (const section of ['lectures','youtubeVideos']) assert.equal(new Set(published[section].map(x=>x.id)).size, published[section].length);
  for (const suffix of ['20261013_gemini_notebook_live_1','20261020_gemini_notebook_live_2', '20261027_gemini_notebook_live_3']) {
    assert.equal(published.youtubeVideos.filter(x => x.id === 'youtubeVideos_' + suffix).length, 1);
  }
  assert.match(records[0].link, /14MTD0kR6BIqLnK7kYzsux5tyl_JiV1k6/);
  assert.match(records[0].linkLabel, /PNG 28장 ZIP/);
  assert.equal(records[1].link, 'https://joo.is/261026충남대');
  assert.match(records[2].link, /1gf0wXR6AEzhoAPPzn5RRAisBasJhj2hC/);
  assert.ok(!/1UWtF8bp4YfXbfTBSH7IjXcvmubajG9gB|1dGhErMU9vDzpFE-XkG49eY-P4qe9k6A4|진행 전|다시보기 완료/.test(JSON.stringify(records)));
  const canva = published.lectures.find(x=>x.id==='lectures_20261007_canva_korea');
  assert.equal(canva.link, published.youtubeVideos.find(x=>x.id===watchIds[1]).link);
  assert.equal(canva.images.length, 3);
  records.flatMap(x=>x.images).forEach(image=>assert.ok(fs.existsSync(path.join(root,image))));
});
test('old Watch ordering moves only Canva first and later explicit reorders survive reload', () => {
  const candidate=plain(start().store.state);
  candidate.contentMigrationIds=candidate.contentMigrationIds.filter(x=>x!=='2026-10-26-canva-watch-first');
  const canva=candidate.youtubeVideos.shift();
  candidate.youtubeVideos.splice(3,0,canva);
  const before=JSON.stringify(candidate);
  const first=start(published,new Map([[key,before]]));
  assert.equal(first.data.youtubeVideos[0].id,watchIds[1]);
  assert.deepEqual(plain(first.data.youtubeVideos.slice(1)),candidate.youtubeVideos.filter(x=>x.id!==watchIds[1]));
  assert.equal(first.storage.get(key),before);
  first.store.save(candidate);
  assert.deepEqual(plain(start(published,first.storage).data.youtubeVideos),candidate.youtubeVideos);
});

test('old drafts gain materials and missing Watch records while keeping edits and stored bytes', () => {
  const candidate = stale();
  candidate.lectures[1].title = '로컬 수정';
  candidate.youtubeVideos.reverse();
  candidate.youtubeVideos[0].visible = false;
  const serialized = JSON.stringify(candidate);
  const {data,store,writes,storage} = start(published,new Map([[key,serialized]]));
  assert.equal(data.lectures.length,69);
  assert.deepEqual(data.lectures.slice(0,5).map(x=>x.id),lectureIds);
  assert.equal(data.lectures[6].title,'로컬 수정');
  assert.deepEqual(plain(data.youtubeVideos.slice(2)),candidate.youtubeVideos);
  assert.equal(store.state.contentMigrationIds.filter(x=>x===migration).length,1);
  assert.equal(storage.get(key),serialized);
  assert.deepEqual(writes,[]);
});
test('equivalent direct broadcast links and custom Canva links are preserved without duplication', () => {
  const candidate = stale();
  candidate.youtubeVideos.unshift({ ...published.youtubeVideos.find(x=>x.id===watchIds[0]), id:'local-broadcast', link:'https://youtu.be/x88cs2TdrBY', visible:false });
  candidate.lectures.find(x=>x.id==='lectures_20261007_canva_korea').link='https://example.com/edited';
  const {data}=start(published,new Map([[key,JSON.stringify(candidate)]]));
  assert.equal(data.youtubeVideos.length,21);
  assert.equal(data.youtubeVideos.filter(x=>x.id===watchIds[0]).length,0);
  assert.equal(data.youtubeVideos.find(x=>x.id==='local-broadcast').visible,false);
  assert.equal(data.lectures.find(x=>x.id==='lectures_20261007_canva_korea').link,'https://example.com/edited');
});
test('explicit deletions and cleared links remain authoritative through publish and reload', () => {
  const first=start(); const candidate=plain(first.store.state);
  candidate.youtubeVideos=candidate.youtubeVideos.filter(x=>!watchIds.includes(x.id));
  candidate.lectures=candidate.lectures.filter(x=>!lectureIds.includes(x.id));
  candidate.lectures.find(x=>x.id==='lectures_20261007_canva_korea').link='';
  first.store.save(candidate);
  const payload=first.store.merge(published,first.store.load());
  first.store.save(payload);
  const reloaded=start(payload,first.storage);
  assert.deepEqual(plain(reloaded.data.lectures),payload.lectures);
  assert.deepEqual(plain(reloaded.data.youtubeVideos),payload.youtubeVideos);
  assert.ok(!Object.hasOwn(payload,'contentMigrationIds'));
});

for (const marked of [false, true]) {
  test(`legacy source-shaped drafts recover missing Watch entries (migration marked: ${marked})`, () => {
    const candidate = stale();
    delete candidate.version;
    delete candidate.sourceYoutubeIds;
    if (marked) candidate.contentMigrationIds.push(migration);
    candidate.youtubeVideos.reverse();
    candidate.youtubeVideos[0].title = '보존할 편집';
    candidate.youtubeVideos[0].visible = false;
    candidate.lectures[0].title = '보존할 강의';
    const serialized = JSON.stringify(candidate);
    const {data,store,storage,writes} = start(published,new Map([[key,serialized]]));
    assert.equal(data.youtubeVideos.length,21);
    assert.deepEqual(plain(data.youtubeVideos.slice(2)),candidate.youtubeVideos);
    assert.equal(data.lectures.find(x=>x.id===candidate.lectures[0].id).title,'보존할 강의');
    assert.equal(data.lectures.find(x=>x.id==='lectures_20261007_canva_korea').link,published.lectures.find(x=>x.id==='lectures_20261007_canva_korea').link);
    assert.equal(store.state.contentMigrationIds.filter(x=>x===migration).length,1);
    assert.equal(storage.get(key),serialized);
    assert.deepEqual(writes,[]);
  });
}

test('legacy repair preserves hidden new entries and custom links even with a stale migration marker', () => {
  const candidate=stale();
  delete candidate.version;
  delete candidate.sourceYoutubeIds;
  candidate.contentMigrationIds.push(migration);
  candidate.youtubeVideos.unshift({...published.youtubeVideos.find(x=>x.id===watchIds[0]),visible:false,title:'숨긴 방송'});
  candidate.lectures.find(x=>x.id==='lectures_20261007_canva_korea').link='https://example.com/custom';
  const {data}=start(published,new Map([[key,JSON.stringify(candidate)]]));
  assert.equal(data.youtubeVideos.filter(x=>x.id===watchIds[0]).length,1);
  assert.equal(data.youtubeVideos.find(x=>x.id===watchIds[0]).visible,false);
  assert.equal(data.youtubeVideos.find(x=>x.id===watchIds[0]).title,'숨긴 방송');
  assert.equal(data.lectures.find(x=>x.id==='lectures_20261007_canva_korea').link,'https://example.com/custom');
});
