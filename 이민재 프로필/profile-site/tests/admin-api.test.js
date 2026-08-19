const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { deletionSummary, makeSession, validateData, verifySession } = require('../api/_core.js');
const currentData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data_v3.json'), 'utf8'));

test('current production data passes the admin schema gate', () => {
  assert.deepEqual(validateData(currentData), []);
});

test('duplicate ids are rejected before a commit can be created', () => {
  const invalid = structuredClone(currentData);
  invalid.lectures[1].id = invalid.lectures[0].id;
  assert.match(validateData(invalid).join('\n'), /\uc911\ubcf5 id/);
});

test('missing required collections are rejected', () => {
  const invalid = structuredClone(currentData);
  delete invalid.press;
  assert.match(validateData(invalid).join('\n'), /press/);
});

test('deletions are summarized for explicit confirmation', () => {
  const changed = structuredClone(currentData);
  changed.press.pop();
  assert.deepEqual(deletionSummary(currentData, changed), [
    { key: 'press', before: currentData.press.length, after: changed.press.length },
  ]);
});

test('optional featured proofs reject duplicate ids and participate in delete confirmation', () => {
  const before = structuredClone(currentData);
  before.featuredProofs = [
    { id: 'proof-1', title: '첫 번째 증거' },
    { id: 'proof-2', title: '두 번째 증거' },
  ];
  const invalid = structuredClone(before);
  invalid.featuredProofs[1].id = 'proof-1';
  assert.match(validateData(invalid).join(' | '), /featuredProofs.*중복 id/);

  const after = structuredClone(before);
  after.featuredProofs.pop();
  assert.deepEqual(deletionSummary(before, after), [
    { key: 'featuredProofs', before: 2, after: 1 },
  ]);
});

test('lecture curation accepts valid ids and rejects malformed payloads', () => {
  const valid = structuredClone(currentData);
  valid.lectureCuration = {
    label: 'TITLE',
    highlights: valid.lectures.slice(0, 5).map((lecture) => lecture.id),
    hidden: [],
  };
  assert.deepEqual(validateData(valid), []);

  const invalid = structuredClone(valid);
  invalid.lectureCuration.highlights = ['missing-lecture'];
  assert.match(validateData(invalid).join(' | '), /lectureCuration/);
});

test('embedded clipboard images must be uploaded before the save boundary', () => {
  const invalid = structuredClone(currentData);
  invalid.onlineCourses[0].images = ['data:image/png;base64,iVBORw0KGgo='];
  assert.match(validateData(invalid).join(' | '), /이미지 업로드/);
});

test('signed session accepts the original cookie and rejects tampering', () => {
  const secret = 'test-session-secret-that-is-long-enough';
  const token = makeSession(secret);
  const req = { headers: { cookie: `__Host-profile_admin=${encodeURIComponent(token)}` } };
  assert.ok(verifySession(req, secret)?.csrf);

  const tampered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;
  const badReq = { headers: { cookie: `__Host-profile_admin=${encodeURIComponent(tampered)}` } };
  assert.equal(verifySession(badReq, secret), null);
});
