const crypto = require('crypto');

const SESSION_COOKIE = '__Host-profile_admin';
const SESSION_TTL_SECONDS = 4 * 60 * 60;
const ARRAY_KEYS = [
  'youtubeVideos',
  'expertise',
  'publications',
  'onlineCourses',
  'lectures',
  'awards',
  'activities',
  'press',
];
const ID_KEYS = ARRAY_KEYS.filter((key) => key !== 'expertise');

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function makeSession(secret) {
  const payload = base64Url(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    csrf: crypto.randomBytes(24).toString('base64url'),
  }));
  return `${payload}.${sign(payload, secret)}`;
}

function verifySession(req, secret) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = sign(payload, secret);
  const givenBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (givenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(givenBuffer, expectedBuffer)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.exp > Math.floor(Date.now() / 1000) ? data : null;
  } catch {
    return null;
  }
}

function safeEqual(a, b) {
  const left = crypto.createHash('sha256').update(String(a)).digest();
  const right = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(left, right);
}

function validateData(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ['최상위 데이터는 객체여야 합니다.'];
  if (!data.personal || typeof data.personal !== 'object' || Array.isArray(data.personal)) errors.push('personal 데이터가 필요합니다.');
  for (const key of ARRAY_KEYS) {
    if (!Array.isArray(data[key])) errors.push(`${key}는 배열이어야 합니다.`);
  }
  for (const key of ID_KEYS) {
    if (!Array.isArray(data[key])) continue;
    const ids = new Set();
    data[key].forEach((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`${key}[${index}] 항목이 잘못되었습니다.`);
        return;
      }
      if (!item.id || typeof item.id !== 'string') errors.push(`${key}[${index}]에 id가 필요합니다.`);
      else if (ids.has(item.id)) errors.push(`${key}에 중복 id(${item.id})가 있습니다.`);
      else ids.add(item.id);
    });
  }
  return errors.slice(0, 20);
}

function deletionSummary(before, after) {
  return ARRAY_KEYS
    .filter((key) => Array.isArray(before[key]) && Array.isArray(after[key]) && after[key].length < before[key].length)
    .map((key) => ({ key, before: before[key].length, after: after[key].length }));
}

module.exports = {
  ARRAY_KEYS,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  deletionSummary,
  makeSession,
  safeEqual,
  validateData,
  verifySession,
};
