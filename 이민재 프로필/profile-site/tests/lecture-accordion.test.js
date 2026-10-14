const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const published = JSON.parse(read('data_v3.json'));
const topics = ['AI', 'Google', 'Canva·에듀테크', '교사 업무·학급경영', '학부모·학생 강의', '강사코칭'];
const counts = [8, 24, 10, 14, 3, 5];
const oldLiveId = 'lectures_20261013_gemini_notebook_live_1';
const plain = (value) => JSON.parse(JSON.stringify(value));
const ids = (items) => Array.from(items, (item) => item.id);

// The public data model must load without executing the DOMContentLoaded UI.
// These are model/integration tests, not substitutes for browser interaction tests.
function model() {
  const context = { window: {}, document: { addEventListener() {} }, console };
  vm.runInNewContext(read('lecture-accordion.js'), context);
  assert.ok(context.window.ProfileLectureArchiveModel, 'archive model is available before DOMContentLoaded');
  return context.window.ProfileLectureArchiveModel;
}

function loadDraft(data = published, storage = new Map()) {
  const context = {
    profileData: structuredClone(data), structuredClone, console,
    document: { addEventListener() {} },
    CustomEvent: class CustomEvent {},
    localStorage: {
      getItem: (key) => storage.get(key) || '',
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    window: { dispatchEvent() {} },
  };
  vm.runInNewContext(read('draft-content-store.js'), context);
  vm.runInNewContext(read('draft-lecture-store.js'), context);
  vm.runInNewContext(read('lecture-accordion.js'), context);
  return {
    data: context.profileData,
    content: context.window.ProfileContentStore,
    curation: context.window.ProfileLectureStore.load(),
    archive: context.window.ProfileLectureArchiveModel,
    storage,
  };
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

test('archive exposes the six approved categories in the agreed order', () => {
  const archive = model();
  assert.deepEqual(Array.from(archive.topics, (topic) => topic.id), topics);
  assert.equal(new Set(archive.topics.map((topic) => topic.id)).size, 6);
  archive.topics.forEach((topic) => {
    assert.equal(typeof topic.label, 'string');
    assert.ok(topic.label.trim(), `${topic.id} has a visible label`);
    assert.equal(typeof topic.description, 'string');
    assert.ok(topic.description.trim(), `${topic.id} has a category description`);
  });
});

test('all 64 published lectures have the expected category counts and year range', () => {
  const archive = model();
  const visible = archive.visibleLectures(published, []);
  assert.equal(visible.length, 64);
  assert.deepEqual(ids(visible), ids(published.lectures));
  assert.deepEqual(topics.map((topic) => archive.categoryPage(published, topic, 0, 4, []).total), counts);
  assert.deepEqual(plain(archive.summary(published, [])), { total: 64, topics: 6, years: [2022, 2026] });
  assert.equal(counts.reduce((sum, count) => sum + count, 0), visible.length);
});

for (const pageSize of [2, 4]) {
  test(`${pageSize}-row category paging reaches every lecture once, in source order`, () => {
    const archive = model();
    for (const topic of topics) {
      const expected = published.lectures.filter((item) => item.topic === topic);
      const pages = Math.ceil(expected.length / pageSize);
      const collected = [];
      for (let page = 0; page < pages; page += 1) {
        const result = archive.categoryPage(published, topic, page, pageSize, []);
        const start = page * pageSize;
        assert.equal(result.total, expected.length, `${topic}: total`);
        assert.equal(result.page, page, `${topic}: current page`);
        assert.equal(result.pages, pages, `${topic}: page count`);
        assert.equal(result.start, start + 1, `${topic}: first displayed position`);
        assert.equal(result.end, Math.min(start + pageSize, expected.length), `${topic}: last displayed position`);
        assert.deepEqual(ids(result.items), ids(expected.slice(start, start + pageSize)), `${topic}: page ${page}`);
        collected.push(...ids(result.items));
      }
      assert.deepEqual(collected, ids(expected), `${topic}: complete traversal`);
      assert.equal(new Set(collected).size, expected.length, `${topic}: no duplicates`);
    }
  });
}

test('out-of-range category pages clamp to the first or last page', () => {
  const archive = model();
  const expected = published.lectures.filter((item) => item.topic === 'Google');
  for (const page of [-5, -1]) {
    const result = archive.categoryPage(published, 'Google', page, 4, []);
    assert.equal(result.page, 0);
    assert.equal(result.start, 1);
    assert.equal(result.end, 4);
    assert.deepEqual(ids(result.items), ids(expected.slice(0, 4)));
  }
  const last = archive.categoryPage(published, 'Google', 999, 4, []);
  assert.equal(last.page, 5);
  assert.equal(last.pages, 6);
  assert.equal(last.start, 21);
  assert.equal(last.end, 24);
  assert.deepEqual(ids(last.items), ids(expected.slice(-4)));
});

test('a short final page reports its actual end and does not borrow from another category', () => {
  const archive = model();
  const expected = published.lectures.filter((item) => item.topic === '강사코칭');
  const last = archive.categoryPage(published, '강사코칭', 1, 4, []);
  assert.deepEqual(plain(last), { items: [expected[4]], total: 5, page: 1, pages: 2, start: 5, end: 5 });
});

test('hidden IDs and visible=false are excluded before counts and paging', () => {
  const archive = model();
  const data = structuredClone(published);
  const google = data.lectures.filter((item) => item.topic === 'Google');
  google[1].visible = false;
  const hidden = [google[0].id, google[0].id, 'not-a-lecture'];
  const expected = data.lectures.filter((item) => item.visible !== false && !hidden.includes(item.id));
  assert.deepEqual(ids(archive.visibleLectures(data, hidden)), ids(expected));
  assert.equal(archive.summary(data, hidden).total, 62);
  const result = archive.categoryPage(data, 'Google', 0, 4, hidden);
  assert.equal(result.total, 22);
  assert.equal(result.pages, 6);
  assert.deepEqual(ids(result.items), ids(google.slice(2, 6)));
});

test('an unspecified visibility flag remains visible, while only explicit false hides a lecture', () => {
  const archive = model();
  const data = { lectures: [
    { id: 'implicit', topic: 'AI', year: '2026' },
    { id: 'shown', topic: 'AI', year: '2025', visible: true },
    { id: 'private', topic: 'AI', year: '2024', visible: false },
  ] };
  assert.deepEqual(ids(archive.visibleLectures(data, [])), ['implicit', 'shown']);
  assert.equal(archive.categoryPage(data, 'AI', 0, 4, []).total, 2);
});

test('empty, fully hidden and unmatched categories return a stable empty page', () => {
  const archive = model();
  const emptyPage = { items: [], total: 0, page: 0, pages: 0, start: 0, end: 0 };
  for (const data of [{}, { lectures: [] }]) {
    assert.deepEqual(ids(archive.visibleLectures(data, [])), []);
    assert.deepEqual(plain(archive.categoryPage(data, 'AI', 99, 4, [])), emptyPage);
    assert.deepEqual(plain(archive.summary(data, [])), { total: 0, topics: 6, years: [] });
  }
  assert.deepEqual(plain(archive.categoryPage(published, 'unknown-topic', 99, 4, [])), emptyPage);
  const hidden = ids(published.lectures);
  assert.deepEqual(plain(archive.categoryPage(published, 'AI', 2, 2, hidden)), emptyPage);
  assert.deepEqual(plain(archive.summary(published, hidden)), { total: 0, topics: 6, years: [] });
});

test('summary years are calculated from visible lectures rather than hidden records or Watch videos', () => {
  const archive = model();
  const data = {
    lectures: [
      { id: 'middle', topic: 'Google', year: '2025', visible: true },
      { id: 'latest', topic: 'AI', year: '2026', visible: true },
      { id: 'oldest', topic: 'AI', year: '2022', visible: true },
      { id: 'private', topic: 'AI', year: '1990', visible: false },
      { id: 'hidden', topic: 'AI', year: '2040', visible: true },
    ],
    youtubeVideos: [{ id: 'video', year: '2050', visible: true }],
  };
  assert.deepEqual(plain(archive.summary(data, ['hidden'])), { total: 3, topics: 6, years: [2022, 2026] });
  assert.deepEqual(plain(archive.summary(data, ['hidden', 'oldest', 'latest'])), { total: 1, topics: 6, years: [2025, 2025] });
});

test('model calls preserve source order, local field edits and every gallery image without mutation', () => {
  const archive = model();
  const data = structuredClone(published);
  const local = { ...data.lectures[1], id: 'local-only', title: '로컬에서 수정한 제목', year: '2021',
    org: '로컬 기관', images: ['uploads/local-1.png', 'uploads/local-2.png', 'uploads/local-3.png'],
    image: 'uploads/local-1.png', link: 'https://example.com/local-lecture' };
  data.lectures.unshift(local);
  const hidden = [data.lectures[3].id];
  const before = JSON.stringify(data);
  deepFreeze(data);
  Object.freeze(hidden);
  const visible = archive.visibleLectures(data, hidden);
  const first = archive.categoryPage(data, 'AI', 0, 2, hidden);
  archive.summary(data, hidden);
  assert.deepEqual(plain(first.items[0]), plain(local));
  assert.deepEqual(ids(first.items), ['local-only', published.lectures[1].id]);
  assert.deepEqual(ids(visible), ids(data.lectures.filter((item) => !hidden.includes(item.id))));
  assert.equal(JSON.stringify(data), before);
  assert.deepEqual(hidden, [data.lectures[3].id]);
});

test('the published JavaScript and JSON feeds expose the same archive data, with Live only in Watch', () => {
  const context = vm.createContext({});
  vm.runInContext(read('data_v3.js'), context);
  const scriptData = vm.runInContext('profileData', context);
  assert.deepEqual(plain(scriptData.lectures), published.lectures);
  const archive = model();
  const visible = archive.visibleLectures(scriptData, []);
  assert.equal(visible.length, 64);
  assert.ok(!visible.some((item) => item.id === oldLiveId));
  assert.ok(scriptData.youtubeVideos.some((item) => item.id === 'youtubeVideos_20261013_gemini_notebook_live_1'));
  published.lectures.slice(0, 3).forEach((lecture) => {
    const page = archive.categoryPage(scriptData, lecture.topic, 0, 4, []);
    const renderedData = page.items.find((item) => item.id === lecture.id);
    assert.ok(renderedData);
    assert.deepEqual(plain(renderedData.images), lecture.images);
    assert.equal(renderedData.images.length, 3);
  });
});

test('a stale 61-record draft still supplies all published lectures to the accordion while preserving local edits', () => {
  const old = structuredClone(published);
  old.lectures = old.lectures.slice(3);
  const candidate = structuredClone(loadDraft(old).content.state);
  delete candidate.contentMigrationIds;
  delete candidate.sourceLectureIds;
  candidate.lectures[0].title = '로컬에서 편집 중인 강의 제목';
  const serialized = JSON.stringify(candidate);
  const storage = new Map([['profileDraft.contentV1', serialized]]);
  const { data, archive, curation } = loadDraft(published, storage);
  const visible = archive.visibleLectures(data, curation.hidden);
  assert.equal(visible.length, 64);
  assert.deepEqual(ids(visible.slice(0, 3)), ids(published.lectures.slice(0, 3)));
  assert.equal(visible[3].title, '로컬에서 편집 중인 강의 제목');
  assert.deepEqual(topics.map((topic) => archive.categoryPage(data, topic, 0, 4, curation.hidden).total), counts);
  assert.equal(storage.get('profileDraft.contentV1'), serialized);
});

test('the pre-correction 65-record draft keeps Live out of the accordion and honors surviving hidden choices', () => {
  const candidate = structuredClone(loadDraft().content.state);
  delete candidate.contentMigrationIds;
  candidate.youtubeVideos = candidate.youtubeVideos.filter((item) => item.id !== 'youtubeVideos_20261013_gemini_notebook_live_1');
  candidate.lectures.unshift({ ...candidate.lectures[1], id: oldLiveId, title: '교사에게 AI 딱 하나만 추천한다면' });
  candidate.sourceLectureIds.unshift(oldLiveId);
  const hiddenId = published.lectures[0].id;
  const serialized = JSON.stringify(candidate);
  const storedCuration = JSON.stringify({ highlights: [oldLiveId], hidden: [oldLiveId, hiddenId], label: '내 선택' });
  const storage = new Map([
    ['profileDraft.contentV1', serialized],
    ['profileDraft.lectureCuration', storedCuration],
  ]);
  const { data, archive, curation } = loadDraft(published, storage);
  const visible = archive.visibleLectures(data, curation.hidden);
  assert.equal(data.lectures.length, 64);
  assert.equal(visible.length, 63);
  assert.ok(!visible.some((item) => item.id === oldLiveId || item.id === hiddenId));
  assert.ok(data.youtubeVideos.some((item) => item.id === 'youtubeVideos_20261013_gemini_notebook_live_1'));
  assert.equal(archive.categoryPage(data, 'AI', 0, 4, curation.hidden).total, 8);
  assert.equal(archive.categoryPage(data, 'Canva·에듀테크', 0, 4, curation.hidden).total, 9);
  assert.equal(storage.get('profileDraft.contentV1'), serialized);
  assert.equal(storage.get('profileDraft.lectureCuration'), storedCuration);
});
