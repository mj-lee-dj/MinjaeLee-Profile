const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');

const handler = require('../api/_handler.js');

function request({ method = 'GET', action = 'session', headers = {}, body } = {}) {
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
    end(raw) { this.raw = raw; this.body = JSON.parse(raw); },
  };
}

function configure() {
  process.env.ADMIN_PASSWORD = 'correct horse battery staple';
  process.env.ADMIN_SESSION_SECRET = 'a-test-session-secret-with-sufficient-entropy';
  process.env.GITHUB_ADMIN_TOKEN = 'test-token-not-used-by-these-tests';
}

test('API fails closed when required server configuration is missing', async () => {
  const previous = {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    GITHUB_ADMIN_TOKEN: process.env.GITHUB_ADMIN_TOKEN,
  };
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_SESSION_SECRET;
  delete process.env.GITHUB_ADMIN_TOKEN;
  const res = response();
  await handler(request({ headers: { host: 'example.test', referer: 'https://example.test/admin.html' } }), res);
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body.missing.sort(), ['ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET', 'GITHUB_ADMIN_TOKEN']);
  Object.assign(process.env, previous);
});

test('cross-origin login requests are rejected', async () => {
  configure();
  const res = response();
  await handler(request({
    method: 'POST',
    action: 'login',
    headers: { host: 'example.test', origin: 'https://attacker.test' },
    body: { password: process.env.ADMIN_PASSWORD },
  }), res);
  assert.equal(res.statusCode, 403);
});

test('valid login creates an HttpOnly strict cookie and a usable session', async () => {
  configure();
  const loginRes = response();
  await handler(request({
    method: 'POST',
    action: 'login',
    headers: { host: 'example.test', origin: 'https://example.test' },
    body: { password: process.env.ADMIN_PASSWORD },
  }), loginRes);
  assert.equal(loginRes.statusCode, 200);
  assert.ok(loginRes.body.csrf);
  assert.match(loginRes.headers['set-cookie'], /HttpOnly/);
  assert.match(loginRes.headers['set-cookie'], /SameSite=Strict/);
  assert.match(loginRes.headers['set-cookie'], /Secure/);

  const cookie = loginRes.headers['set-cookie'].split(';')[0];
  const sessionRes = response();
  await handler(request({
    method: 'GET',
    action: 'session',
    headers: { host: 'example.test', referer: 'https://example.test/admin.html', cookie },
  }), sessionRes);
  assert.equal(sessionRes.statusCode, 200);
  assert.equal(sessionRes.body.csrf, loginRes.body.csrf);
});

test('wrong password is rejected without a cookie', async () => {
  configure();
  const res = response();
  await handler(request({
    method: 'POST',
    action: 'login',
    headers: { host: 'example.test', origin: 'https://example.test' },
    body: { password: 'wrong' },
  }), res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.headers['set-cookie'], undefined);
});
