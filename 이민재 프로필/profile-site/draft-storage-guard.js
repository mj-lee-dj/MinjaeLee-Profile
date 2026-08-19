(() => {
  const key = 'profileDraft.featuredProofs';
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new TypeError('Expected an array of proof items.');
  } catch (error) {
    if (error?.name === 'SecurityError') return;
    try {
      localStorage.removeItem(key);
    } catch (storageError) {
      if (storageError?.name !== 'SecurityError') console.warn('손상된 핵심 이력 초안을 제거하지 못했습니다.', storageError);
    }
    console.warn('손상된 로컬 핵심 이력 초안을 초기값으로 복구했습니다.', error);
  }
})();
