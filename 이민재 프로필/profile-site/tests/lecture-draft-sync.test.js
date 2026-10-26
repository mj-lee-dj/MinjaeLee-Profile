const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const published = JSON.parse(fs.readFileSync(path.join(root, 'data_v3.json'), 'utf8'));
const liveOne = published.youtubeVideos.find((item) => item.id === 'youtubeVideos_20261013_gemini_notebook_live_1');
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
  old.lectures = old.lectures.slice(3);
  old.youtubeVideos = old.youtubeVideos.filter((item) => !item.id.startsWith('youtubeVideos_202610'));
  const candidate = start(old).store.state;
  delete candidate.contentMigrationIds;
  delete candidate.sourceLectureIds;
  return candidate;
}
test('a browser draft missing recently added records cannot hide the three newly published lectures and relocated Live video', () => {
  const candidate = oldDraft();
  const serialized = JSON.stringify(candidate);
  const storage = new Map([['profileDraft.contentV1', serialized]]);
  const { data } = start(published, storage);
  assert.equal(data.lectures.length, 69);
  assert.deepEqual(data.lectures.slice(0, 3).map((item) => item.id), published.lectures.slice(0, 3).map((item) => item.id));
  assert.equal(data.lectures.filter((item) => item.topic === 'AI')[0].id, published.lectures.find((item) => item.topic === 'AI').id);
  assert.equal(data.youtubeVideos[0].id, published.youtubeVideos[0].id);
  assert.equal(data.youtubeVideos.filter((item) => item.id === liveOne.id).length, 1);
  assert.equal(storage.get('profileDraft.contentV1'), serialized);
});
test('sync preserves existing draft edits, local-only lectures and unrelated sections', () => {
  const candidate = oldDraft();
  candidate.lectures[0].title = '저장 전 수정 중인 강의';
  candidate.lectures.unshift({ ...candidate.lectures[0], id: 'local-only', title: '아직 공개하지 않은 강의' });
  candidate.personal.statement = '저장 전 선언문';
  const { data } = start(published, new Map([['profileDraft.contentV1', JSON.stringify(candidate)]]));
  assert.equal(data.lectures.length, 70);
  assert.equal(data.lectures[3].id, 'local-only');
  assert.equal(data.lectures[4].title, '저장 전 수정 중인 강의');
  assert.equal(data.personal.statement, '저장 전 선언문');
  assert.deepEqual(data.press, published.press);
});
test('saved explicit lecture removal remains removed on reload', () => {
  const first = start(published);
  const candidate = structuredClone(first.store.state);
  candidate.lectures = candidate.lectures.filter((item) => item.id !== published.lectures[0].id);
  first.store.save(candidate);
  const reloaded = start(published, first.storage);
  assert.equal(reloaded.data.lectures.length, 68);
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
  assert.ok(!Object.hasOwn(store.merge(published, store.state), 'contentMigrationIds'));
});

function preCorrectionDraft() {
  const candidate = structuredClone(start(published).store.state);
  delete candidate.contentMigrationIds;
  candidate.youtubeVideos = candidate.youtubeVideos.filter((item) => item.id !== liveOne.id);
  candidate.lectures.filter((item) => ['lectures_20261007_canva_korea', 'lectures_20260930_cheongsu_ai_design', 'lectures_20260929_panam_chromebook'].includes(item.id)).forEach((item) => { item.images = []; item.image = ''; });
  candidate.lectures.unshift({ ...candidate.lectures[2], id: 'lectures_20261013_gemini_notebook_live_1', title: '교사에게 AI 딱 하나만 추천한다면', images: [], image: '' });
  candidate.sourceLectureIds.unshift('lectures_20261013_gemini_notebook_live_1');
  return candidate;
}

