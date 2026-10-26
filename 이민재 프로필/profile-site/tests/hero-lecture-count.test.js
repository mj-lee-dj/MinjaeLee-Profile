const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const published = JSON.parse(read('data_v3.json'));
const key = 'profileDraft.contentV1';
const migrationId = '2026-10-hero-lecture-count';
const plain = (value) => JSON.parse(JSON.stringify(value));

function start(data = published, storage = new Map()) {
  const events = [];
  const context = {
    profileData: structuredClone(data), structuredClone, console,
    CustomEvent: class CustomEvent {
      constructor(type, options) { this.type = type; this.detail = options.detail; }
    },
    localStorage: {
      getItem: (name) => storage.get(name) || '',
      setItem: (name, value) => storage.set(name, value),
      removeItem: (name) => storage.delete(name),
    },
    window: { dispatchEvent: (event) => events.push(event) },
  };
  vm.runInNewContext(read('draft-content-store.js'), context);
  return { data: context.profileData, store: context.window.ProfileContentStore, storage, events };
}

function staleDraft() {
  const candidate = plain(start().store.state);
  candidate.personal.lectureCount = '150+';
  candidate.contentMigrationIds = candidate.contentMigrationIds.filter((id) => id !== migrationId);
  return candidate;
}

// Run the real renderer against the same minimal in-memory DOM used by the
// existing profile tests. No browser, service, or stored user draft is touched.
function render(data) {
  const nodes = new Map();
  let initialize;
  const getNode = (id) => {
    if (!nodes.has(id)) {
      const attributes = {};
      nodes.set(id, {
        innerHTML: '', textContent: '',
        setAttribute(name, value) { attributes[name] = String(value); },
        getAttribute(name) { return attributes[name] ?? null; },
        removeAttribute(name) { delete attributes[name]; },
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener() {}, querySelectorAll() { return []; },
      });
    }
    return nodes.get(id);
  };
  const context = {
    profileData: structuredClone(data), console,
    document: {
      getElementById: getNode, querySelectorAll() { return []; },
      addEventListener(type, callback) { if (type === 'DOMContentLoaded') initialize = callback; },
    },
    window: { addEventListener() {}, scrollY: 0 },
    IntersectionObserver: class IntersectionObserver { observe() {} unobserve() {} },
    requestAnimationFrame: (callback) => callback(),
    location: { reload() {} },
  };
  vm.runInNewContext(read('draft-v2.js'), context);
  assert.equal(typeof initialize, 'function');
  const before = JSON.stringify(context.profileData);
  initialize();
  assert.equal(JSON.stringify(context.profileData), before, 'rendering does not rewrite content');
  return nodes;
}

test('both published feeds contain the approved 100+ hero count and identical profile data', () => {
  const context = vm.createContext({});
  vm.runInContext(read('data_v3.js'), context);
  const javascriptData = plain(vm.runInContext('profileData', context));
  assert.equal(published.personal.lectureCount, '100+');
  assert.equal(javascriptData.personal.lectureCount, '100+');
  assert.deepEqual(javascriptData, published);
  assert.equal(published.publications.length, 4);
  assert.equal(published.onlineCourses.length, 3);
  assert.equal(published.lectures.length, 69, 'the aggregate label does not add or remove archive records');
});

for (const filename of ['index.html', 'draft-v2.html']) {
  test(`${filename} uses 100+ as its hero fallback and keeps the other stat labels`, () => {
    const html = read(filename);
    assert.match(html, /<dt>강의·연수<\/dt>\s*<dd\b[^>]*\bid="lectureCount"[^>]*>100\+<\/dd>/);
    assert.match(html, /<dt>저서<\/dt>\s*<dd\b[^>]*\bid="bookCount"[^>]*>4권<\/dd>/);
    assert.match(html, /<dt>온라인 연수<\/dt>\s*<dd\b[^>]*\bid="courseCount"[^>]*>3과정<\/dd>/);
  });
}

test('renderer uses 100+ for missing counts while honoring supplied counts and retaining book/course totals', () => {
  for (const count of [undefined, '', '100+', '125+', '150+', '0']) {
    const data = structuredClone(published);
    if (count === undefined) delete data.personal.lectureCount;
    else data.personal.lectureCount = count;
    const nodes = render(data);
    assert.equal(nodes.get('lectureCount').textContent, count || '100+');
    assert.equal(nodes.get('bookCount').textContent, '4권');
    assert.equal(nodes.get('courseCount').textContent, '3과정');
  }
});

test('clean draft defaults follow the published count and fall back to 100+ without writing storage', () => {
  for (const count of ['100+', '125+', '150+', undefined, '']) {
    const source = structuredClone(published);
    if (count === undefined) delete source.personal.lectureCount;
    else source.personal.lectureCount = count;
    const { data, store, storage, events } = start(source);
    assert.equal(store.state.personal.lectureCount, count || '100+');
    assert.equal(data.personal.lectureCount, count || '100+');
    assert.equal(storage.size, 0);
    assert.equal(events.length, 0);
  }
});

