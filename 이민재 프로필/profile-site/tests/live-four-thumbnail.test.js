const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const published = JSON.parse(fs.readFileSync(path.join(root, 'data_v3.json'), 'utf8'));
const key = 'profileDraft.contentV1';
const videoId = 'youtubeVideos_20261103_gemini_notebook_live_4';
const marker = '2026-11-05-live-four-watch-thumbnail';
const oldImage = 'uploads/20261103-gemini-notebook-cover.webp';
const newImage = 'uploads/20261103-gemini-notebook-watch.jpg';
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
  const before=structuredClone(published);
  Object.assign(before.youtubeVideos.find(item=>item.id===videoId),{images:[oldImage],image:oldImage});
  return plain(start(before).store.state);
}
test('Live four Watch uses its broadcast thumbnail while the lecture keeps its three slides',()=>{
  const watch=published.youtubeVideos.find(item=>item.id===videoId);
  assert.deepEqual(watch.images,[newImage]);
  assert.equal(watch.image,newImage);
  assert.ok(fs.existsSync(path.join(root,newImage)));
  const lecture=published.lectures.find(item=>item.id==='lectures_20261103_gemini_notebook_materials_4');
  assert.equal(lecture.images.length,3);
  assert.equal(lecture.images[0],oldImage);
});
for(const equivalent of [false,true]) test(`old deck cover is corrected without altering other fields or stored bytes (equivalent: ${equivalent})`,()=>{
  const candidate=stale();
  const watch=candidate.youtubeVideos.find(item=>item.id===videoId);
  watch.visible=false;watch.title='직접 편집한 제목';
  if(equivalent){watch.id='local-live-four';watch.link='https://youtu.be/z8dgqCXs6TY';}
  else watch.link='https://example.com/edited';
  const expected=structuredClone(candidate);
  Object.assign(expected.youtubeVideos.find(item=>item.id===watch.id),{images:[newImage],image:newImage});
  const serialized=JSON.stringify(candidate);
  const result=start(published,new Map([[key,serialized]]));
  assert.deepEqual(plain(result.data.youtubeVideos),expected.youtubeVideos);
  assert.deepEqual(plain(result.data.lectures),candidate.lectures);
  assert.equal(result.storage.get(key),serialized);
  assert.deepEqual(result.writes,[]);
  assert.equal(result.store.state.contentMigrationIds.filter(id=>id===marker).length,1);
});
test('thumbnail correction preserves custom images, cleared media and deleted Watch entries',()=>{
  for(const images of [['uploads/custom.webp'],[],[oldImage,'uploads/custom.webp'],null]){
    const candidate=stale();
    if(images===null)candidate.youtubeVideos=candidate.youtubeVideos.filter(item=>item.id!==videoId);
    else Object.assign(candidate.youtubeVideos.find(item=>item.id===videoId),{images,image:images[0]||''});
    const result=start(published,new Map([[key,JSON.stringify(candidate)]]));
    assert.deepEqual(plain(result.data.youtubeVideos),candidate.youtubeVideos);
  }
});
test('later explicit selection of the old deck cover persists after save and publish',()=>{
  const first=start(published,new Map([[key,JSON.stringify(stale())]]));
  const candidate=plain(first.store.state);
  Object.assign(candidate.youtubeVideos.find(item=>item.id===videoId),{images:[oldImage],image:oldImage});
  first.store.save(candidate);
  assert.deepEqual(plain(start(published,first.storage).data.youtubeVideos),candidate.youtubeVideos);
  const payload=first.store.merge(published,candidate);
  assert.equal(Object.hasOwn(payload,'contentMigrationIds'),false);
  first.store.save(payload);
  assert.deepEqual(plain(start(published,first.storage).data.youtubeVideos),candidate.youtubeVideos);
});
test('thumbnail migration is not marked against the older published source',()=>{
  const before=structuredClone(published);
  Object.assign(before.youtubeVideos.find(item=>item.id===videoId),{images:[oldImage],image:oldImage});
  const first=start(before);
  assert.equal(first.store.state.contentMigrationIds.includes(marker),false);
  first.store.save(first.store.state);
  assert.equal(JSON.parse(first.storage.get(key)).contentMigrationIds.includes(marker),false);
});