test('a draft with the old Live lecture relocates Live and fills three slide galleries without writing storage', () => {
  const candidate = preCorrectionDraft();
  candidate.lectures[4].title = '보존할 로컬 수정';
  const serialized = JSON.stringify(candidate);
  const { data, store, storage } = start(published, new Map([['profileDraft.contentV1', serialized]]));
  assert.equal(data.lectures.length, 69);
  assert.ok(!data.lectures.some((item) => item.id === 'lectures_20261013_gemini_notebook_live_1'));
  assert.equal(data.youtubeVideos.length, 21);
  assert.equal(data.youtubeVideos.filter((item) => item.id === liveOne.id).length, 1);
  assert.equal(data.lectures[3].title, '보존할 로컬 수정');
  data.lectures.filter((item) => ['lectures_20261007_canva_korea', 'lectures_20260930_cheongsu_ai_design', 'lectures_20260929_panam_chromebook'].includes(item.id)).forEach((item) => assert.deepEqual(item.images, published.lectures.find((source) => source.id === item.id).images));
  assert.equal(storage.get('profileDraft.contentV1'), serialized);
  const merged = store.merge(published, candidate);
  assert.equal(merged.lectures.length, 69);
  assert.equal(merged.youtubeVideos.filter((item) => item.id === liveOne.id).length, 1);
  assert.ok(!Object.hasOwn(merged, 'contentMigrationIds'));
});

test('migration preserves custom images and an equivalent existing video link', () => {
  const candidate = preCorrectionDraft();
  candidate.lectures[1].images = ['uploads/local-custom.png'];
  candidate.lectures[1].image = 'uploads/local-custom.png';
  candidate.youtubeVideos.unshift({ ...liveOne, id: 'local-live-video', title: '로컬 영상 제목', link: 'https://www.youtube.com/watch?v=2Dqpsaqa0Jw&feature=share' });
  const { data } = start(published, new Map([['profileDraft.contentV1', JSON.stringify(candidate)]]));
  assert.equal(data.youtubeVideos.length, 21);
  assert.equal(data.youtubeVideos.find(item => item.id === 'local-live-video').title, '로컬 영상 제목');
  assert.deepEqual(Array.from(data.lectures[0].images), ['uploads/local-custom.png']);
});

test('after explicit save, later video removal and image clearing are not resurrected', () => {
  const first = start(published, new Map([['profileDraft.contentV1', JSON.stringify(preCorrectionDraft())]]));
  first.store.save(first.store.state);
  const candidate = structuredClone(first.store.state);
  candidate.youtubeVideos = candidate.youtubeVideos.slice(1);
  candidate.lectures[0].images = []; candidate.lectures[0].image = '';
  first.store.save(candidate);
  const next = start(published, first.storage);
  assert.equal(next.data.youtubeVideos.length, 20);
  assert.equal(next.data.lectures[0].images.length, 0);
});

test('stale lecture curation drops Live references while preserving other choices', () => {
  const oldLive = 'lectures_20261013_gemini_notebook_live_1';
  const retained = published.lectures[0].id;
  const curated = JSON.stringify({ highlights: [oldLive, retained], hidden: [oldLive, retained], label: '내 선택' });
  const storage = new Map([['profileDraft.contentV1', JSON.stringify(preCorrectionDraft())], ['profileDraft.lectureCuration', curated]]);
  const { data } = start(published, storage);
  const context = { profileData: data, console, window: { dispatchEvent: () => {} }, CustomEvent: class {}, localStorage: { getItem: (key) => storage.get(key) || '', setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'draft-lecture-store.js'), 'utf8'), context);
  const result = context.window.ProfileLectureStore.load();
  assert.ok(!result.highlights.includes(oldLive));
  assert.ok(!result.hidden.includes(oldLive));
  assert.ok(result.highlights.includes(retained));
  assert.ok(result.hidden.includes(retained));
  assert.equal(result.label, '내 선택');
  assert.equal(storage.get('profileDraft.lectureCuration'), curated);
});

