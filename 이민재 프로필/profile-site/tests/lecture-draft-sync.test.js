const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const published = JSON.parse(fs.readFileSync(path.join(root, 'data_v3.json'), 'utf8'));
const script = fs.readFileSync(path.join(root, 'draft-content-store.js'), 'utf8');
function start(data, storage = new Map()) {
  const context = {
    profileData: structuredClone(data), structuredClone, console,
    CustomEvent: class CustomEvent {},
    localStorage: { getItem: (key) => storage.get(key) || '', setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
    window: { dispatchEvent: () => {} },
  };
  vm.runInNewContext(script, context);
  return { data: context.profileData, store: context.window.ProfileContentStore, storage };
}
function oldDraft() {
  const old = structuredClone(published);
  old.lectures = old.lectures.slice(3);
  old.youtubeVideos = old.youtubeVideos.slice(1);
  const candidate = start(old).store.state;
  delete candidate.contentMigrationIds;
  delete candidate.sourceLectureIds;
  return candidate;
}
test('an old 61-record browser draft cannot hide the three newly published lectures and relocated Live video', () => {
  const candidate = oldDraft();
  const serialized = JSON.stringify(candidate);
  const storage = new Map([['profileDraft.contentV1', serialized]]);
  const { data } = start(published, storage);
  assert.equal(data.lectures.length, 64);
  assert.deepEqual(data.lectures.slice(0, 3).map((item) => item.id), published.lectures.slice(0, 3).map((item) => item.id));
  assert.equal(data.lectures.filter((item) => item.topic === 'AI')[0].id, 'lectures_20260930_cheongsu_ai_design');
  assert.equal(data.youtubeVideos[0].id, 'youtubeVideos_20261013_gemini_notebook_live_1');
  assert.equal(storage.get('profileDraft.contentV1'), serialized);
});
test('sync preserves existing draft edits, local-only lectures and unrelated sections', () => {
  const candidate = oldDraft();
  candidate.lectures[0].title = '저장 전 수정 중인 강의';
  candidate.lectures.unshift({ ...candidate.lectures[0], id: 'local-only', title: '아직 공개하지 않은 강의' });
  candidate.personal.statement = '저장 전 선언문';
  const { data } = start(published, new Map([['profileDraft.contentV1', JSON.stringify(candidate)]]));
  assert.equal(data.lectures.length, 65);
  assert.equal(data.lectures[3].id, 'local-only');
  assert.equal(data.lectures[4].title, '저장 전 수정 중인 강의');
  assert.equal(data.personal.statement, '저장 전 선언문');
  assert.deepEqual(data.press, published.press);
});
test('saved explicit lecture removal remains removed on reload', () => {
  const first = start(published);
  const candidate = structuredClone(first.store.state);
  candidate.lectures = candidate.lectures.filter((item) => item.id !== published.lectures[0].id);
  first.store.save(candidate);
  const reloaded = start(published, first.storage);
  assert.equal(reloaded.data.lectures.length, 63);
  assert.ok(!reloaded.data.lectures.some((item) => item.id === published.lectures[0].id));
});
test('subsequent published lectures merge once without restoring saved deletions', () => {
  const first = start(published);
  const candidate = structuredClone(first.store.state);
  candidate.lectures = candidate.lectures.slice(1);
  first.store.save(candidate);
  const next = structuredClone(published);
  next.lectures.unshift({ ...next.lectures[0], id: 'future-published', title: '다음에 공개한 강의' });
  const second = start(next, first.storage);
  assert.equal(second.data.lectures[0].id, 'future-published');
  assert.ok(!second.data.lectures.some((item) => item.id === published.lectures[0].id));
  second.store.save(second.store.state);
  const third = start(next, first.storage);
  assert.equal(third.data.lectures.filter((item) => item.id === 'future-published').length, 1);
});
test('clean browsers keep the published lecture order and no draft baseline reaches public data', () => {
  const { data, store } = start(published);
  assert.deepEqual(data.lectures.map((item) => item.id), published.lectures.map((item) => item.id));
  assert.ok(!Object.hasOwn(store.merge(published, store.state), 'sourceLectureIds'));
  assert.ok(!Object.hasOwn(store.merge(published, store.state), 'contentMigrationIds'));
});

function preCorrectionDraft() {
  const candidate = structuredClone(start(published).store.state);
  delete candidate.contentMigrationIds;
  candidate.youtubeVideos = candidate.youtubeVideos.filter((item) => item.id !== published.youtubeVideos[0].id);
  candidate.lectures.slice(0, 3).forEach((item) => { item.images = []; item.image = ''; });
  candidate.lectures.unshift({ ...candidate.lectures[2], id: 'lectures_20261013_gemini_notebook_live_1', title: '교사에게 AI 딱 하나만 추천한다면', images: [], image: '' });
  candidate.sourceLectureIds.unshift('lectures_20261013_gemini_notebook_live_1');
  return candidate;
}

test('the previous 65-record draft relocates Live and fills three slide galleries without writing storage', () => {
  const candidate = preCorrectionDraft();
  candidate.lectures[4].title = '보존할 로컬 수정';
  const serialized = JSON.stringify(candidate);
  const { data, store, storage } = start(published, new Map([['profileDraft.contentV1', serialized]]));
  assert.equal(data.lectures.length, 64);
  assert.ok(!data.lectures.some((item) => item.id === 'lectures_20261013_gemini_notebook_live_1'));
  assert.equal(data.youtubeVideos.length, 18);
  assert.equal(data.youtubeVideos[0].id, published.youtubeVideos[0].id);
  assert.equal(data.lectures[3].title, '보존할 로컬 수정');
  data.lectures.slice(0, 3).forEach((item, index) => assert.deepEqual(item.images, published.lectures[index].images));
  assert.equal(storage.get('profileDraft.contentV1'), serialized);
  const merged = store.merge(published, candidate);
  assert.equal(merged.lectures.length, 64);
  assert.equal(merged.youtubeVideos[0].id, published.youtubeVideos[0].id);
  assert.ok(!Object.hasOwn(merged, 'contentMigrationIds'));
});

test('migration preserves custom images and an equivalent existing video link', () => {
  const candidate = preCorrectionDraft();
  candidate.lectures[1].images = ['uploads/local-custom.png'];
  candidate.lectures[1].image = 'uploads/local-custom.png';
  candidate.youtubeVideos.unshift({ ...published.youtubeVideos[0], id: 'local-live-video', title: '로컬 영상 제목', link: 'https://www.youtube.com/watch?v=2Dqpsaqa0Jw&feature=share' });
  const { data } = start(published, new Map([['profileDraft.contentV1', JSON.stringify(candidate)]]));
  assert.equal(data.youtubeVideos.length, 18);
  assert.equal(data.youtubeVideos[0].title, '로컬 영상 제목');
  assert.deepEqual(Array.from(data.lectures[0].images), ['uploads/local-custom.png']);
});

test('after explicit save, later video removal and image clearing are not resurrected', () => {
  const first = start(published, new Map([['profileDraft.contentV1', JSON.stringify(preCorrectionDraft())]]));
  first.store.save(first.store.state);
  const candidate = structuredClone(first.store.state);
  candidate.youtubeVideos = candidate.youtubeVideos.slice(1);
  candidate.lectures[0].images = []; candidate.lectures[0].image = '';
  first.store.save(candidate);
  const next = start(published, first.storage);
  assert.equal(next.data.youtubeVideos.length, 17);
  assert.equal(next.data.lectures[0].images.length, 0);
});

test('stale lecture curation drops Live references while preserving other choices', () => {
  const oldLive = 'lectures_20261013_gemini_notebook_live_1';
  const retained = published.lectures[0].id;
  const curated = JSON.stringify({ highlights: [oldLive, retained], hidden: [oldLive, retained], label: '내 선택' });
  const storage = new Map([['profileDraft.contentV1', JSON.stringify(preCorrectionDraft())], ['profileDraft.lectureCuration', curated]]);
  const { data } = start(published, storage);
  const context = { profileData: data, console, window: { dispatchEvent: () => {} }, CustomEvent: class {}, localStorage: { getItem: (key) => storage.get(key) || '', setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'draft-lecture-store.js'), 'utf8'), context);
  const result = context.window.ProfileLectureStore.load();
  assert.ok(!result.highlights.includes(oldLive));
  assert.ok(!result.hidden.includes(oldLive));
  assert.ok(result.highlights.includes(retained));
  assert.ok(result.hidden.includes(retained));
  assert.equal(result.label, '내 선택');
  assert.equal(storage.get('profileDraft.lectureCuration'), curated);
});
