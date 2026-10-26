const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const published = JSON.parse(read('data_v3.json'));
const videoId = 'youtubeVideos_20261020_gemini_notebook_live_2';
const migrationId = '2026-10-gemini-notebook-live-2';
const key = 'profileDraft.contentV1';
const plain = (value) => JSON.parse(JSON.stringify(value));

function start(data = published, storage = new Map()) {
  const writes = [];
  const context = {
    profileData: structuredClone(data), structuredClone, console,
    CustomEvent: class CustomEvent {},
    localStorage: {
      getItem: (name) => storage.get(name) || '',
      setItem: (name, value) => { writes.push(name); storage.set(name, value); },
      removeItem: (name) => { writes.push(name); storage.delete(name); },
    },
    window: { dispatchEvent() {} },
  };
  vm.runInNewContext(read('draft-content-store.js'), context);
  return { data: context.profileData, store: context.window.ProfileContentStore, storage, writes };
}

function oldDraft() {
  const before = structuredClone(published);
  before.youtubeVideos = before.youtubeVideos.filter((item) => item.id !== videoId);
  return plain(start(before).store.state);
}

test('October 20 session 2 has the verified title and replay, with no custom thumbnails or duplicate replay', () => {
  assert.deepEqual(published.youtubeVideos.find((item) => item.id === videoId), {
    id: videoId,
    visible: true,
    title: '같은 자료지만, 결과물은 이렇게 달라집니다｜민재쌤의 Gemini Notebook [2강]',
    link: 'https://www.youtube.com/watch?v=emaREWRd-R0',
    images: [],
    image: '',
  });
  assert.equal(published.youtubeVideos.filter((item) => item.id === videoId).length, 1);
  assert.equal(published.youtubeVideos.length, 21);
  assert.equal(published.lectures.length, 69);
  assert.ok(!published.lectures.some((item) => /emaREWRd-R0|gemini_notebook_live_2/.test(JSON.stringify(item))));
  const context = vm.createContext({});
  vm.runInContext(read('data_v3.js'), context);
  assert.deepEqual(plain(vm.runInContext('profileData', context)), published);
});

test('a clean visitor sees the new replay first and the complete published video order unchanged', () => {
  const { data, store, writes } = start();
  assert.deepEqual(data.youtubeVideos.map((item) => item.id), published.youtubeVideos.map((item) => item.id));
  assert.equal(store.state.contentMigrationIds.filter((id) => id === migrationId).length, 1);
  assert.deepEqual(writes, []);
});

test('an 18-video draft receives only the new replay without overwriting edits or stored bytes', () => {
  const candidate = oldDraft();
  candidate.youtubeVideos.reverse();
  candidate.youtubeVideos[0].title = '보존할 편집 중 제목';
  candidate.youtubeVideos[0].visible = false;
  candidate.personal.statement = '보존할 소개';
  candidate.lectures[0].title = '보존할 강의';
  const serialized = JSON.stringify(candidate);
  const storage = new Map([[key, serialized]]);
  const { store, writes } = start(published, storage);
  const expected = structuredClone(candidate);
  expected.youtubeVideos.unshift(published.youtubeVideos.find((item) => item.id === videoId));
  expected.contentMigrationIds.push(migrationId);
  assert.deepEqual(plain(store.state), expected);
  assert.equal(storage.get(key), serialized);
  assert.deepEqual(writes, []);
});

test('equivalent session-2 URLs never create a duplicate or overwrite local content', () => {
  for (const link of [
    'https://youtu.be/emaREWRd-R0?si=share',
    'https://youtube.com/live/emaREWRd-R0',
    'https://www.youtube.com/watch?feature=share&v=emaREWRd-R0',
  ]) {
    const candidate = oldDraft();
    const custom = { ...published.youtubeVideos.find((item) => item.id === videoId), id: 'local-video', title: '보존할 로컬 영상', link, visible: false };
    candidate.youtubeVideos.splice(4, 0, custom);
    const { data } = start(published, new Map([[key, JSON.stringify(candidate)]]));
    assert.deepEqual(plain(data.youtubeVideos), candidate.youtubeVideos);
  }
});

test('repeated loads and an explicit save remain idempotent and keep migration metadata private', () => {
  const storage = new Map([[key, JSON.stringify(oldDraft())]]);
  const first = start(published, storage);
  const second = start(published, storage);
  assert.deepEqual(plain(first.data), plain(second.data));
  first.store.save(first.store.state);
  const third = start(published, storage);
  assert.equal(third.data.youtubeVideos.filter((item) => item.id === videoId).length, 1);
  assert.equal(third.store.state.contentMigrationIds.filter((id) => id === migrationId).length, 1);
  assert.ok(!Object.hasOwn(third.store.merge(published, third.store.state), 'contentMigrationIds'));
});

test('later intentional removal, ordering and visibility edits stay intact after saving', () => {
  const first = start();
  const candidate = plain(first.store.state);
  candidate.youtubeVideos = candidate.youtubeVideos.filter((item) => item.id !== videoId).reverse();
  candidate.youtubeVideos[0].visible = false;
  first.store.save(candidate);
  const next = start(published, first.storage);
  assert.deepEqual(plain(next.data.youtubeVideos), candidate.youtubeVideos);
});

test('the actual admin publish save-merge-save-reload lifecycle does not resurrect a deleted replay', () => {
  const first = start();
  const candidate = plain(first.store.state);
  candidate.youtubeVideos = candidate.youtubeVideos.filter((item) => item.id !== videoId);
  first.store.save(candidate);
  const payload = first.store.merge(published, first.store.load());
  assert.ok(!Object.hasOwn(payload, 'version'));
  assert.ok(!payload.youtubeVideos.some((item) => item.id === videoId));
  // admin-publish.js saves the metadata-free publish payload after GitHub saves.
  first.store.save(payload);
  const reloaded = start(payload, first.storage);
  assert.deepEqual(plain(reloaded.data.youtubeVideos), plain(payload.youtubeVideos));
  assert.ok(!reloaded.data.youtubeVideos.some((item) => item.id === videoId));
});

test('the replay migration waits for its source record and does not affect an older source', () => {
  const before = structuredClone(published);
  before.youtubeVideos = before.youtubeVideos.filter((item) => item.id !== videoId);
  const { data, store } = start(before);
  assert.equal(data.youtubeVideos.length, 20);
  assert.ok(!store.state.contentMigrationIds.includes(migrationId));
});

test('public and admin entries cache-bust both changed runtime files with the same release identifier', () => {
  for (const name of ['index.html', 'admin.html', 'draft-v2.html', 'admin-profile-final.html']) {
    const html = read(name);
    assert.match(html, /data_v3\.js\?v=20261026-materials/);
    assert.match(html, /draft-content-store\.js\?v=20261026-materials/);
  }
});
