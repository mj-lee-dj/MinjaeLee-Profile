const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const published = JSON.parse(read('data_v3.json'));
const id = 'l_mls35x2biau7q';
const migration = '2026-10-chungnam-student-lecture-year';
const key = 'profileDraft.contentV1';
const plain = value => JSON.parse(JSON.stringify(value));
const target = data => data.lectures.find(item => item.id === id);
function start(data = published, storage = new Map()) {
  const writes = [];
  const context = { profileData: structuredClone(data), structuredClone, console, CustomEvent: class {},
    localStorage: { getItem: k => storage.get(k) || '', setItem: (k,v) => { writes.push(k); storage.set(k,v); }, removeItem: k => storage.delete(k) },
    window: { dispatchEvent() {} } };
  vm.runInNewContext(read('draft-content-store.js'), context);
  return { data: context.profileData, store: context.window.ProfileContentStore, storage, writes };
}
function stale() {
  const state = plain(start().store.state);
  state.contentMigrationIds = state.contentMigrationIds.filter(value => value !== migration);
  target(state).year = '2026';
  return state;
}
test('the exact Chungnam student lecture is 2025 in synchronized feeds, with inventory unchanged', () => {
  const item = target(published);
  assert.equal(item.year, '2025');
  assert.equal(item.org, '충남고등학교');
  assert.equal(item.title, '[학생 정보통신윤리 연수] 생성AI 안전하고 효과적으로 활용하기');
  assert.equal(item.images.length, 7);
  assert.equal(published.lectures.length, 64);
  assert.equal(published.youtubeVideos.length, 19);
  const context = vm.createContext({}); vm.runInContext(read('data_v3.js'), context);
  assert.deepEqual(plain(vm.runInContext('profileData', context)), published);
});
test('a stale draft changes exactly the target year without writing storage or other fields', () => {
  const candidate = stale();
  target(candidate).title = '보존할 제목'; target(candidate).images = ['uploads/custom.png']; target(candidate).image = 'uploads/custom.png';
  target(candidate).visible = false; candidate.personal.statement = '보존할 소개';
  candidate.lectures.reverse();
  const serialized = JSON.stringify(candidate);
  const result = start(published, new Map([[key, serialized]]));
  const expected = structuredClone(candidate); target(expected).year = '2025'; expected.contentMigrationIds.push(migration);
  assert.deepEqual(plain(result.store.state), expected);
  assert.equal(result.storage.get(key), serialized); assert.deepEqual(result.writes, []);
});
test('custom years and explicitly removed target records are preserved', () => {
  for (const year of ['2024', '2027', '']) {
    const candidate = stale(); target(candidate).year = year;
    assert.equal(target(start(published, new Map([[key, JSON.stringify(candidate)]])).data).year, year);
  }
  const candidate = stale(); candidate.lectures = candidate.lectures.filter(item => item.id !== id);
  assert.ok(!target(start(published, new Map([[key, JSON.stringify(candidate)]])).data));
});
test('correction is idempotent across reload and respects a later explicit 2026 edit', () => {
  const first = start(published, new Map([[key, JSON.stringify(stale())]]));
  first.store.save(first.store.state);
  const candidate = plain(first.store.load()); target(candidate).year = '2026'; first.store.save(candidate);
  const again = start(published, first.storage);
  assert.equal(target(again.data).year, '2026');
  assert.equal(again.store.state.contentMigrationIds.filter(value => value === migration).length, 1);
});
test('the actual admin save-merge-save-reload path preserves a later authoritative year', () => {
  const first = start(); const candidate = plain(first.store.state); target(candidate).year = '2026';
  first.store.save(candidate); const payload = first.store.merge(published, first.store.load());
  first.store.save(payload); const again = start(payload, first.storage);
  assert.equal(target(again.data).year, '2026');
});
test('correction waits for matching published year and never leaks migration metadata', () => {
  const older = structuredClone(published); target(older).year = '2026';
  const result = start(older); assert.equal(target(result.data).year, '2026');
  assert.ok(!result.store.state.contentMigrationIds.includes(migration));
  assert.ok(!Object.hasOwn(start().store.merge(published, start().store.state), 'contentMigrationIds'));
});
