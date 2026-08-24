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

test('current saved Google lecture is first in the deployed content order', () => {
  const data = JSON.parse(read('data_v3.json'));
  assert.equal(data.lectures[0].id, 'lectures_mt5sy7fr');
  assert.equal(data.lectures[0].category, 'Google');
});

test('lecture add and edit modal exposes a Highlights checkbox tied to the curation store', () => {
  const schema = read('admin-content-schema.js');
  const editor = read('admin-content-local.js');
  assert.match(schema, /\['highlight', 'HIGHLIGHTS에 노출', 'checkbox'\]/);
  assert.match(editor, /ProfileLectureStore\.load\(\)\.highlights\.includes/);
  assert.match(editor, /ProfileLectureStore\.save/);
});

test('desktop lecture gallery and archive CTA use contained layout rules', () => {
  const css = read('editorial-v4.css');
  assert.match(css, /@media \(min-width:1025px\)[\s\S]+\.lecture-showcase-wrap[\s\S]+position:absolute/);
  assert.match(css, /\.archive-more[\s\S]+box-sizing:border-box[\s\S]+overflow:hidden/);
});