const sunamLectureId = 'l_mskifjabnr1q2';
const sunamMigrationId = '2026-10-sunam-lecture-audience';
const audienceTopic = '학부모·학생 강의';
const plain = (value) => JSON.parse(JSON.stringify(value));
const sunam = (state) => state.lectures.find((item) => item.id === sunamLectureId);
function preAudienceCorrectionDraft() {
  const candidate = structuredClone(start(published).store.state);
  candidate.contentMigrationIds = candidate.contentMigrationIds.filter((id) => id !== sunamMigrationId);
  Object.assign(sunam(candidate), { topic: 'Google', category: 'Google/Gemini' });
  return candidate;
}

test('the exact 2026 Sunam lecture is published under the audience category in byte-consistent feeds', () => {
  const lecture = sunam(published);
  assert.equal(published.lectures.filter((item) => item.id === sunamLectureId).length, 1);
  assert.equal(lecture.title, '[인공지능 활용 진로특강] 생성AI로 내 삶을 스마트하게 운영하기');
  assert.equal(lecture.org, '김해수남고등학교');
  assert.equal(lecture.year, '2026');
  assert.equal(lecture.topic, audienceTopic);
  assert.equal(lecture.category, audienceTopic);
  assert.equal(lecture.highlight, true);
  assert.deepEqual(lecture.images, ['uploads/11e803f03cdf.png']);
  const scriptData = fs.readFileSync(path.join(root, 'data_v3.js'), 'utf8').split('const profileData = ')[1];
  const jsonData = fs.readFileSync(path.join(root, 'data_v3.json'), 'utf8');
  assert.equal(scriptData.replace(/\r\n/g, '\n').replace(/;\s*$/, '\n'), jsonData.replace(/\r\n/g, '\n'));
});

test('a stale Sunam draft changes only its legacy classification without writing stored bytes', () => {
  const candidate = preAudienceCorrectionDraft();
  const item = sunam(candidate);
  Object.assign(item, {
    title: '보존할 로컬 제목', org: '보존할 기관', year: '2027',
    link: 'https://example.com/local', images: ['uploads/custom-slide.png'],
    image: 'uploads/custom-slide.png', visible: false, highlight: false,
  });
  candidate.personal.statement = '보존할 선언문';
  candidate.lectures.unshift({ ...item, id: 'local-sunam-copy', title: '별도로 추가한 강의' });
  const serialized = JSON.stringify(candidate);
  const expected = structuredClone(candidate);
  Object.assign(sunam(expected), { topic: audienceTopic, category: audienceTopic });
  expected.contentMigrationIds.push(sunamMigrationId);
  const { store, storage } = start(published, new Map([['profileDraft.contentV1', serialized]]));
  assert.deepEqual(plain(store.state), plain(expected));
  assert.equal(storage.get('profileDraft.contentV1'), serialized);
  assert.deepEqual(plain(store.merge(published, candidate).lectures), plain(expected.lectures));
});

test('audience correction preserves a custom topic and independently preserves custom category metadata', () => {
  for (const classification of [
    { topic: 'AI', category: '로컬 분류' },
    { topic: 'Canva·에듀테크', category: 'Google/Gemini' },
    { topic: 'Google', category: '보존할 상세 분류' },
    { topic: audienceTopic, category: '보존할 상세 분류' },
  ]) {
    const candidate = preAudienceCorrectionDraft();
    Object.assign(sunam(candidate), classification);
    const { store } = start(published, new Map([['profileDraft.contentV1', JSON.stringify(candidate)]]));
    const corrected = sunam(store.state);
    assert.equal(corrected.topic, classification.topic === 'Google' ? audienceTopic : classification.topic);
    assert.equal(corrected.category, classification.category);
    assert.equal(store.state.contentMigrationIds.filter((id) => id === sunamMigrationId).length, 1);
  }
});

