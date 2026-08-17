const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');

const handler = require('../api/admin.js');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data_v3.json'), 'utf8'));
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function request({ method = 'GET', action, headers = {}, body }) {
  const req = Readable.from(body === undefined ? [] : [JSON.stringify(body)]);
  req.method = method;
  req.query = { action };
  req.headers = headers;
  return req;
}

function response() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(raw) { this.body = JSON.parse(raw); },
  };
}

function githubResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('save creates one atomic commit at the deployed source paths', async () => {
  process.env.ADMIN_PASSWORD = 'test-password';
  process.env.ADMIN_SESSION_SECRET = 'test-session-secret-with-sufficient-entropy';
  process.env.GITHUB_ADMIN_TOKEN = 'test-token';

  const loginRes = response();
  await handler(request({
    method: 'POST',
    action: 'login',
    headers: { host: 'example.test', origin: 'https://example.test' },
    body: { password: process.env.ADMIN_PASSWORD },
  }), loginRes);
  assert.equal(loginRes.statusCode, 200);
  const cookie = loginRes.headers['set-cookie'].split(';')[0];

  const captured = {};
  const realFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    const parsed = new URL(url);
    const apiPath = decodeURIComponent(parsed.pathname.replace('/repos/mj-lee-dj/MinjaeLee-Profile', ''));
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;

    if (method === 'GET' && apiPath === '/git/ref/heads/main') return githubResponse({ object: { sha: 'a'.repeat(40) } });
    if (method === 'GET' && apiPath.endsWith('/data_v3.json')) {
      return githubResponse({ content: Buffer.from(JSON.stringify(data)).toString('base64') });
    }
    if (method === 'GET' && apiPath === `/git/commits/${'a'.repeat(40)}`) return githubResponse({ tree: { sha: 'b'.repeat(40) } });
    if (method === 'GET' && apiPath.endsWith('/index.html')) {
      return githubResponse({ content: Buffer.from(indexHtml).toString('base64') });
    }
    if (method === 'POST' && apiPath === '/git/blobs') {
      if (body.content.startsWith('/*')) {
        captured.js = body.content;
        return githubResponse({ sha: '1'.repeat(40) });
      }
      if (body.content.startsWith('{')) {
        captured.json = body.content;
        return githubResponse({ sha: '2'.repeat(40) });
      }
      captured.index = body.content;
      return githubResponse({ sha: '3'.repeat(40) });
    }
    if (method === 'POST' && apiPath === '/git/trees') {
      captured.tree = body;
      return githubResponse({ sha: 'c'.repeat(40) });
    }
    if (method === 'POST' && apiPath === '/git/commits') {
      captured.commit = body;
      return githubResponse({ sha: 'd'.repeat(40) });
    }
    if (method === 'PATCH' && apiPath === '/git/refs/heads/main') {
      captured.ref = body;
      return githubResponse({ object: { sha: body.sha } });
    }
    throw new Error(`Unexpected GitHub request: ${method} ${apiPath}`);
  };

  try {
    const saveRes = response();
    await handler(request({
      method: 'POST',
      action: 'save',
      headers: {
        host: 'example.test',
        origin: 'https://example.test',
        cookie,
        'x-admin-csrf': loginRes.body.csrf,
      },
      body: {
        data,
        baseCommitSha: 'a'.repeat(40),
        confirmDeletes: false,
        imageEntries: [],
      },
    }), saveRes);
    assert.equal(saveRes.statusCode, 200);
    assert.equal(saveRes.body.commitSha, 'd'.repeat(40));

    const treePaths = captured.tree.tree.map((entry) => entry.path);
    assert.deepEqual(treePaths, [
      '\uc774\ubbfc\uc7ac \ud504\ub85c\ud544/profile-site/data_v3.js',
      '\uc774\ubbfc\uc7ac \ud504\ub85c\ud544/profile-site/data_v3.json',
      '\uc774\ubbfc\uc7ac \ud504\ub85c\ud544/profile-site/index.html',
    ]);
    assert.match(captured.js, /const profileData =/);
    assert.deepEqual(JSON.parse(captured.json), data);
    assert.match(captured.index, /data_v3\.js\?v=\d+/);
    assert.deepEqual(captured.commit.parents, ['a'.repeat(40)]);
    assert.deepEqual(captured.ref, { sha: 'd'.repeat(40), force: false });
  } finally {
    global.fetch = realFetch;
  }
});
