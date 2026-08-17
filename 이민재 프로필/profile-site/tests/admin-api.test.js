const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { deletionSummary, makeSession, validateData, verifySession } = require('../api/admin.js')._test;
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

test('signed session accepts the original cookie and rejects tampering', () => {
  const secret = 'test-session-secret-that-is-long-enough';
  const token = makeSession(secret);
  const req = { headers: { cookie: `__Host-profile_admin=${encodeURIComponent(token)}` } };
  assert.ok(verifySession(req, secret)?.csrf);

  const tampered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;
  const badReq = { headers: { cookie: `__Host-profile_admin=${encodeURIComponent(tampered)}` } };
  assert.equal(verifySession(badReq, secret), null);
});
