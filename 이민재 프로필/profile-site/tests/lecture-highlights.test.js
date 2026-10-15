const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const data = JSON.parse(read('data_v3.json'));
const context = { window: {}, document: { addEventListener() {} }, console };
vm.runInNewContext(read('lecture-accordion.js'), context);
const model = context.window.ProfileLectureArchiveModel;
const ids = (items) => Array.from(items, item => item.id);

test('highlights use exactly the existing five selected records in saved order', () => {
  const selected = model.selectedHighlights(data, data.lectureCuration);
  assert.deepEqual(ids(selected), data.lectureCuration.highlights);
  assert.equal(selected.length, 5);
  assert.deepEqual(ids(selected), ['lectures_mt5sy7fr', 'l_mr29yai68xvad', 'lectures_20261007_canva_korea', 'l_mskirvwkn6cbr', 'l_mskifjabnr1q2']);
  selected.forEach(item => assert.ok(item.images.length > 0));
});

test('highlights honor local selections, visibility and hidden choices without replacement records', () => {
  const first = data.lectureCuration.highlights[0];
  const second = data.lectureCuration.highlights[1];
  assert.deepEqual(ids(model.selectedHighlights(data, { highlights: [second, first, second, 'missing'], hidden: [first] })), [second]);
  const copy = structuredClone(data);
  copy.lectures.find(item => item.id === second).visible = false;
  assert.deepEqual(ids(model.selectedHighlights(copy, { highlights: [second] })), []);
  assert.deepEqual(ids(model.selectedHighlights(data, { highlights: [] })), []);
});

test('highlight selection leaves the archive total and all existing media untouched', () => {
  const before = JSON.stringify(data);
  model.selectedHighlights(data, data.lectureCuration);
  assert.equal(JSON.stringify(data), before);
  assert.equal(model.summary(data).total, 64);
});

test('all highlights precede the category archive as a normal list without carousel controls', () => {
  const html = read('index.html');
  assert.ok(html.indexOf('id="lectureHighlights"') < html.indexOf('id="lectureArchiveCount"'));
  assert.ok(html.indexOf('id="lectureArchiveCount"') < html.indexOf('id="lectureAccordion"'));
  assert.match(html, /<ol class="lecture-highlights__grid" id="lectureHighlightGrid" aria-label="대표 강의"><\/ol>/);
  assert.doesNotMatch(html, /lectureHighlightPrev|lectureHighlightNext|lectureHighlightsPosition|aria-roledescription="slide"/);
  assert.doesNotMatch(read('lecture-accordion.js'), /moveHighlight|state\.highlight|highlightPrevious|highlightNext/);
  assert.match(read('lecture-accordion.js'), /const markup = records\.map\(\(lecture\) =>/);
  assert.match(read('lecture-accordion.js'), /if \(markup !== highlightMarkup\)/);
  assert.match(read('lecture-accordion.css'), /\.lecture-highlights__image img \{[^}]*object-fit:contain/);
  assert.doesNotMatch(read('lecture-accordion.js'), /setInterval\s*\(/);
});
