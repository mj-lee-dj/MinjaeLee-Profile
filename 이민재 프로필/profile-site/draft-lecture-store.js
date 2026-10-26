(() => {
  const key = 'profileDraft.lectureCuration';
  const defaults = [
    'lectures_mt5sy7fr',
    'lectures_20261007_canva_korea',
    'l_mr29yai68xvad',
    'l_mskirvwkn6cbr',
    'l_mskifjabnr1q2',
  ];
  const defaultLabel = 'HIGHLIGHTS';
  const sourceCuration = profileData.lectureCuration && typeof profileData.lectureCuration === 'object' ? profileData.lectureCuration : null;
  const selectionCorrectionId = '2026-10-selected-lecture-highlights';
  const gyeongnamCorrectionId = '2026-10-gyeongnam-highlight';
  const canvaOrderId = '2026-10-26-canva-second-highlight';
  const canvaId = 'lectures_20261007_canva_korea';
  const canvaOrderPublished = () => sourceCuration?.highlights?.[0] === defaults[0] && sourceCuration?.highlights?.[1] === canvaId;
  const previousPublishedSelection = ['lectures_mt5sy7fr', 'l_mr29yai68xvad', 'lectures_20261007_canva_korea', 'l_mskip8tt41oij', 'l_mskifjabnr1q2'];
  const previousSelections = [
    ['l_mskiwlabhgr9u', 'l_mr29yai68xvad', 'l_mqcuqz7aplqgo', 'l6', 'lectures_mt5sy7fr'],
    ['l_mskiwlabhgr9u', 'l_mr29yai68xvad', 'l_mqcuqz7aplqgo', 'l6', 'l_mls8mo9epkzye'],
  ];
  const sameSelection = (left, right) => Array.isArray(left) && left.length === right.length && left.every((id, index) => id === right[index]);
  const correctionPublished = () => sameSelection(sourceCuration?.highlights, defaults) || canvaOrderPublished();

  function reconcileCanvaOrder(candidate) {
    if (!canvaOrderPublished() || (Array.isArray(candidate?.curationMigrationIds) && candidate.curationMigrationIds.includes(canvaOrderId))) return candidate;
    const highlights = [...(candidate?.highlights || [])];
    const index = highlights.indexOf(canvaId);
    // Move the existing Canva selection into the second large card. Keep
    // custom selections, visibility, labels and every other relative position.
    if (highlights[0] !== defaults[0] || index < 2) return candidate;
    highlights.splice(index, 1);
    highlights.splice(1, 0, canvaId);
    return { ...candidate, highlights };
  }

  function reconcilePublishedSelection(candidate) {
    if (!correctionPublished()) return candidate;
    const applied = Array.isArray(candidate?.curationMigrationIds) ? candidate.curationMigrationIds : [];
    if (applied.includes(gyeongnamCorrectionId)) return candidate;
    // Migrate the immediately preceding published set or the untouched legacy
    // defaults. Respect custom choices and explicit saves after each correction.
    const priorPublished = sameSelection(candidate?.highlights, previousPublishedSelection);
    const priorDefaults = !applied.includes(selectionCorrectionId) && previousSelections.some((ids) => sameSelection(candidate?.highlights, ids));
    if (!priorPublished && !priorDefaults) return candidate;
    return { ...candidate, highlights: [...sourceCuration.highlights] };
  }

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
      return normalize(reconcileCanvaOrder(reconcilePublishedSelection(JSON.parse(stored))));
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
      // Keep migration bookkeeping local, outside the public curation payload.
      // A later explicit selection, including an old default, must stay chosen.
      const stored = correctionPublished() ? { ...value, curationMigrationIds: [selectionCorrectionId, gyeongnamCorrectionId, ...(canvaOrderPublished() ? [canvaOrderId] : [])] } : value;
      localStorage.setItem(key, JSON.stringify(stored));
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
