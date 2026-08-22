document.addEventListener('DOMContentLoaded', () => {
  const data = profileData;
  const fixedTopics = [
    { id: 'AI', label: 'AI' },
    { id: 'Google', label: 'Google' },
    { id: 'Canva·에듀테크', label: 'Canva·에듀테크' },
    { id: '교사 업무·학급경영', label: '교사 업무·학급경영' },
    { id: '학부모·학생 강의', label: '학부모·학생 강의' },
    { id: '강사코칭', label: '강사코칭' },
  ];
  const state = { topic: 'selected', activeLectureId: '', videoIndex: 0, galleryLecture: null, galleryIndex: 0, galleryTrigger: null };
  const mobileQuery = matchMedia('(max-width: 640px)');
  const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const assetUrl = (value) => { const candidate = String(value ?? ''); return candidate.startsWith('uploads/') || candidate.startsWith('assets/') || candidate.startsWith('https://') || candidate.startsWith('http://') || ['data:image/png;base64,', 'data:image/jpeg;base64,', 'data:image/webp;base64,', 'data:image/gif;base64,'].some((prefix) => candidate.startsWith(prefix)) ? candidate : ''; };
  const externalUrl = (value) => /^https?:///i.test(String(value ?? '')) ? String(value) : '';
  const pad = (value) => String(value).padStart(2, '0');

  function lectureTopic(item) {
    if (ProfileContentStore.lectureTopics.includes(item.topic)) return item.topic;
    const source = `${item.category || ''} ${item.title || ''}`.toLowerCase();
    if (/코칭|강사|퍼실리테이션/.test(source)) return '강사코칭';
    if (/학부모|학생|청소년/.test(source)) return '학부모·학생 강의';
    if (/학급|업무|행정|교사/.test(source)) return '교사 업무·학급경영';
    if (/canva|캔바|에듀테크|코드위즈|메타버스/.test(source)) return 'Canva·에듀테크';
    if (/google|구글|gemini|제미나이|notebooklm/.test(source)) return 'Google';
    return 'AI';
  }
  function lectureImages(lecture) { return [...new Set([...(lecture?.images || []), lecture?.image].map(assetUrl).filter(Boolean))].slice(0, 3); }
  function allLectures() { const hidden = new Set(ProfileLectureStore.load().hidden); return (data.lectures || []).filter((lecture) => lecture.visible !== false && !hidden.has(lecture.id)); }
  function visibleLectures() {
    if (state.topic === 'all') return allLectures();
    if (state.topic === 'selected') { const curation = ProfileLectureStore.load(); return curation.highlights.map((id) => data.lectures.find((lecture) => lecture.id === id)).filter((lecture) => lecture && lecture.visible !== false); }
    return allLectures().filter((lecture) => lectureTopic(lecture) === state.topic);
  }
  function highlightLabel() { const label = ProfileLectureStore.load().label; return !label || label.toUpperCase() === 'TITLE' ? 'HIGHLIGHTS' : label; }
  function topics() { return [{ id: 'selected', label: highlightLabel() }, ...fixedTopics]; }
  function renderTopics(focusId = '') {
    const target = document.getElementById('lectureTopics');
    target.innerHTML = topics().map((topic) => `<button class="topic-index__button" type="button" data-topic="${escapeHtml(topic.id)}" aria-pressed="${topic.id === state.topic}">${escapeHtml(topic.label)}</button>`).join('');
    if (focusId) requestAnimationFrame(() => target.querySelector(`[data-topic="${CSS.escape(focusId)}"]`)?.focus());
  }
  function renderShowcase(lecture) {
    const target = document.getElementById('lectureShowcase'); const images = lectureImages(lecture);
    if (!lecture || images.length === 0) { target.innerHTML = '<div class="lecture-showcase__empty"><p>이 강의의 대표 슬라이드를 준비하고 있습니다.</p></div>'; return; }
    target.innerHTML = `<div class="lecture-showcase__heading"><p class="eyebrow">Slide study / 01—${pad(images.length)}</p><h3>${escapeHtml(lecture.title)}</h3></div><div class="lecture-showcase" data-count="${images.length}">${images.map((image, index) => `<figure class="lecture-showcase__slide"><img src="${escapeHtml(image)}" width="1280" height="720" alt="${escapeHtml(lecture.title)} 대표 슬라이드 ${index + 1}" loading="lazy"><figcaption>${pad(index + 1)} / ${pad(images.length)}</figcaption></figure>`).join('')}</div>`;
  }

  function rowThumbnail(lecture) {
    const images = lectureImages(lecture); if (!images[0]) return '';
    const indicator = images.length > 1 ? `<span class="lecture-ledger__gallery-indicator" aria-hidden="true"><svg viewBox="0 0 16 16"><rect x="2.5" y="4.5" width="9" height="8" rx="1"></rect><path d="M5 2.5h8.5v8"></path></svg><span>${images.length}</span></span>` : '';
    return `<span class="lecture-ledger__thumb"><img src="${escapeHtml(images[0])}" width="320" height="180" alt="" loading="lazy">${indicator}</span>`;
  }
  function renderLectures() {
    const shown = visibleLectures();
    if (!shown.some((lecture) => lecture.id === state.activeLectureId)) state.activeLectureId = shown[0]?.id || '';
    document.getElementById('lectureLedger').innerHTML = shown.map((lecture) => `<li class="lecture-ledger__item"><button class="lecture-ledger__button" type="button" data-lecture-id="${escapeHtml(lecture.id)}" ${lecture.id === state.activeLectureId ? 'aria-current="true"' : ''} aria-label="${escapeHtml(lecture.title)}${lectureImages(lecture).length ? ' 강의 자료 보기' : ''}"><span class="lecture-ledger__year">${escapeHtml(lecture.year)}</span><span class="lecture-ledger__title">${escapeHtml(lecture.title)}</span><span class="lecture-ledger__org">${escapeHtml(lecture.org)}</span>${rowThumbnail(lecture)}</button></li>`).join('') || '<li class="lecture-ledger__item"><p class="lecture-ledger__empty">이 주제의 기록을 준비하고 있습니다.</p></li>';
    renderShowcase(shown.find((lecture) => lecture.id === state.activeLectureId));
    document.getElementById('lectureMore').firstChild.textContent = state.topic === 'all' ? '대표 강의만 보기 ' : '전체 강의 보기 ';
  }
  function ensureGallery() {
    if (document.getElementById('lectureGallery')) return;
    document.body.insertAdjacentHTML('beforeend', `<div class="lecture-gallery" id="lectureGallery" hidden><div class="lecture-gallery__panel" role="dialog" aria-modal="true" aria-labelledby="lectureGalleryTitle" tabindex="-1"><header class="lecture-gallery__header"><button class="lecture-gallery__close" type="button" aria-label="강의 자료 닫기" data-gallery-close><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"></path></svg></button><strong id="lectureGalleryTitle">강의 자료</strong><span class="lecture-gallery__count" id="lectureGalleryCount"></span></header><div class="lecture-gallery__stage" id="lectureGalleryStage"><button class="lecture-gallery__control lecture-gallery__control--prev" type="button" data-gallery-prev aria-label="이전 이미지"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg></button><img id="lectureGalleryImage" width="1280" height="720" alt=""><button class="lecture-gallery__control lecture-gallery__control--next" type="button" data-gallery-next aria-label="다음 이미지"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg></button></div><div class="lecture-gallery__thumbs" id="lectureGalleryThumbs" aria-label="강의 자료 이미지 선택"></div><div class="lecture-gallery__meta"><h3 id="lectureGalleryLectureTitle"></h3><p id="lectureGalleryOrg"></p></div></div></div>`);
  }
  function renderGallery() {
    const lecture = state.galleryLecture; const images = lectureImages(lecture); if (!lecture || !images.length) return;
    state.galleryIndex = Math.max(0, Math.min(state.galleryIndex, images.length - 1));
    const image = document.getElementById('lectureGalleryImage'); image.src = images[state.galleryIndex]; image.alt = `${lecture.title} 강의 자료 ${state.galleryIndex + 1}`;
    document.getElementById('lectureGalleryCount').textContent = `${state.galleryIndex + 1} / ${images.length}`;
    document.getElementById('lectureGalleryLectureTitle').textContent = lecture.title;
    document.getElementById('lectureGalleryOrg').textContent = [lecture.org, lecture.year].filter(Boolean).join(' · ');
    document.getElementById('lectureGalleryThumbs').innerHTML = images.map((src, index) => `<button class="lecture-gallery__thumb" type="button" data-gallery-index="${index}" aria-label="${index + 1}번째 이미지 보기" aria-current="${index === state.galleryIndex}"><img src="${escapeHtml(src)}" width="320" height="180" alt=""></button>`).join('');
    document.querySelector('[data-gallery-prev]').disabled = images.length < 2 || state.galleryIndex === 0;
    document.querySelector('[data-gallery-next]').disabled = images.length < 2 || state.galleryIndex === images.length - 1;
  }

  function moveGallery(delta) { state.galleryIndex += delta; renderGallery(); document.querySelector(`[data-gallery-index="${state.galleryIndex}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }
  function openGallery(lecture, trigger) {
    const images = lectureImages(lecture); if (!mobileQuery.matches || !images.length) return false;
    ensureGallery(); state.galleryLecture = lecture; state.galleryIndex = 0; state.galleryTrigger = trigger;
    const gallery = document.getElementById('lectureGallery'); gallery.hidden = false; document.body.classList.add('lecture-gallery-open'); renderGallery(); requestAnimationFrame(() => gallery.querySelector('[data-gallery-close]')?.focus()); return true;
  }
  function closeGallery() {
    const gallery = document.getElementById('lectureGallery'); if (!gallery || gallery.hidden) return;
    gallery.hidden = true; document.body.classList.remove('lecture-gallery-open'); state.galleryLecture = null; state.galleryTrigger?.focus(); state.galleryTrigger = null;
  }
  function bindGallery() {
    ensureGallery(); const gallery = document.getElementById('lectureGallery'); const stage = document.getElementById('lectureGalleryStage'); let startX = 0;
    gallery.addEventListener('click', (event) => {
      if (event.target.closest('[data-gallery-close]')) closeGallery();
      if (event.target.closest('[data-gallery-prev]')) moveGallery(-1);
      if (event.target.closest('[data-gallery-next]')) moveGallery(1);
      const thumb = event.target.closest('[data-gallery-index]'); if (thumb) { state.galleryIndex = Number(thumb.dataset.galleryIndex); renderGallery(); }
    });
    stage.addEventListener('touchstart', (event) => { startX = event.changedTouches[0]?.clientX || 0; }, { passive: true });
    stage.addEventListener('touchend', (event) => { const delta = (event.changedTouches[0]?.clientX || 0) - startX; if (Math.abs(delta) < 44) return; const images = lectureImages(state.galleryLecture); if (delta < 0 && state.galleryIndex < images.length - 1) moveGallery(1); if (delta > 0 && state.galleryIndex > 0) moveGallery(-1); }, { passive: true });
    document.addEventListener('keydown', (event) => {
      if (gallery.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); closeGallery(); return; }
      if (event.key === 'ArrowLeft' && state.galleryIndex > 0) { event.preventDefault(); moveGallery(-1); }
      if (event.key === 'ArrowRight' && state.galleryIndex < lectureImages(state.galleryLecture).length - 1) { event.preventDefault(); moveGallery(1); }
      if (event.key !== 'Tab') return;
      const focusable = [...gallery.querySelectorAll('button:not(:disabled)')]; const first = focusable[0]; const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }
  function renderVideos() {
    const videos = [...(data.youtubeVideos || [])].filter((video) => video.visible !== false);
    document.getElementById('videoGrid').innerHTML = videos.map((video) => {
      const id = String(video.link || '').match(/(?:youtu\.be\/|v=|live\/|shorts\/)([\w-]{11})/)?.[1];
      const localImage = assetUrl(video.images?.[0] || video.image); const image = localImage || (id ? 'https://img.youtube.com/vi/' + id + '/maxresdefault.jpg' : ''); const link = externalUrl(video.link);
      const fallback = !localImage && id ? ' data-youtube-id="' + escapeHtml(id) + '"' : '';
      const media = image ? `<a class="media-frame media-frame--landscape" href="${escapeHtml(link)}" target="_blank" rel="noopener"><img src="${escapeHtml(image)}"${fallback} width="1280" height="720" alt="${escapeHtml(video.title)} 영상 썸네일" loading="lazy" referrerpolicy="no-referrer"><span class="media-frame__caption">Watch ↗</span></a>` : '';
      return `<article class="video-card" data-video-slide>${media}<h3 class="video-card__title">${escapeHtml(video.title)}</h3></article>`;
    }).join('');
    document.querySelectorAll('img[data-youtube-id]').forEach((image) => image.addEventListener('error', () => { image.src = 'https://img.youtube.com/vi/' + image.dataset.youtubeId + '/hqdefault.jpg'; }, { once: true }));
  }

  function bindCarousel() {
    const viewport = document.getElementById('videoViewport'); const slides = [...document.querySelectorAll('[data-video-slide]')]; const track = document.getElementById('videoGrid'); const status = document.getElementById('videoStatus'); const progress = document.getElementById('videoProgressFill'); const previous = document.getElementById('videoPrev'); const next = document.getElementById('videoNext'); const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const visibleCount = () => { if (!slides[0]) return 0; const gap = parseFloat(getComputedStyle(track).gap) || 0; return Math.max(1, Math.round((viewport.clientWidth + gap) / (slides[0].getBoundingClientRect().width + gap))); };
    const lastStart = () => Math.max(0, slides.length - visibleCount());
    const update = (index, move = true) => {
      state.videoIndex = Math.max(0, Math.min(index, lastStart())); const end = Math.min(slides.length, state.videoIndex + visibleCount());
      status.textContent = end === state.videoIndex + 1 ? pad(end) + ' / ' + pad(slides.length) : pad(state.videoIndex + 1) + '—' + pad(end) + ' / ' + pad(slides.length);
      progress.style.width = (slides.length ? ((state.videoIndex + 1) / slides.length) * 100 : 0) + '%'; previous.disabled = state.videoIndex === 0; next.disabled = state.videoIndex >= lastStart();
      if (move && slides[state.videoIndex]) viewport.scrollTo({ left: slides[state.videoIndex].offsetLeft, behavior: reduced.matches ? 'auto' : 'smooth' });
    };
    previous.addEventListener('click', () => update(state.videoIndex - 1)); next.addEventListener('click', () => update(state.videoIndex + 1));
    viewport.addEventListener('keydown', (event) => { if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); update(state.videoIndex + (event.key === 'ArrowRight' ? 1 : -1)); });
    let frame = 0; viewport.addEventListener('scroll', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { const candidates = slides.slice(0, lastStart() + 1); const nearest = candidates.reduce((best, slide, index) => Math.abs(slide.offsetLeft - viewport.scrollLeft) < Math.abs(candidates[best].offsetLeft - viewport.scrollLeft) ? index : best, 0); update(nearest, false); }); }, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(() => requestAnimationFrame(() => update(state.videoIndex, false))).observe(viewport); update(0, false);
  }
  document.getElementById('lectureTopics').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-topic]'); if (!button) return;
    state.topic = button.dataset.topic; state.activeLectureId = ''; renderTopics(state.topic); renderLectures();
  });
  document.getElementById('lectureLedger').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-lecture-id]'); if (!button) return;
    const lecture = data.lectures.find((item) => item.id === button.dataset.lectureId); state.activeLectureId = button.dataset.lectureId;
    if (openGallery(lecture, button)) return; renderLectures(); requestAnimationFrame(() => document.querySelector(`[data-lecture-id="${CSS.escape(state.activeLectureId)}"]`)?.focus());
  });
  document.getElementById('lectureMore').addEventListener('click', () => { state.topic = state.topic === 'all' ? 'selected' : 'all'; state.activeLectureId = ''; renderTopics(); renderLectures(); document.getElementById('lectureLedger').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); });
  window.addEventListener('storage', (event) => { if (event.key !== ProfileLectureStore.key) return; state.activeLectureId = ''; renderTopics(); renderLectures(); });
  window.addEventListener('profileDraft:lectureCuration', () => { state.activeLectureId = ''; renderTopics(); renderLectures(); });
  renderTopics(); renderLectures(); renderVideos(); bindCarousel(); bindGallery();
});
