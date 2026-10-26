const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const published = JSON.parse(fs.readFileSync(path.join(root, 'data_v3.json'), 'utf8'));
const script = fs.readFileSync(path.join(root, 'draft-lecture-store.js'), 'utf8');
const key = 'profileDraft.lectureCuration';
const next = ['lectures_mt5sy7fr', 'lectures_20261007_canva_korea', 'l_mr29yai68xvad', 'l_mskirvwkn6cbr', 'l_mskifjabnr1q2'];
const previous = [
  ['l_mskiwlabhgr9u', 'l_mr29yai68xvad', 'l_mqcuqz7aplqgo', 'l6', 'lectures_mt5sy7fr'],
  ['l_mskiwlabhgr9u', 'l_mr29yai68xvad', 'l_mqcuqz7aplqgo', 'l6', 'l_mls8mo9epkzye'],
];
const preceding = ['lectures_mt5sy7fr', 'l_mr29yai68xvad', 'lectures_20261007_canva_korea', 'l_mskip8tt41oij', 'l_mskifjabnr1q2'];
const plain = value => JSON.parse(JSON.stringify(value));
function start(candidate, data = published, storage = new Map()) {
  if (candidate !== undefined) storage.set(key, JSON.stringify(candidate));
  const events = [];
  const context = {
    profileData: structuredClone(data), console,
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    localStorage: { getItem: name => storage.get(name) || '', setItem: (name, value) => storage.set(name, value), removeItem: name => storage.delete(name) },
    window: { dispatchEvent: event => events.push(event) },
  };
  vm.runInNewContext(script, context);
  return { data: context.profileData, store: context.window.ProfileLectureStore, storage, events };
}

test('clean browsers use the approved five highlights once in the requested order', () => {
  const { data, store, storage } = start();
  assert.deepEqual(plain(data.lectureCuration.highlights), next);
  assert.deepEqual(plain(store.defaults), next);
  assert.equal(new Set(data.lectureCuration.highlights).size, 5);
  assert.equal(storage.size, 0);
});

test('previously migrated highlights move only Canva second and preserve saved bytes', () => {
  const highlights=[next[0],next[2],next[1],...next.slice(3)];
  const candidate={highlights,hidden:[next[4]],label:'내 대표 강의',curationMigrationIds:['2026-10-selected-lecture-highlights','2026-10-gyeongnam-highlight']};
  const first=start(candidate);
  assert.deepEqual(plain(first.data.lectureCuration),{highlights:next,hidden:candidate.hidden,label:candidate.label});
  assert.equal(first.storage.get(key),JSON.stringify(candidate));
  first.store.save(candidate);
  assert.deepEqual(plain(start(undefined,published,first.storage).data.lectureCuration.highlights),highlights);
});

previous.forEach((highlights, index) => {
  test(`known old selection ${index + 1} migrates without writing or changing hidden/label`, () => {
    const candidate = { highlights, hidden: ['l6', next[4]], label: '내 대표 강의' };
    const { data, storage } = start(candidate);
    assert.deepEqual(plain(data.lectureCuration), { ...candidate, highlights: next });
    assert.equal(storage.get(key), JSON.stringify(candidate));
    assert.deepEqual(plain(data.lectures), published.lectures);
    assert.deepEqual(plain(data.youtubeVideos), published.youtubeVideos);
  });
});

test('customized selections and reordered old choices stay untouched', () => {
  for (const highlights of [[previous[0][1], previous[0][0], ...previous[0].slice(2)], [next[4], ...previous[0].slice(1)]]) {
    const { data } = start({ highlights, hidden: [next[0]], label: '직접 선택' });
    assert.deepEqual(plain(data.lectureCuration), { highlights, hidden: [next[0]], label: '직접 선택' });
  }
});

test('migration is gated to the exact new published selection', () => {
  const future = structuredClone(published);
  future.lectureCuration.highlights = [...next].reverse();
  const { data } = start({ highlights: previous[1] }, future);
  assert.deepEqual(plain(data.lectureCuration.highlights), previous[1]);
});

test('explicitly saving an old selection is respected after reload and metadata stays local', () => {
  const first = start({ highlights: previous[0] });
  const chosen = { highlights: previous[1], hidden: ['l6'], label: '다시 고른 강의' };
  const value = first.store.save(chosen);
  assert.deepEqual(plain(value), chosen);
  assert.ok(JSON.parse(first.storage.get(key)).curationMigrationIds.includes('2026-10-selected-lecture-highlights'));
  assert.deepEqual(plain(first.events[0].detail), chosen);
  const second = start(undefined, published, first.storage);
  assert.deepEqual(plain(second.data.lectureCuration), chosen);
  assert.deepEqual(Object.keys(second.data.lectureCuration).sort(), ['hidden', 'highlights', 'label']);
});

test('malformed migration metadata cannot discard local hidden or label edits', () => {
  const { data } = start({ highlights: previous[1], hidden: ['l6'], label: '내 선택', curationMigrationIds: 5 });
  assert.deepEqual(plain(data.lectureCuration), { highlights: next, hidden: ['l6'], label: '내 선택' });
});

test('all five target records retain their original gallery images', () => {
  const selected = next.map(id => published.lectures.find(item => item.id === id));
  assert.deepEqual(selected.map(item => item.images.length), [3, 3, 3, 4, 1]);
  assert.equal(selected[1].image, 'uploads/20261007-canva-cover.webp');
  assert.equal(selected[3].title, '[경남 중등 1정연수] NotebookLM 마스터 클래스');
  assert.equal(selected[3].org, '경상국립대학교');
  assert.equal(selected[4].topic, '학부모·학생 강의');
  assert.equal(published.lectures.length, 69);
  assert.equal(published.youtubeVideos.length, 21);
});

test('the preceding published selection adopts the current approved highlights, with or without the prior marker', () => {
  for (const curationMigrationIds of [[], ['2026-10-selected-lecture-highlights']]) {
    const candidate = { highlights: preceding, hidden: ['l6'], label: '내 선택', curationMigrationIds };
    const { data, storage } = start(candidate);
    assert.deepEqual(plain(data.lectureCuration), { highlights: next, hidden: ['l6'], label: '내 선택' });
    assert.equal(storage.get(key), JSON.stringify(candidate));
  }
});

test('an intentional old-default save after the previous migration is not mistaken for stale defaults', () => {
  const candidate = { highlights: previous[0], curationMigrationIds: ['2026-10-selected-lecture-highlights'] };
  assert.deepEqual(plain(start(candidate).data.lectureCuration.highlights), previous[0]);
});

test('an explicit later return to the Daejeon selection survives reload', () => {
  const first = start();
  first.store.save({ highlights: preceding, hidden: [], label: '다시 선택' });
  const second = start(undefined, published, first.storage);
  assert.deepEqual(plain(second.data.lectureCuration.highlights), preceding);
  assert.ok(JSON.parse(first.storage.get(key)).curationMigrationIds.includes('2026-10-gyeongnam-highlight'));
});
