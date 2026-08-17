const {
  ARRAY_KEYS,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  deletionSummary,
  makeSession,
  safeEqual,
  validateData,
  verifySession,
} = require('./_core');

const REPO_OWNER = 'mj-lee-dj';
const REPO_NAME = 'MinjaeLee-Profile';
const BRANCH = 'main';
const PROJECT_ROOT = '\uc774\ubbfc\uc7ac \ud504\ub85c\ud544/profile-site';
const DATA_JS_PATH = `${PROJECT_ROOT}/data_v3.js`;
const DATA_JSON_PATH = `${PROJECT_ROOT}/data_v3.json`;
const INDEX_PATH = `${PROJECT_ROOT}/index.html`;
const MAX_JSON_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (Buffer.byteLength(raw) > MAX_IMAGE_BYTES * 2) {
        reject(new Error('\uc694\uccad \ud06c\uae30\uac00 \ub108\ubb34 \ud07d\ub2c8\ub2e4.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('\uc798\ubabb\ub41c JSON \uc694\uccad\uc785\ub2c8\ub2e4.'));
      }
    });
    req.on('error', reject);
  });
}

function sameOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host) return false;
  const source = req.headers.origin || req.headers.referer;
  if (source) {
    try {
      return new URL(source).host === host;
    } catch {
      return false;
    }
  }
  return req.headers['sec-fetch-site'] === 'same-origin';
}

function requireConfig(res) {
  const missing = ['ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET', 'GITHUB_ADMIN_TOKEN']
    .filter((name) => !process.env[name]);
  if (missing.length) {
    json(res, 503, { error: '\uad00\ub9ac\uc790 \ud658\uacbd \uc124\uc815\uc774 \uc644\ub8cc\ub418\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.', missing });
    return false;
  }
  return true;
}

