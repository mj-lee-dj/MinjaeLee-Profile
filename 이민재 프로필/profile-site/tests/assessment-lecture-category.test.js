const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const published = JSON.parse(read('data_v3.json'));
const key = 'profileDraft.contentV1';
const migrationId = '2026-10-assessment-lecture-topic';
const lectureId = 'l_mqcu97usa7rhx';
const previousTopic = '학부모·학생 강의';
const nextTopic = '교사 업무·학급경영';
const plain = (value) => JSON.parse(JSON.stringify(value));
const target = (data) => data.lectures.find((item) => item.id === lectureId);
const gallery = [
  'uploads/b28b860e7bdc.png',
  'uploads/d9c0a15b2216.png',
  'uploads/54038890db47.png',
  'uploads/7c1c24b3cc83.png',
  'uploads/7a6e63d24a77.png',
  'uploads/8bfb40faa7a3.png',
  'uploads/b7406d995fed.png',
];

// Exercise the real store using only isolated in-memory storage.
function start(data = published, storage = new Map()) {
  const events = [];
  const writes = [];
  const context = {
    profileData: structuredClone(data), structuredClone, console,
    CustomEvent: class CustomEvent {
      constructor(type, options) { this.type = type; this.detail = options.detail; }
    },
    localStorage: {
      getItem: (name) => storage.get(name) || '',
      setItem: (name, value) => { writes.push(['set', name]); storage.set(name, value); },
      removeItem: (name) => { writes.push(['remove', name]); storage.delete(name); },
    },
    window: { dispatchEvent: (event) => events.push(event) },
  };
  vm.runInNewContext(read('draft-content-store.js'), context);
  return { data: context.profileData, store: context.window.ProfileContentStore, storage, events, writes };
}

function staleDraft() {
  const candidate = plain(start().store.state);
  target(candidate).topic = previousTopic;
  candidate.contentMigrationIds = candidate.contentMigrationIds.filter((id) => id !== migrationId);
  return candidate;
}

function archiveModel() {
  const context = { window: {}, document: { addEventListener() {} }, console };
  vm.runInNewContext(read('lecture-accordion.js'), context);
  return context.window.ProfileLectureArchiveModel;
}

test('both published feeds move only the assessment topic while retaining its complete seven-image record', () => {
  const context = vm.createContext({});
  vm.runInContext(read('data_v3.js'), context);
  const javascriptData = plain(vm.runInContext('profileData', context));
  assert.deepEqual(javascriptData, published);
  assert.equal(published.lectures.filter((item) => item.id === lectureId).length, 1);
  assert.deepEqual(target(published), {
    id: lectureId,
    visible: true,
    title: '디지털 협업 도구를 활용한 학생 평가 - 구글 도구를 중심으로',
    org: '대전교육연수원',
    year: '2026',
    category: 'Google/Gemini',
    topic: nextTopic,
    link: '',
    images: gallery,
    image: gallery[0],
    highlight: true,
  });
});

test('published archive counts are 14 teacher, 3 parent/student and 64 total without duplicating the target', () => {
  const archive = archiveModel();
  const topics = ['AI', 'Google', 'Canva·에듀테크', nextTopic, previousTopic, '강사코칭'];
  assert.equal(published.lectures.length, 64);
  assert.deepEqual(topics.map((topic) => archive.categoryPage(published, topic, 0, 100, []).total), [13, 18, 10, 14, 3, 6]);
  assert.equal(archive.summary(published, []).total, 64);
  const teacherPage = archive.categoryPage(published, nextTopic, 0, 100, []);
  const parentPage = archive.categoryPage(published, previousTopic, 0, 100, []);
  assert.equal(teacherPage.items.filter((item) => item.id === lectureId).length, 1);
  assert.ok(!parentPage.items.some((item) => item.id === lectureId));
  assert.deepEqual(plain(teacherPage.items.find((item) => item.id === lectureId).images), gallery);
});

