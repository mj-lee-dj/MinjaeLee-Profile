const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('public entry keeps the existing proof, lecture, and local draft flow', () => {
  const indexHtml = read('index.html');
  const publicRenderer = `${read('draft-v2.js')}\n${read('draft-v2-media.js')}`;
  assert.match(indexHtml, /<script src="data_v3\.js/);
  assert.match(indexHtml, /draft-data\.js[\s\S]+draft-content-store\.js[\s\S]+draft-lecture-store\.js/);
  assert.match(publicRenderer, /ProfileContentStore/);
  assert.match(publicRenderer, /ProfileLectureStore/);
});

test('legacy browser profile data cannot replace the deployed profile photo', () => {
  const collections = Object.fromEntries([
    'publications', 'onlineCourses', 'youtubeVideos', 'lectures',
    'awards', 'activities', 'press',
  ].map((key) => [key, []]));
  const profileData = {
    ...collections,
    personal: {
      name: '이민재', nameEn: 'Minjae Lee', statement: '현재 선언문',
      draftPhoto: 'uploads/current-profile.webp', lectureCount: '150+',
      contact: { email: 'test@example.com', instagram: 'https://example.com' },
    },
  };
  const deployedData = structuredClone(profileData);
  const legacyDraft = {
    version: 1,
    personal: {
      name: '이민재', nameEn: 'Minjae Lee', statement: '예전 선언문',
      photo: 'assets/profile.jpg', lectureCount: '150+',
      email: 'test@example.com', instagram: 'https://example.com',
    },
    ...collections,
  };
  const context = {
    profileData, structuredClone, console,
    CustomEvent: class CustomEvent {},
    localStorage: {
      getItem: () => JSON.stringify(legacyDraft),
      setItem: () => {},
      removeItem: () => {},
    },
    window: { dispatchEvent: () => {} },
  };
  vm.runInNewContext(read('draft-content-store.js'), context);
  const store = context.window.ProfileContentStore;
  assert.equal(store.state.personal.photo, 'uploads/current-profile.webp');
  assert.equal(store.state.photoDirty, false);
  assert.equal(profileData.personal.draftPhoto, 'uploads/current-profile.webp');
  assert.equal(profileData.personal.statement, '예전 선언문');
  const unchanged = structuredClone(store.state);
  unchanged.personal.photo = 'assets/profile.jpg';
  assert.equal(store.merge(deployedData, unchanged).personal.draftPhoto, 'uploads/current-profile.webp');
  const changed = structuredClone(store.state);
  changed.photoDirty = true;
  changed.personal.photo = 'uploads/new-profile.webp';
  assert.equal(store.merge(deployedData, changed).personal.draftPhoto, 'uploads/new-profile.webp');
  const published = store.normalize(deployedData);
  assert.equal(published.personal.photo, 'uploads/current-profile.webp');
  assert.equal(published.photoDirty, false);
});

test('profile editor accepts an image file without exposing a path text field', () => {
  const adminHtml = read('admin.html');
  const imageScript = read('admin-image-paste.js');
  const publishScript = read('admin-publish.js');
  const localScript = read('admin-content-local.js');
  assert.match(adminHtml, /id="profilePhotoFile"[^>]+type="file"/);
  assert.match(adminHtml, /name="photo"[^>]+type="hidden"/);
  assert.doesNotMatch(adminHtml, /프로필 사진 경로/);
  assert.match(imageScript, /enhanceProfile/);
  assert.match(publishScript, /profileDraft:published/);
  assert.match(localScript, /state\.photoDirty/);
  assert.match(localScript, /profileDraft:published/);
});
