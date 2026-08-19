(() => {
  const key = 'profileDraft.lectureCuration';
  const defaults = [
    'l_mskiwlabhgr9u',
    'l_mr29yai68xvad',
    'l_mqcuqz7aplqgo',
    'l6',
    'l_mls8mo9epkzye',
  ];
  const defaultLabel = 'TITLE';
  const sourceCuration = profileData.lectureCuration && typeof profileData.lectureCuration === 'object' ? profileData.lectureCuration : null;

  function normalize(candidate, fill = true) {
    const lectures = profileData.lectures || [];
    const ids = new Set(lectures.map((lecture) => lecture.id));
    const visibleIds = new Set(lectures.filter((lecture) => lecture.visible !== false).map((lecture) => lecture.id));
    const requested = Array.isArray(candidate?.highlights) ? candidate.highlights : [];
    const highlights = [...new Set(requested.filter((id) => visibleIds.has(id)))].slice(0, 5);
    if (fill) {
      [...defaults, ...visibleIds].forEach((id) => {
        if (highlights.length < 5 && visibleIds.has(id) && !highlights.includes(id)) highlights.push(id);
      });
    }
    const hidden = [...new Set((Array.isArray(candidate?.hidden) ? candidate.hidden : []).filter((id) => ids.has(id)))];
    const label = String(candidate?.label || defaultLabel).trim().slice(0, 24) || defaultLabel;
    return { highlights, hidden, label };
  }

  function reconcile(current, dirty) {
    return dirty ? normalize(current, false) : load();
  }

  function load() {
    let stored = '';
    try {
      stored = localStorage.getItem(key) || '';
    } catch (error) {
      if (error?.name !== 'SecurityError') console.warn('강의 큐레이션 저장소를 읽지 못해 기본값을 사용합니다.', error);
      return normalize(sourceCuration);
    }
    if (!stored) return normalize(sourceCuration);
    try {
      return normalize(JSON.parse(stored));
    } catch (error) {
      try {
        localStorage.removeItem(key);
      } catch (storageError) {
        if (storageError?.name !== 'SecurityError') console.warn('손상된 강의 큐레이션 초안을 제거하지 못했습니다.', storageError);
      }
      console.warn('손상된 강의 큐레이션 초안을 기본값으로 복구했습니다.', error);
      return normalize(sourceCuration);
    }
  }

  function save(candidate) {
    const value = normalize(candidate);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (error?.name !== 'SecurityError') console.warn('강의 큐레이션 초안을 저장하지 못했습니다.', error);
      return null;
    }
    window.dispatchEvent(new CustomEvent('profileDraft:lectureCuration', { detail: value }));
    window.dispatchEvent(new CustomEvent('profileDraft:changed', { detail: { source: 'lectureCuration' } }));
    return value;
  }

  window.ProfileLectureStore = Object.freeze({ key, defaults: Object.freeze([...defaults]), defaultLabel, source: sourceCuration, normalize, reconcile, load, save });
  profileData.lectureCuration = load();
})();