test('clean defaults adopt the corrected topic and mark it without writing storage or emitting save events', () => {
  const { data, store, storage, events, writes } = start();
  assert.equal(target(store.state).topic, nextTopic);
  assert.equal(target(data).topic, nextTopic);
  assert.equal(target(store.state).category, 'Google/Gemini');
  assert.deepEqual(plain(target(store.state).images), gallery);
  assert.equal(store.state.contentMigrationIds.filter((id) => id === migrationId).length, 1);
  assert.equal(storage.size, 0);
  assert.deepEqual(writes, []);
  assert.deepEqual(events, []);
});

test('stale drafts change only the target topic and marker, preserving local edits, all collections and record order', () => {
  const candidate = staleDraft();
  Object.assign(candidate.personal, {
    name: '보존할 이름', nameEn: 'Preserved Name', statement: '보존할 소개문',
    email: 'local@example.test', instagram: 'https://example.test/local',
    photo: 'uploads/local-profile.png',
  });
  candidate.photoDirty = true;
  for (const section of start().store.collectionKeys) {
    candidate[section].reverse();
    if (candidate[section][0] && candidate[section][0].id !== lectureId) {
      candidate[section][0].title = `보존할 ${section} 수정`;
      candidate[section][0].visible = false;
    }
  }
  Object.assign(target(candidate), {
    title: '직접 수정한 학생 평가 제목', org: '직접 수정한 기관', year: '2025',
    category: '직접 수정한 원래 분류', link: 'https://example.test/assessment',
    images: ['uploads/local-first.png', ...gallery.slice().reverse()],
    image: 'uploads/local-first.png', visible: false, highlight: false,
  });
  candidate.contentMigrationIds.push('preserve-custom-migration');
  const expected = structuredClone(candidate);
  target(expected).topic = nextTopic;
  expected.contentMigrationIds.push(migrationId);
  const serialized = JSON.stringify(candidate);
  const { data, store, storage, events, writes } = start(published, new Map([[key, serialized]]));
  assert.deepEqual(plain(store.state), expected);
  for (const section of store.collectionKeys) assert.deepEqual(plain(data[section]), expected[section], section);
  assert.equal(data.personal.statement, candidate.personal.statement);
  assert.equal(data.personal.draftPhoto, candidate.personal.photo);
  assert.equal(storage.get(key), serialized);
  assert.deepEqual(writes, []);
  assert.deepEqual(events, []);
});

test('the exact old topic is corrected even when the draft retains the seven original images and legacy category', () => {
  const candidate = staleDraft();
  const serialized = JSON.stringify(candidate);
  const { data, store, storage, writes } = start(published, new Map([[key, serialized]]));
  assert.equal(target(store.state).topic, nextTopic);
  assert.equal(target(data).category, 'Google/Gemini');
  assert.deepEqual(plain(target(data).images), gallery);
  assert.equal(target(data).image, gallery[0]);
  assert.equal(storage.get(key), serialized);
  assert.deepEqual(writes, []);
});

test('all other explicit topic choices survive the one-time migration unchanged', () => {
  for (const topic of ['AI', 'Google', 'Canva·에듀테크', nextTopic, '강사코칭']) {
    const candidate = staleDraft();
    target(candidate).topic = topic;
    const expected = structuredClone(candidate);
    expected.contentMigrationIds.push(migrationId);
    const serialized = JSON.stringify(candidate);
    const { store, storage, writes } = start(published, new Map([[key, serialized]]));
    assert.deepEqual(plain(store.state), expected, topic);
    assert.equal(storage.get(key), serialized);
    assert.deepEqual(writes, []);
  }
});

test('a deleted target is not restored by load, normalization or publish merge', () => {
  const candidate = staleDraft();
  candidate.lectures = candidate.lectures.filter((item) => item.id !== lectureId);
  const expected = structuredClone(candidate);
  expected.contentMigrationIds.push(migrationId);
  const serialized = JSON.stringify(candidate);
  const { data, store, storage, writes } = start(published, new Map([[key, serialized]]));
  assert.deepEqual(plain(store.state), expected);
  assert.equal(data.lectures.length, 63);
  assert.equal(target(data), undefined);
  assert.equal(target(store.normalize(store.state)), undefined);
  assert.equal(target(store.merge(published, store.state)), undefined);
  assert.equal(storage.get(key), serialized);
  assert.deepEqual(writes, []);
});

