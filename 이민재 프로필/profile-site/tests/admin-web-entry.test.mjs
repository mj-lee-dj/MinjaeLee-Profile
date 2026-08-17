import test from 'node:test';
import assert from 'node:assert/strict';
import admin from '../api/admin.mjs';

test('Web entry returns a secure login cookie through the Vercel fetch contract', async () => {
  process.env.ADMIN_PASSWORD = 'test-password';
  process.env.ADMIN_SESSION_SECRET = 'test-session-secret-with-sufficient-entropy';
  process.env.GITHUB_ADMIN_TOKEN = 'test-token';

  const request = new Request('https://example.test/api/admin?action=login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Host: 'example.test',
      Origin: 'https://example.test',
    },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
  });
  const response = await admin.fetch(request);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(body.csrf);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/);
  assert.match(response.headers.get('set-cookie'), /SameSite=Strict/);
});
