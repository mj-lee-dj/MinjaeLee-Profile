const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');

const handler = require('../api/_handler.js');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data_v3.json'), 'utf8'));
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'admin.html'), 'utf8');

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

test('save creates one webhook-compatible atomic commit at the deployed source paths', async () => {
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
    const body = options.body ? JSON.parse(options.body) : null;
    if (url === 'https://api.github.com/graphql') {
      captured.graphql = body;
      return githubResponse({
        data: { createCommitOnBranch: { commit: { oid: 'd'.repeat(40) } } },
      });
    }
    const parsed = new URL(url);
    const apiPath = decodeURIComponent(parsed.pathname.replace('/repos/mj-lee-dj/MinjaeLee-Profile', ''));
    const method = options.method || 'GET';
    if (method === 'GET' && apiPath === '/git/ref/heads/main') return githubResponse({ object: { sha: 'a'.repeat(40) } });
    if (method === 'GET' && apiPath.endsWith('/data_v3.json')) {
      return githubResponse({ content: Buffer.from(JSON.stringify(data)).toString('base64') });
    }
    if (method === 'GET' && apiPath.endsWith('/index.html')) {
      return githubResponse({ content: Buffer.from(indexHtml).toString('base64') });
    }
    if (method === 'GET' && apiPath === `/git/blobs/${'4'.repeat(40)}`) {
      return githubResponse({ content: Buffer.from('image-bytes').toString('base64') });
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
        imageEntries: [{
          repoPath: '\uc774\ubbfc\uc7ac \ud504\ub85c\ud544/profile-site/uploads/example.png',
          sha: '4'.repeat(40),
        }],
      },
    }), saveRes);
    assert.equal(saveRes.statusCode, 200);
    assert.equal(saveRes.body.commitSha, 'd'.repeat(40));
    assert.match(String(saveRes.body.cacheKey), /^\d+$/);

    const input = captured.graphql.variables.input;
    const additions = input.fileChanges.additions;
    assert.deepEqual(additions.map((entry) => entry.path), [
      '\uc774\ubbfc\uc7ac \ud504\ub85c\ud544/profile-site/uploads/example.png',
      '\uc774\ubbfc\uc7ac \ud504\ub85c\ud544/profile-site/data_v3.js',
      '\uc774\ubbfc\uc7ac \ud504\ub85c\ud544/profile-site/data_v3.json',
      '\uc774\ubbfc\uc7ac \ud504\ub85c\ud544/profile-site/index.html',
    ]);
    assert.equal(Buffer.from(additions[0].contents, 'base64').toString('utf8'), 'image-bytes');
    assert.match(Buffer.from(additions[1].contents, 'base64').toString('utf8'), /const profileData =/);
    assert.deepEqual(JSON.parse(Buffer.from(additions[2].contents, 'base64').toString('utf8')), data);
    assert.match(Buffer.from(additions[3].contents, 'base64').toString('utf8'), /data_v3\.js\?v=\d+/);
    assert.equal(input.expectedHeadOid, 'a'.repeat(40));
    assert.deepEqual(input.branch, {
      repositoryNameWithOwner: 'mj-lee-dj/MinjaeLee-Profile',
      branchName: 'main',
    });
    assert.match(captured.graphql.query, /createCommitOnBranch/);
  } finally {
    global.fetch = realFetch;
  }
});

test('admin completion check waits for the new deployed cache key', () => {
  assert.match(adminHtml, /indexHtml\.includes\(\`data_v3\.js\?v=\$\{cacheKey\}\`\)/);
  assert.match(adminHtml, /verifyProduction\(dataClone, result\.cacheKey\)/);
});