async function github(path, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_ADMIN_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    const error = new Error(detail.message || `GitHub API ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function githubGraphql(query, variables) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || (Array.isArray(payload.errors) && payload.errors.length)) {
    const detail = Array.isArray(payload.errors) ? payload.errors[0] : payload;
    const error = new Error(detail?.message || `GitHub GraphQL API ${response.status}`);
    if (response.ok && detail?.type === 'FORBIDDEN') error.status = 403;
    else if (response.ok && detail?.type === 'UNPROCESSABLE') error.status = 409;
    else error.status = response.status;
    throw error;
  }
  return payload.data;
}

async function getCurrentData() {
  const ref = await github(`/git/ref/heads/${BRANCH}`);
  const commitSha = ref.object.sha;
  const content = await github(`/contents/${encodeURIComponent(DATA_JSON_PATH).replace(/%2F/g, '/')}?ref=${commitSha}`);
  const data = JSON.parse(Buffer.from(content.content.replace(/\s/g, ''), 'base64').toString('utf8'));
  return { commitSha, data };
}

async function makeBlob(content, encoding = 'utf-8') {
  return github('/git/blobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, encoding }),
  });
}

async function handleUpload(req, res) {
  const body = await readBody(req);
  const match = String(body.dataUrl || '').match(/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return json(res, 400, { error: 'PNG, JPEG, WebP, GIF \uc774\ubbf8\uc9c0\ub9cc \uc5c5\ub85c\ub4dc\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.' });
  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return json(res, 413, { error: '\uc774\ubbf8\uc9c0\ub294 3MB \uc774\ud558\uc5ec\uc57c \ud569\ub2c8\ub2e4.' });
  const blob = await makeBlob(match[2], 'base64');
  const filename = `${blob.sha.slice(0, 12)}.${extension}`;
  return json(res, 200, {
    path: `uploads/${filename}`,
    repoPath: `${PROJECT_ROOT}/uploads/${filename}`,
    sha: blob.sha,
  });
}

async function handleSave(req, res, session) {
  if (req.headers['x-admin-csrf'] !== session.csrf) return json(res, 403, { error: '\ubcf4\uc548 \ud1a0\ud070\uc774 \uc77c\uce58\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. \ub2e4\uc2dc \ub85c\uadf8\uc778\ud558\uc138\uc694.' });
  const body = await readBody(req);
  const serialized = JSON.stringify(body.data || {});
  if (Buffer.byteLength(serialized) > MAX_JSON_BYTES) return json(res, 413, { error: '\ub370\uc774\ud130 \ud30c\uc77c\uc774 2MB\ub97c \ucd08\uacfc\ud588\uc2b5\ub2c8\ub2e4.' });
  const errors = validateData(body.data);
  if (errors.length) return json(res, 400, { error: '\ub370\uc774\ud130 \uac80\uc99d\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.', details: errors });

  const { commitSha: latestCommitSha, data: currentData } = await getCurrentData();
  if (!body.baseCommitSha || body.baseCommitSha !== latestCommitSha) {
    return json(res, 409, { error: '\ub2e4\ub978 \ubcc0\uacbd\uc774 \uba3c\uc800 \uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4. \ud604\uc7ac \ud398\uc774\uc9c0\ub97c \uc0c8\ub85c\uace0\uce68\ud55c \ub4a4 \ub2e4\uc2dc \uc218\uc815\ud558\uc138\uc694.' });
  }
  const deletions = deletionSummary(currentData, body.data);
  if (deletions.length && body.confirmDeletes !== true) {
    return json(res, 409, { error: '\ud56d\ubaa9 \uc0ad\uc81c\uac00 \uac10\uc9c0\ub418\uc5c8\uc2b5\ub2c8\ub2e4.', requiresDeleteConfirmation: true, deletions });
  }

  const updatedAt = new Date().toISOString();
  const prettyJson = `${JSON.stringify(body.data, null, 2)}\n`;
  const jsContent = `/*\n  [Profile Data]\n  Updated at: ${updatedAt}\n*/\nconst profileData = ${JSON.stringify(body.data, null, 2)};\n`;
  const indexFile = await github(`/contents/${encodeURIComponent(INDEX_PATH).replace(/%2F/g, '/')}?ref=${latestCommitSha}`);
  const indexText = Buffer.from(indexFile.content.replace(/\s/g, ''), 'base64').toString('utf8');
  const cacheKey = Date.now();
  const updatedIndex = indexText
    .replace(/data_v3\.js(\?v=[^"']+)?/g, `data_v3.js?v=${cacheKey}`)
    .replace(/style\.css(\?v=[^"']+)?/g, `style.css?v=${cacheKey}`)
    .replace(/script\.js(\?v=[^"']+)?/g, `script.js?v=${cacheKey}`);

  const imageEntries = Array.isArray(body.imageEntries) ? body.imageEntries : [];
  const validatedImages = imageEntries.map((entry) => {
    const expectedPrefix = `${PROJECT_ROOT}/uploads/`;
    if (!entry || typeof entry.repoPath !== 'string' || !entry.repoPath.startsWith(expectedPrefix) ||
        !/^[0-9a-f]{40}$/.test(String(entry.sha || ''))) {
      throw Object.assign(new Error('\uc774\ubbf8\uc9c0 \uc800\uc7a5 \uc815\ubcf4\uac00 \uc798\ubabb\ub418\uc5c8\uc2b5\ub2c8\ub2e4.'), { status: 400 });
    }
    return { path: entry.repoPath, sha: entry.sha };
  });

  const imageAdditions = await Promise.all(validatedImages.map(async (entry) => {
    const blob = await github(`/git/blobs/${entry.sha}`);
    if (!blob.content) throw Object.assign(new Error('\uc774\ubbf8\uc9c0 \ube14\ub86d\uc744 \uc77d\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.'), { status: 400 });
    return { path: entry.path, contents: blob.content.replace(/\s/g, '') };
  }));
  const additions = [
    ...imageAdditions,
    { path: DATA_JS_PATH, contents: Buffer.from(jsContent).toString('base64') },
    { path: DATA_JSON_PATH, contents: Buffer.from(prettyJson).toString('base64') },
    { path: INDEX_PATH, contents: Buffer.from(updatedIndex).toString('base64') },
  ];
  const mutation = `
    mutation CreateAdminCommit($input: CreateCommitOnBranchInput!) {
      createCommitOnBranch(input: $input) {
        commit { oid }
      }
    }
  `;
  const result = await githubGraphql(mutation, {
    input: {
      branch: {
        repositoryNameWithOwner: `${REPO_OWNER}/${REPO_NAME}`,
        refName: `refs/heads/${BRANCH}`,
      },
      expectedHeadOid: latestCommitSha,
      message: { headline: `content: update profile via admin (${new Date().toISOString().slice(0, 10)})` },
      fileChanges: { additions },
    },
  });
  const newCommitSha = result?.createCommitOnBranch?.commit?.oid;
  if (!newCommitSha) throw new Error('GitHub \ucee4\ubc0b \uc751\ub2f5\uc5d0 SHA\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.');
  return json(res, 200, { ok: true, commitSha: newCommitSha, updatedAt, cacheKey });
}

module.exports = async function handler(req, res) {
  try {
    if (!requireConfig(res)) return;
    if (req.method === 'OPTIONS') return json(res, 405, { error: '\ud5c8\uc6a9\ub418\uc9c0 \uc54a\ub294 \uc694\uccad\uc785\ub2c8\ub2e4.' });
    if (!sameOrigin(req)) return json(res, 403, { error: '\ub3d9\uc77c\ud55c \uc0ac\uc774\ud2b8\uc5d0\uc11c\ub9cc \uc694\uccad\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.' });
    const action = String(req.query.action || 'session');

    if (action === 'login' && req.method === 'POST') {
      const body = await readBody(req);
      if (!safeEqual(body.password || '', process.env.ADMIN_PASSWORD)) {
        return json(res, 401, { error: '\ube44\ubc00\ubc88\ud638\uac00 \uc62c\ubc14\ub974\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.' });
      }
      const token = makeSession(process.env.ADMIN_SESSION_SECRET);
      const session = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8'));
      res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Strict`);
      return json(res, 200, { ok: true, csrf: session.csrf, expiresAt: session.exp });
    }

    if (action === 'logout' && req.method === 'POST') {
      res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
      return json(res, 200, { ok: true });
    }

    const session = verifySession(req, process.env.ADMIN_SESSION_SECRET);
    if (!session) return json(res, 401, { error: '\ub85c\uadf8\uc778\uc774 \ud544\uc694\ud569\ub2c8\ub2e4.' });
    if (action === 'session' && req.method === 'GET') return json(res, 200, { ok: true, csrf: session.csrf, expiresAt: session.exp });
    if (action === 'data' && req.method === 'GET') {
      const current = await getCurrentData();
      const errors = validateData(current.data);
      if (errors.length) return json(res, 500, { error: '\uc6b4\uc601 \ub370\uc774\ud130 \uad6c\uc870\uac00 \uc190\uc0c1\ub418\uc5c8\uc2b5\ub2c8\ub2e4.', details: errors });
      return json(res, 200, current);
    }
    if (action === 'upload-image' && req.method === 'POST') {
      if (req.headers['x-admin-csrf'] !== session.csrf) return json(res, 403, { error: '\ubcf4\uc548 \ud1a0\ud070\uc774 \uc77c\uce58\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.' });
      return handleUpload(req, res);
    }
    if (action === 'save' && req.method === 'POST') return handleSave(req, res, session);
    return json(res, 405, { error: '\ud5c8\uc6a9\ub418\uc9c0 \uc54a\ub294 \uc694\uccad\uc785\ub2c8\ub2e4.' });
  } catch (error) {
    console.error('Admin API error:', error.message);
    return json(res, error.status && error.status < 500 ? error.status : 500, {
      error: error.status === 401 || error.status === 403
        ? 'GitHub \uc800\uc7a5 \uad8c\ud55c\uc744 \ud655\uc778\ud558\uc138\uc694.'
        : error.status === 409
          ? '\ub2e4\ub978 \ubcc0\uacbd\uc774 \uba3c\uc800 \uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4. \ud604\uc7ac \ud398\uc774\uc9c0\ub97c \uc0c8\ub85c\uace0\uce68\ud55c \ub4a4 \ub2e4\uc2dc \uc218\uc815\ud558\uc138\uc694.'
          : '\uad00\ub9ac\uc790 \uc694\uccad \ucc98\ub9ac \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.',
    });
  }
};