test('stale 150+ draft migrates only the count and marker, preserving all other fields and collections', () => {
  const candidate = staleDraft();
  Object.assign(candidate.personal, {
    name: '보존할 이름', nameEn: 'Preserved Name', statement: '보존할 소개문',
    email: 'local@example.test', instagram: 'https://example.test/local',
    photo: 'uploads/local-profile.png',
  });
  candidate.photoDirty = true;
  for (const section of start().store.collectionKeys) {
    candidate[section].reverse();
    if (candidate[section][0]) {
      candidate[section][0].title = `보존할 ${section} 수정`;
      candidate[section][0].visible = false;
    }
  }
  candidate.lectures = candidate.lectures.slice(1);
  candidate.contentMigrationIds.push('preserve-custom-migration');
  const expected = structuredClone(candidate);
  expected.personal.lectureCount = '100+';
  expected.contentMigrationIds.push(migrationId);
  const serialized = JSON.stringify(candidate);
  const { data, store, storage, events } = start(published, new Map([[key, serialized]]));
  assert.deepEqual(plain(store.state), expected);
  assert.equal(data.personal.lectureCount, '100+');
  assert.equal(data.personal.statement, candidate.personal.statement);
  assert.equal(data.personal.draftPhoto, candidate.personal.photo);
  for (const section of store.collectionKeys) assert.deepEqual(plain(data[section]), candidate[section], section);
  assert.equal(storage.get(key), serialized, 'migration is read-only until the user explicitly saves');
  assert.equal(events.length, 0);
});

test('custom draft counts survive the one-time correction', () => {
  for (const count of ['100+', '99+', '125+', '200+', '0', '150', '150+회']) {
    const candidate = staleDraft();
    candidate.personal.lectureCount = count;
    const serialized = JSON.stringify(candidate);
    const { data, store, storage } = start(published, new Map([[key, serialized]]));
    assert.equal(store.state.personal.lectureCount, count);
    assert.equal(data.personal.lectureCount, count);
    assert.equal(storage.get(key), serialized);
  }
});

test('the correction is gated to published 100+ and leaves other published counts alone', () => {
  for (const count of ['150+', '125+', undefined, '']) {
    const source = structuredClone(published);
    if (count === undefined) delete source.personal.lectureCount;
    else source.personal.lectureCount = count;
    const candidate = staleDraft();
    const { store } = start(source, new Map([[key, JSON.stringify(candidate)]]));
    assert.equal(store.state.personal.lectureCount, '150+');
    assert.ok(!store.state.contentMigrationIds.includes(migrationId));
  }
});

test('an already marked 150+ choice is preserved rather than corrected again', () => {
  const candidate = staleDraft();
  candidate.contentMigrationIds.push(migrationId);
  const serialized = JSON.stringify(candidate);
  const { store, storage } = start(published, new Map([[key, serialized]]));
  assert.deepEqual(plain(store.state), candidate);
  assert.equal(store.merge(published, candidate).personal.lectureCount, '150+');
  assert.equal(storage.get(key), serialized);
});

test('explicit saving persists the marker and later choosing 150+ survives save, reload, and publish merge', () => {
  const first = start(published, new Map([[key, JSON.stringify(staleDraft())]]));
  const corrected = first.store.save(first.store.state);
  assert.equal(corrected.personal.lectureCount, '100+');
  assert.equal(corrected.contentMigrationIds.filter((id) => id === migrationId).length, 1);
  const later = plain(corrected);
  later.personal.lectureCount = '150+';
  later.personal.statement = '이후 직접 저장한 소개문';
  first.store.save(later);
  const reloaded = start(published, first.storage);
  assert.deepEqual(plain(reloaded.store.state), later);
  const merged = reloaded.store.merge(published, reloaded.store.state);
  assert.equal(merged.personal.lectureCount, '150+');
  assert.equal(merged.personal.statement, later.personal.statement);
  assert.ok(!Object.hasOwn(merged, 'contentMigrationIds'), 'migration metadata stays local');
  assert.ok(!Object.hasOwn(merged.personal, 'contentMigrationIds'));
});

test('malformed or absent migration metadata still permits the targeted correction', () => {
  for (const metadata of [undefined, null, 7, { invalid: true }, [null, 7, 'preserve-valid-marker']]) {
    const candidate = staleDraft();
    if (metadata === undefined) delete candidate.contentMigrationIds;
    else candidate.contentMigrationIds = metadata;
    const { store } = start(published, new Map([[key, JSON.stringify(candidate)]]));
    assert.equal(store.state.personal.lectureCount, '100+');
    assert.equal(store.state.contentMigrationIds.filter((id) => id === migrationId).length, 1);
    assert.ok(store.state.contentMigrationIds.every((id) => typeof id === 'string'));
    if (Array.isArray(metadata)) assert.ok(store.state.contentMigrationIds.includes('preserve-valid-marker'));
  }
});
