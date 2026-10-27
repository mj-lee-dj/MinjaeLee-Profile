const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const published = JSON.parse(fs.readFileSync(path.join(root, 'data_v3.json'), 'utf8'));
const source = fs.readFileSync(path.join(root, 'draft-content-store.js'), 'utf8');
const id = 'lectures_20261026_cnu_generative_ai';
const key = 'profileDraft.contentV1';
const plain = value => JSON.parse(JSON.stringify(value));
function start(candidate, storage = new Map()) {
  if (candidate) storage.set(key, JSON.stringify(candidate));
  const writes = [];
  const context = { profileData: structuredClone(published), structuredClone, console,
    CustomEvent: class {}, window: { dispatchEvent() {} },
    localStorage: { getItem: k => storage.get(k) || '', setItem: (k,v) => { writes.push(k); storage.set(k,v); }, removeItem: k => storage.delete(k) } };
  vm.runInNewContext(source, context);
  return { data: plain(context.profileData), store: context.window.ProfileContentStore, storage, writes };
}
function stale() {
  const candidate = plain(start().store.state);
  candidate.contentMigrationIds = candidate.contentMigrationIds.filter(x => x !== '2026-10-27-cnu-selected-images');
  const record = candidate.lectures.find(x => x.id === id);
  record.images = ['uploads/20261026-cnu-ai-cover.webp'];
  record.image = record.images[0];
  return candidate;
}

test('previous CNU cover is replaced in old drafts without changing edits, order or storage', () => {
  const candidate = stale();
  const record = candidate.lectures.find(x => x.id === id);
  record.title = '보존할 제목';
  record.visible = false;
  record.highlight = true;
  record.link = 'https://example.com/custom';
  candidate.lectures.reverse();
  const before = JSON.stringify(candidate);
  const actual = start(candidate);
  const expected = plain(candidate.lectures);
  const target = expected.find(x => x.id === id);
  target.images = published.lectures.find(x => x.id === id).images;
  target.image = target.images[0];
  assert.deepEqual(actual.data.lectures, expected);
  assert.equal(actual.storage.get(key), before);
  assert.deepEqual(actual.writes, []);
});

for (const mode of ['custom', 'cleared', 'deleted']) {
  test(`CNU ${mode} images or record remain intentional`, () => {
    const candidate = stale();
    const record = candidate.lectures.find(x => x.id === id);
    record.images = mode === 'custom' ? ['uploads/custom.webp'] : [];
    record.image = record.images[0] || '';
    if (mode === 'deleted') candidate.lectures = candidate.lectures.filter(x => x.id !== id);
    assert.deepEqual(start(candidate).data.lectures, candidate.lectures);
  });
}

test('a later explicit CNU image selection survives reload', () => {
  const actual = start(stale());
  const candidate = plain(actual.store.state);
  const record = candidate.lectures.find(x => x.id === id);
  record.images = ['uploads/20261026-cnu-ai-cover.webp'];
  record.image = record.images[0];
  actual.store.save(candidate);
  assert.deepEqual(start(null, actual.storage).data.lectures, candidate.lectures);
});
