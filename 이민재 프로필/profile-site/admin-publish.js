document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('publishProfile');
  const status = document.getElementById('publishStatus');
  const consoleNode = document.getElementById('publishConsole');
  const loginDialog = document.getElementById('publishLoginDialog');
  const loginForm = document.getElementById('publishLoginForm');
  const deployable = location.protocol === 'https:' && location.hostname !== 'localhost';
  let csrf = '';
  let publishing = false;

  function setState(state, message) {
    consoleNode.dataset.state = state;
    status.textContent = message;
    button.disabled = publishing;
    button.textContent = state === 'success' ? '운영 사이트 반영 완료' : '운영 사이트 저장 및 배포';
  }

  async function api(action, options = {}) {
    const response = await fetch(`/api/admin?action=${encodeURIComponent(action)}`, {
      credentials: 'same-origin',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(csrf ? { 'X-Admin-CSRF': csrf } : {}),
        ...(options.headers || {}),
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.error || `요청 실패 (${response.status})`);
      error.status = response.status;
      error.details = body;
      throw error;
    }
    return body;
  }

  function readProofs() {
    try {
      const stored = JSON.parse(localStorage.getItem('profileDraft.featuredProofs') || 'null');
      if (Array.isArray(stored)) return stored;
    } catch (error) {
      if (error?.name !== 'SecurityError') console.warn('핵심 이력 초안을 읽지 못했습니다.', error);
    }
    return structuredClone(profileData.featuredProofs || []);
  }

  function collectData(base) {
    const merged = ProfileContentStore.merge(base, ProfileContentStore.load());
    merged.featuredProofs = readProofs();
    merged.lectureCuration = ProfileLectureStore.load();
    return merged;
  }

  function deletionSummary(before, after) {
    const keys = [...ProfileContentStore.collectionKeys, 'featuredProofs'];
    return keys.filter((key) => Array.isArray(before[key]) && Array.isArray(after[key]) && after[key].length < before[key].length)
      .map((key) => `${key} ${before[key].length}→${after[key].length}`);
  }

  function changedOnServer(remote) {
    const source = ProfileContentStore.source;
    const changed = ProfileContentStore.collectionKeys.filter((key) => JSON.stringify(remote[key] || []) !== JSON.stringify(source[key] || []));
    const personalBaseline = (personal = {}) => ({
      name: personal.name || '',
      nameEn: personal.nameEn || '',
      statement: personal.statement || '',
      draftPhoto: personal.draftPhoto || '',
      lectureCount: personal.lectureCount || '',
      contact: {
        email: personal.contact?.email || '',
        instagram: personal.contact?.instagram || '',
      },
    });
    const sourcePersonal = personalBaseline(source.personal);
    const remotePersonal = personalBaseline(remote.personal);
    if (JSON.stringify(sourcePersonal) !== JSON.stringify(remotePersonal)) changed.push('personal');
    if (Array.isArray(window.ProfileProofSource) && JSON.stringify(remote.featuredProofs || []) !== JSON.stringify(window.ProfileProofSource)) changed.push('featuredProofs');
    if (ProfileLectureStore.source && JSON.stringify(remote.lectureCuration || null) !== JSON.stringify(ProfileLectureStore.source)) changed.push('lectureCuration');
    return changed;
  }

  async function uploadEmbeddedImages(data) {
    const imageEntries = [];
    const uploaded = new Map();
    async function replace(value) {
      if (typeof value === 'string' && value.startsWith('data:image/')) {
        if (!uploaded.has(value)) {
          const result = await api('upload-image', { method: 'POST', body: JSON.stringify({ dataUrl: value }) });
          uploaded.set(value, result.path);
          imageEntries.push({ repoPath: result.repoPath, sha: result.sha });
          setState('uploading', `이미지 ${uploaded.size}장을 안전하게 업로드했습니다.`);
        }
        return uploaded.get(value);
      }
      if (Array.isArray(value)) return Promise.all(value.map(replace));
      if (value && typeof value === 'object') {
        for (const key of Object.keys(value)) value[key] = await replace(value[key]);
      }
      return value;
    }
    await replace(data);
    return imageEntries;
  }

  async function verifyDeployment(expected, cacheKey) {
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      const verificationId = `${encodeURIComponent(cacheKey)}&t=${Date.now()}`;
      const [dataResponse, indexResponse] = await Promise.all([
        fetch(`data_v3.json?verify=${verificationId}`, { cache: 'no-store' }),
        fetch(`index.html?verify=${verificationId}`, { cache: 'no-store' }),
      ]);
      if (dataResponse.ok && indexResponse.ok) {
        const [live, indexHtml] = await Promise.all([dataResponse.json(), indexResponse.text()]);
        if (JSON.stringify(live) === JSON.stringify(expected) && indexHtml.includes(`data_v3.js?v=${cacheKey}`)) return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
    return false;
  }

  async function ensureSession() {
    try {
      const session = await api('session', { method: 'GET' });
      csrf = session.csrf;
      return true;
    } catch (error) {
      if (error.status !== 401) throw error;
      loginDialog.showModal();
      loginDialog.querySelector('input')?.focus();
      return false;
    }
  }

  async function publish() {
    if (publishing) return;
    if (!deployable) {
      setState('error', '로컬 파일에서는 배포하지 않습니다. 배포된 관리자 주소에서 이 버튼을 사용하세요.');
      return;
    }
    if (!await ensureSession()) return;
    publishing = true;
    button.disabled = true;
    try {
      setState('validating', '운영 데이터와 현재 변경사항을 검증하고 있습니다.');
      const remote = await api('data', { method: 'GET' });
      const remoteChanges = changedOnServer(remote.data);
      if (remoteChanges.length) {
        throw new Error(`다른 기기에서 저장된 변경이 있습니다 (${remoteChanges.join(', ')}). 이 페이지를 새로고침한 뒤 다시 배포하세요. 로컬 초안은 보존됩니다.`);
      }
      const next = collectData(remote.data);
      const deletions = deletionSummary(remote.data, next);
      if (deletions.length && !confirm(`다음 삭제를 포함해 운영 사이트에 반영할까요?\n\n${deletions.join('\n')}`)) {
        setState('idle', '배포를 취소했습니다. 로컬 초안은 그대로 보존됩니다.');
        return;
      }
      setState('uploading', '붙여넣은 이미지를 확인하고 있습니다.');
      const imageEntries = await uploadEmbeddedImages(next);
      setState('saving', 'GitHub main에 한 번의 커밋으로 저장하고 있습니다.');
      const saved = await api('save', {
        method: 'POST',
        body: JSON.stringify({
          data: next,
          baseCommitSha: remote.commitSha,
          confirmDeletes: deletions.length > 0,
          imageEntries,
        }),
      });
      const publishedState = ProfileContentStore.save(next);
      if (publishedState) window.dispatchEvent(new CustomEvent('profileDraft:published', { detail: publishedState }));
      try { localStorage.setItem('profileDraft.featuredProofs', JSON.stringify(next.featuredProofs)); } catch {}
      ProfileLectureStore.save(next.lectureCuration);
      setState('verifying', 'GitHub 저장 완료. Vercel 운영 반영을 확인하고 있습니다.');
      const verified = await verifyDeployment(next, saved.cacheKey);
      setState(verified ? 'success' : 'error', verified
        ? '운영 사이트 반영을 확인했습니다.'
        : 'GitHub 저장은 완료됐지만 2분 안에 운영 반영을 확인하지 못했습니다. Vercel 배포 상태를 확인하세요.');
    } catch (error) {
      setState('error', error.message || '저장 및 배포 중 오류가 발생했습니다.');
    } finally {
      publishing = false;
      button.disabled = false;
    }
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (event.submitter?.value === 'cancel') return loginDialog.close();
    const password = String(new FormData(loginForm).get('password') || '');
    try {
      const session = await api('login', { method: 'POST', body: JSON.stringify({ password }) });
      csrf = session.csrf;
      loginForm.reset();
      loginDialog.close();
      publish();
    } catch (error) {
      document.getElementById('publishLoginNotice').textContent = error.message;
    }
  });
  button.addEventListener('click', publish);
  window.addEventListener('profileDraft:changed', () => setState('dirty', '저장할 변경사항이 있습니다. 운영 반영은 버튼을 눌러 시작합니다.'));
  setState('idle', deployable
    ? '수정을 마친 뒤 한 번 눌러 저장·배포·운영 반영 확인까지 진행합니다.'
    : '현재는 로컬 초안입니다. 운영 배포는 실행되지 않습니다.');
});
