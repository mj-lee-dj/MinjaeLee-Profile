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
  old.lectures = old.lectures.slice(4);
  const candidate = start(old).store.state;
  delete candidate.sourceLectureIds;
  return candidate;
}
test('an old 61-record browser draft cannot hide the four newly published lectures', () => {
  const candidate = oldDraft();
  const serialized = JSON.stringify(candidate);
  const storage = new Map([['profileDraft.contentV1', serialized]]);
  const { data } = start(published, storage);
  assert.equal(data.lectures.length, 65);
  assert.deepEqual(data.lectures.slice(0, 4).map((item) => item.id), published.lectures.slice(0, 4).map((item) => item.id));
  assert.equal(data.lectures.filter((item) => item.topic === 'AI')[0].id, 'lectures_20260930_cheongsu_ai_design');
  assert.equal(storage.get('profileDraft.contentV1'), serialized);
});
test('sync preserves existing draft edits, local-only lectures and unrelated sections', () => {
  const candidate = oldDraft();
  candidate.lectures[0].title = '저장 전 수정 중인 강의';
  candidate.lectures.unshift({ ...candidate.lectures[0], id: 'local-only', title: '아직 공개하지 않은 강의' });
  candidate.personal.statement = '저장 전 선언문';
  const { data } = start(published, new Map([['profileDraft.contentV1', JSON.stringify(candidate)]]));
  assert.equal(data.lectures.length, 66);
  assert.equal(data.lectures[4].id, 'local-only');
  assert.equal(data.lectures[5].title, '저장 전 수정 중인 강의');
  assert.equal(data.personal.statement, '저장 전 선언문');
  assert.deepEqual(data.press, published.press);
});
test('saved explicit lecture removal remains removed on reload', () => {
  const first = start(published);
  const candidate = structuredClone(first.store.state);
  candidate.lectures = candidate.lectures.filter((item) => item.id !== published.lectures[0].id);
  first.store.save(candidate);
  const reloaded = start(published, first.storage);
  assert.equal(reloaded.data.lectures.length, 64);
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
});
