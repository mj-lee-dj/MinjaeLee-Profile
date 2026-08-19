(() => {
  const key = 'profileDraft.contentV1';
  const collectionKeys = Object.freeze([
    'publications', 'onlineCourses', 'youtubeVideos', 'lectures',
    'awards', 'activities', 'press',
  ]);
  const lectureTopics = Object.freeze([
    'AI', 'Google', 'Canva·에듀테크', '교사 업무·학급경영',
    '학부모·학생 강의', '강사코칭',
  ]);
  const fields = Object.freeze({
    publications: ['title', 'publisher', 'year', 'description', 'previewDesc', 'link', 'images', 'tags', 'visible'],
    onlineCourses: ['title', 'platform', 'credit', 'link', 'images', 'visible'],
    youtubeVideos: ['title', 'link', 'images', 'visible'],
    lectures: ['title', 'org', 'year', 'category', 'topic', 'link', 'images', 'highlight', 'visible'],
    awards: ['title', 'org', 'year', 'link', 'visible'],
    activities: ['title', 'period', 'link', 'visible'],
    press: ['title', 'source', 'date', 'previewDesc', 'link', 'images', 'visible'],
  });
  const clone = (value) => structuredClone(value);
  const sourcePersonal = clone(profileData.personal || {});
  const sourceCollections = Object.fromEntries(collectionKeys.map((section) => [section, clone(profileData[section] || [])]));
  const source = Object.freeze({ personal: clone(sourcePersonal), ...clone(sourceCollections) });
  const text = (value, max = 4000) => String(value ?? '').trim().slice(0, max);
  const url = (value) => {
    const candidate = text(value, 2000);
    return !candidate || /^https?:\/\//i.test(candidate) ? candidate : '';
  };
  const asset = (value) => {
    const candidate = String(value ?? "").trim();
    const pasted = ["data:image/png;base64,", "data:image/jpeg;base64,", "data:image/webp;base64,", "data:image/gif;base64,"]
      .some((prefix) => candidate.startsWith(prefix));
    if (pasted && candidate.length <= 1250000) return candidate;
    const relative = candidate.startsWith("uploads/") || candidate.startsWith("assets/");
    const remote = candidate.startsWith("https://") || candidate.startsWith("http://");
    return relative || remote ? text(candidate, 2000) : "";
  };
  const inferLectureTopic = (item) => {
    const source = `${item?.category || ''} ${item?.title || ''}`.toLowerCase();
    if (/코칭|강사|퍼실리테이션/.test(source)) return '강사코칭';
    if (/학부모|학생|청소년/.test(source)) return '학부모·학생 강의';
    if (/학급|업무|행정|교사/.test(source)) return '교사 업무·학급경영';
    if (/canva|캔바|에듀테크|코드위즈|메타버스/.test(source)) return 'Canva·에듀테크';
    if (/google|구글|gemini|제미나이|notebooklm/.test(source)) return 'Google';
    return 'AI';
  };

  function normalizedImages(item) {
    const candidates = Array.isArray(item?.images) ? item.images : [];
    const image = asset(item?.image);
    return [...new Set([...candidates.map(asset), image].filter(Boolean))].slice(0, 12);
  }

  function normalizeItem(section, item, index) {
    if (!item || typeof item !== 'object') return null;
    const result = {
      id: text(item.id, 120) || `${section}_${Date.now().toString(36)}_${index}`,
      visible: item.visible !== false,
    };
    fields[section].forEach((field) => {
      if (field === 'visible') return;
      if (field === 'link') result.link = url(item.link);
      else if (field === 'images') {
        result.images = normalizedImages(item);
        result.image = result.images[0] || '';
      } else if (field === 'tags') {
        result.tags = (Array.isArray(item.tags) ? item.tags : []).map((tag) => text(tag, 80)).filter(Boolean).slice(0, 12);
      } else if (field === 'highlight') result.highlight = item.highlight === true;
      else result[field] = text(item[field], field === 'previewDesc' || field === 'description' ? 8000 : 1000);
    });
    if (!result.title) return null;
    if (section === 'lectures') {
      result.topic = lectureTopics.includes(result.topic) ? result.topic : inferLectureTopic(result);
      result.category = result.category || result.topic;
    }
    return result;
  }

  function orderLegacyBooks(books) {
    try {
      const parsed = JSON.parse(localStorage.getItem('profileDraft.bookOrder') || 'null');
      if (!Array.isArray(parsed?.order)) return books;
      const byId = new Map(books.map((book) => [book.id, book]));
      return [...parsed.order.map((id) => byId.get(id)).filter(Boolean),
        ...books.filter((book) => !parsed.order.includes(book.id))];
    } catch (error) {
      if (error?.name !== 'SecurityError') console.warn('기존 저서 순서를 읽지 못했습니다.', error);
      return books;
    }
  }

  function orderDefaultBooks(books) {
    const priorities = [/^Google로 칼퇴/, /제미나이 탐험대/, /구글 탐험대/, /AI 메이커 스케치북/];
    const remaining = [...books];
    const ordered = priorities.map((pattern) => {
      const index = remaining.findIndex((book) => pattern.test(book.title || ""));
      return index < 0 ? null : remaining.splice(index, 1)[0];
    }).filter(Boolean);
    return [...ordered, ...remaining];
  }

  function orderDefaultVideos(videos) {
    const next = [...videos];
    const classroom = next.findIndex((video) => String(video.link || '').includes('wGgF2MSds5E'));
    if (classroom > 2) next.splice(2, 0, next.splice(classroom, 1)[0]);
    return next;
  }

  function defaultState() {
    const contact = sourcePersonal.contact || {};
    const personal = {
      name: text(sourcePersonal.name, 100) || '이민재',
      nameEn: text(sourcePersonal.nameEn, 100) || 'Minjae Lee',
      statement: '기술을 고르는 기준은\n언제나 교실입니다.',
      photo: 'assets/profile-2026.png',
      lectureCount: '150+',
      email: text(contact.email, 320),
      instagram: url(contact.instagram),
    };
    const state = { version: 1, personal };
    collectionKeys.forEach((section) => {
      const source = clone(sourceCollections[section]);
      const ordered = section === 'publications'
        ? orderLegacyBooks(orderDefaultBooks(source))
        : section === 'youtubeVideos' ? orderDefaultVideos(source) : source;
      state[section] = ordered.map((item, index) => normalizeItem(section, item, index)).filter(Boolean);
    });
    return state;
  }

  function normalize(candidate) {
    const fallback = defaultState();
    if (!candidate || typeof candidate !== 'object') return fallback;
    const candidatePersonal = candidate.personal && typeof candidate.personal === 'object' ? candidate.personal : {};
    const personal = {
      name: text(candidatePersonal.name, 100) || fallback.personal.name,
      nameEn: text(candidatePersonal.nameEn, 100) || fallback.personal.nameEn,
      statement: text(candidatePersonal.statement, 500) || fallback.personal.statement,
      photo: asset(candidatePersonal.photo) || fallback.personal.photo,
      lectureCount: text(candidatePersonal.lectureCount, 20) || fallback.personal.lectureCount,
      email: text(candidatePersonal.email, 320) || fallback.personal.email,
      instagram: url(candidatePersonal.instagram) || fallback.personal.instagram,
    };
    const state = { version: 1, personal };
    collectionKeys.forEach((section) => {
      const source = Array.isArray(candidate[section]) ? candidate[section] : fallback[section];
      state[section] = source.map((item, index) => normalizeItem(section, item, index)).filter(Boolean);
    });
    return state;
  }

  function merge(base, candidate) {
    const state = normalize(candidate);
    const merged = clone(base || {});
    merged.personal = {
      ...(merged.personal || {}),
      name: state.personal.name,
      nameEn: state.personal.nameEn,
      statement: state.personal.statement,
      draftPhoto: state.personal.photo,
      lectureCount: state.personal.lectureCount,
      contact: {
        ...(merged.personal?.contact || {}),
        email: state.personal.email,
        instagram: state.personal.instagram,
      },
    };
    collectionKeys.forEach((section) => {
      merged[section] = clone(state[section]);
    });
    return merged;
  }

  function apply(state) {
    profileData.personal = {
      ...(profileData.personal || {}),
      name: state.personal.name,
      nameEn: state.personal.nameEn,
      statement: state.personal.statement,
      draftPhoto: state.personal.photo,
      lectureCount: state.personal.lectureCount,
      contact: {
        ...(profileData.personal?.contact || {}),
        email: state.personal.email,
        instagram: state.personal.instagram,
      },
    };
    collectionKeys.forEach((section) => {
      profileData[section] = clone(state[section]);
    });
    return state;
  }

  function load() {
    let stored = '';
    try {
      stored = localStorage.getItem(key) || '';
    } catch (error) {
      if (error?.name !== 'SecurityError') console.warn('통합 콘텐츠 초안을 읽지 못했습니다.', error);
      return defaultState();
    }
    if (!stored) return defaultState();
    try {
      return normalize(JSON.parse(stored));
    } catch (error) {
      console.warn('손상된 통합 콘텐츠 초안을 기본값으로 복구했습니다.', error);
      return defaultState();
    }
  }

  function save(candidate) {
    const value = normalize(candidate);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (error?.name !== 'SecurityError') console.warn('통합 콘텐츠 초안을 저장하지 못했습니다.', error);
      return null;
    }
    apply(value);
    window.dispatchEvent(new CustomEvent('profileDraft:content', { detail: clone(value) }));
    window.dispatchEvent(new CustomEvent('profileDraft:changed', { detail: { source: 'content' } }));
    return value;
  }

  function reset() {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      if (error?.name !== 'SecurityError') console.warn('통합 콘텐츠 초안을 초기화하지 못했습니다.', error);
      return null;
    }
    const value = defaultState();
    apply(value);
    window.dispatchEvent(new CustomEvent('profileDraft:content', { detail: clone(value) }));
    window.dispatchEvent(new CustomEvent('profileDraft:changed', { detail: { source: 'content' } }));
    return value;
  }

  const initial = apply(load());
  window.ProfileContentStore = Object.freeze({
    key,
    collectionKeys,
    lectureTopics,
    inferLectureTopic,
    load,
    save,
    reset,
    normalize,
    merge,
    source,
    state: initial,
  });
})();