test('the migration is gated to the corrected source target and leaves the old topic alone otherwise', () => {
  for (const sourceTopic of [previousTopic, 'Google', undefined, null]) {
    const source = structuredClone(published);
    if (sourceTopic === undefined) delete target(source).topic;
    else if (sourceTopic === null) source.lectures = source.lectures.filter((item) => item.id !== lectureId);
    else target(source).topic = sourceTopic;
    const candidate = staleDraft();
    const serialized = JSON.stringify(candidate);
    const { store, storage, writes } = start(source, new Map([[key, serialized]]));
    assert.equal(target(store.state).topic, previousTopic);
    assert.ok(!store.state.contentMigrationIds.includes(migrationId));
    assert.equal(storage.get(key), serialized);
    assert.deepEqual(writes, []);
  }
});

test('repeated normalization, loading and merging are idempotent and do not leak the local marker', () => {
  const serialized = JSON.stringify(staleDraft());
  const { store, storage, events, writes } = start(published, new Map([[key, serialized]]));
  const expected = plain(store.state);
  for (let repeat = 0; repeat < 3; repeat += 1) {
    assert.deepEqual(plain(store.normalize(expected)), expected);
    assert.deepEqual(plain(store.load()), expected);
    const merged = store.merge(published, expected);
    assert.equal(target(merged).topic, nextTopic);
    assert.equal(target(merged).category, 'Google/Gemini');
    assert.ok(!Object.hasOwn(merged, 'contentMigrationIds'));
    assert.ok(!Object.hasOwn(target(merged), 'contentMigrationIds'));
  }
  assert.equal(expected.contentMigrationIds.filter((id) => id === migrationId).length, 1);
  assert.equal(storage.get(key), serialized);
  assert.deepEqual(writes, []);
  assert.deepEqual(events, []);
});

test('an already marked old-topic choice is preserved on load and publish merge', () => {
  const candidate = staleDraft();
  candidate.contentMigrationIds.push(migrationId);
  const serialized = JSON.stringify(candidate);
  const { data, store, storage, writes } = start(published, new Map([[key, serialized]]));
  assert.deepEqual(plain(store.state), candidate);
  assert.equal(target(data).topic, previousTopic);
  assert.equal(target(store.merge(published, candidate)).topic, previousTopic);
  assert.equal(storage.get(key), serialized);
  assert.deepEqual(writes, []);
});

test('explicit saving persists the marker so a later return to the old topic survives save and reload', () => {
  const first = start(published, new Map([[key, JSON.stringify(staleDraft())]]));
  const corrected = first.store.save(first.store.state);
  assert.equal(target(corrected).topic, nextTopic);
  assert.equal(corrected.contentMigrationIds.filter((id) => id === migrationId).length, 1);
  const later = plain(corrected);
  target(later).topic = previousTopic;
  target(later).title = '이후 직접 저장한 평가 강의 제목';
  first.store.save(later);
  const reloaded = start(published, first.storage);
  assert.deepEqual(plain(reloaded.store.state), later);
  assert.equal(target(reloaded.store.merge(published, later)).topic, previousTopic);
  assert.equal(target(reloaded.data).category, 'Google/Gemini');
  assert.deepEqual(reloaded.writes, []);
  assert.deepEqual(reloaded.events, []);
});

test('missing or malformed migration metadata permits the correction while retaining valid markers', () => {
  for (const metadata of [undefined, null, 7, { invalid: true }, [null, 7, 'preserve-valid-marker']]) {
    const candidate = staleDraft();
    if (metadata === undefined) delete candidate.contentMigrationIds;
    else candidate.contentMigrationIds = metadata;
    const serialized = JSON.stringify(candidate);
    const { store, storage, writes } = start(published, new Map([[key, serialized]]));
    assert.equal(target(store.state).topic, nextTopic);
    assert.equal(target(store.state).category, 'Google/Gemini');
    assert.equal(store.state.contentMigrationIds.filter((id) => id === migrationId).length, 1);
    assert.ok(store.state.contentMigrationIds.every((id) => typeof id === 'string'));
    if (Array.isArray(metadata)) assert.ok(store.state.contentMigrationIds.includes('preserve-valid-marker'));
    assert.equal(storage.get(key), serialized);
    assert.deepEqual(writes, []);
  }
});