test('an already audience-classified stale record receives only its remaining legacy metadata correction', () => {
  const candidate = preAudienceCorrectionDraft();
  sunam(candidate).topic = audienceTopic;
  const { data } = start(published, new Map([['profileDraft.contentV1', JSON.stringify(candidate)]]));
  assert.equal(sunam(data).topic, audienceTopic);
  assert.equal(sunam(data).category, audienceTopic);
});

test('later explicit Sunam classification saves remain intact through reload and merge', () => {
  const first = start(published, new Map([['profileDraft.contentV1', JSON.stringify(preAudienceCorrectionDraft())]]));
  const corrected = first.store.save(first.store.state);
  assert.equal(sunam(corrected).topic, audienceTopic);
  const edited = structuredClone(corrected);
  Object.assign(sunam(edited), { topic: 'Google', category: 'Google/Gemini', title: '이후 명시적 수정' });
  first.store.save(edited);
  const reloaded = start(published, first.storage);
  assert.deepEqual(plain(sunam(reloaded.data)), plain(sunam(edited)));
  assert.deepEqual(plain(sunam(reloaded.store.merge(published, reloaded.store.state))), plain(sunam(edited)));
  assert.equal(reloaded.store.state.contentMigrationIds.filter((id) => id === sunamMigrationId).length, 1);
});

test('Sunam removals before or after migration remain removed across explicit saves', () => {
  const before = preAudienceCorrectionDraft();
  before.lectures = before.lectures.filter((item) => item.id !== sunamLectureId);
  const first = start(published, new Map([['profileDraft.contentV1', JSON.stringify(before)]]));
  assert.equal(sunam(first.data), undefined);
  first.store.save(first.store.state);
  assert.equal(sunam(start(published, first.storage).data), undefined);

  const second = start(published, new Map([['profileDraft.contentV1', JSON.stringify(preAudienceCorrectionDraft())]]));
  const corrected = second.store.save(second.store.state);
  corrected.lectures = corrected.lectures.filter((item) => item.id !== sunamLectureId);
  second.store.save(corrected);
  assert.equal(sunam(start(published, second.storage).data), undefined);
});

test('audience correction waits for matching published data instead of changing legacy or later source choices', () => {
  for (const classification of [
    { topic: 'Google', category: 'Google/Gemini' },
    { topic: 'AI', category: 'AI' },
    { topic: audienceTopic, category: '로컬 분류' },
  ]) {
    const source = structuredClone(published);
    Object.assign(sunam(source), classification);
    const candidate = preAudienceCorrectionDraft();
    const { store } = start(source, new Map([['profileDraft.contentV1', JSON.stringify(candidate)]]));
    assert.equal(sunam(store.state).topic, 'Google');
    assert.equal(sunam(store.state).category, 'Google/Gemini');
    assert.ok(!store.state.contentMigrationIds.includes(sunamMigrationId));
  }
});

test('audience correction coexists with the Live relocation and image migrations', () => {
  const candidate = preCorrectionDraft();
  Object.assign(sunam(candidate), { topic: 'Google', category: 'Google/Gemini' });
  const { data, store } = start(published, new Map([['profileDraft.contentV1', JSON.stringify(candidate)]]));
  assert.equal(data.lectures.length, 69);
  assert.equal(sunam(data).topic, audienceTopic);
  assert.equal(sunam(data).category, audienceTopic);
  assert.ok(!data.lectures.some((item) => item.id === 'lectures_20261013_gemini_notebook_live_1'));
  assert.equal(data.youtubeVideos.filter((item) => item.id === 'youtubeVideos_20261013_gemini_notebook_live_1').length, 1);
  data.lectures.filter((item) => ['lectures_20261007_canva_korea', 'lectures_20260930_cheongsu_ai_design', 'lectures_20260929_panam_chromebook'].includes(item.id)).forEach((item) => assert.deepEqual(item.images, published.lectures.find((source) => source.id === item.id).images));
  assert.ok(store.state.contentMigrationIds.includes('2026-10-live-and-lecture-images'));
  assert.ok(store.state.contentMigrationIds.includes(sunamMigrationId));
});
