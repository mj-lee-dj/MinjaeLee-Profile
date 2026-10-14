const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

function contentStore() {
  const profileData = {
    personal: { contact: {} },
    publications: [], onlineCourses: [], youtubeVideos: [], lectures: [],
    awards: [], activities: [], press: [],
  };
  const context = {
    profileData, structuredClone, console,
    CustomEvent: class CustomEvent {},
    localStorage: { getItem: () => '', setItem: () => {}, removeItem: () => {} },
    window: { dispatchEvent: () => {} },
  };
  vm.runInNewContext(read('draft-content-store.js'), context);
  return context.window.ProfileContentStore;
}

test('new lectures are inserted before older records while other collections keep their order', () => {
  const store = contentStore();
  const older = [{ id: 'old', title: '기존 강의' }];
  const lectureIds = store.insert('lectures', older, { id: 'new', title: '새 강의' }).map((item) => item.id);
  const bookIds = store.insert('publications', older, { id: 'new', title: '새 책' }).map((item) => item.id);
  assert.deepEqual(Array.from(lectureIds), ['new', 'old']);
  assert.deepEqual(Array.from(bookIds), ['old', 'new']);
});

test('three autumn lectures have slide images and the Live session belongs to Watch', () => {
  const data = JSON.parse(read('data_v3.json'));
  assert.deepEqual(data.lectures.slice(0, 4).map((item) => item.id), [
    'lectures_20261007_canva_korea',
    'lectures_20260930_cheongsu_ai_design',
    'lectures_20260929_panam_chromebook',
    'lectures_mt5sy7fr',
  ]);
  assert.equal(data.lectures.length, 64);
  assert.ok(!data.lectures.some((item) => item.id === 'lectures_20261013_gemini_notebook_live_1'));
  const live = data.youtubeVideos[0];
  assert.equal(live.id, 'youtubeVideos_20261013_gemini_notebook_live_1');
  assert.equal(live.link, 'https://youtube.com/live/2Dqpsaqa0Jw');
  assert.deepEqual(live.images, []);
  assert.equal(data.youtubeVideos.length, 18);
  data.lectures.slice(0, 3).forEach((item) => {
    assert.equal(item.visible, true);
    assert.equal(item.year, '2026');
    assert.equal(item.link, '');
    assert.equal(item.images.length, 3);
    assert.equal(item.image, item.images[0]);
    item.images.forEach((image) => assert.ok(fs.existsSync(path.join(root, image))));
    assert.equal(item.highlight, false);
  });
});

test('lecture add and edit modal exposes a Highlights checkbox tied to the curation store', () => {
  const schema = read('admin-content-schema.js');
  const editor = read('admin-content-local.js');
  assert.match(schema, /\['highlight', 'HIGHLIGHTS에 노출', 'checkbox'\]/);
  assert.match(editor, /ProfileLectureStore\.load\(\)\.highlights\.includes/);
  assert.match(editor, /ProfileLectureStore\.save/);
});

test('desktop lecture gallery separates Highlights framing from row-aligned topic galleries', () => {
  const css = read('editorial-v4.css');
  const media = read('draft-v2-media.js');
  assert.match(media, /layout\.dataset\.view = state\.topic === 'selected' \? 'highlights' : 'topic'/);
  assert.match(media, /--lecture-showcase-offset/);
  assert.match(css, /\[data-view='highlights'\][\s\S]+height:100%/);
  assert.match(css, /\[data-view='topic'\][\s\S]+top:var\(--lecture-showcase-offset\)/);
  assert.match(css, /\[data-view='topic'\][\s\S]+grid-template-columns:repeat\(3/);
});

test('archive CTA is a compact editorial text control, not a full paper block', () => {
  const css = read('editorial-v4.css');
  assert.match(css, /\.archive-more[\s\S]+width:max-content[\s\S]+background:transparent/);
  assert.doesNotMatch(css, /\.archive-more \{[^}]+background:var\(--paper-bright\)/);
});

test('latest Watch item saved with the Google lecture is publicly visible', () => {
  const data = JSON.parse(read('data_v3.json'));
  const latest = data.youtubeVideos.find((item) => item.id === 'youtubeVideos_mt3md3pm');
  assert.ok(latest);
  assert.equal(latest.visible, true);
});


test('tablet uses the compact lecture gallery instead of a full-list showcase', () => {
  const css = read('editorial-v4.css');
  const media = read('draft-v2-media.js');
  assert.match(media, /matchMedia\('\(max-width: 1024px\)'\)/);
  assert.match(css, /@media \(max-width:1024px\)[\s\S]+\.lecture-showcase-wrap \{ display:none; \}/);
  assert.match(css, /@media \(min-width:1025px\) \{ \.lecture-gallery \{ display:none !important; \} \}/);
});


test('Watch media links preserve absolute YouTube URLs', () => {
  const media = read('draft-v2-media.js');
  assert.ok(media.includes("const externalUrl = (value) => /^https?:\\/\\//i.test"));
});
