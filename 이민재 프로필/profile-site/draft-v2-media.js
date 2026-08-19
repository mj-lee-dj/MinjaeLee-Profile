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
  const state = { topic: 'selected', expanded: false, activeLectureId: '', videoIndex: 0 };
  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const assetUrl = (value) => { const candidate = String(value ?? ''); return candidate.startsWith('uploads/') || candidate.startsWith('assets/') || candidate.startsWith('https://') || candidate.startsWith('http://') || ['data:image/png;base64,', 'data:image/jpeg;base64,', 'data:image/webp;base64,', 'data:image/gif;base64,'].some((prefix) => candidate.startsWith(prefix)) ? candidate : ''; };
  const externalUrl = (value) => /^https?:\/\//i.test(String(value ?? '')) ? String(value) : '';

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

  function lectureImages(lecture) {
    return [...new Set([...(lecture?.images || []), lecture?.image].map(assetUrl).filter(Boolean))];
  }

  function curatedLectures() {
    const curation = ProfileLectureStore.load();
    if (state.topic === 'selected') {
      return curation.highlights.map((id) => data.lectures.find((lecture) => lecture.id === id)).filter((lecture) => lecture && lecture.visible !== false);
    }
    const hidden = new Set(curation.hidden);
    return data.lectures.filter((lecture) => lecture.visible !== false && !hidden.has(lecture.id) && lectureTopic(lecture) === state.topic);
  }

  function topics() {
    return [{ id: 'selected', label: ProfileLectureStore.load().label }, ...fixedTopics];
  }

  function renderTopics(focusId = '') {
    const target = document.getElementById('lectureTopics');
    target.innerHTML = topics().map((topic) => `<button class="topic-index__button" type="button" data-topic="${escapeHtml(topic.id)}" aria-pressed="${topic.id === state.topic}">${escapeHtml(topic.label)}</button>`).join('');
    if (focusId) requestAnimationFrame(() => target.querySelector(`[data-topic="${CSS.escape(focusId)}"]`)?.focus());
  }

  function renderShowcase(lecture) {
    const target = document.getElementById('lectureShowcase');
    const images = lectureImages(lecture).slice(0, 3);
    if (!lecture || images.length === 0) {
      target.innerHTML = '<div class="lecture-showcase__empty"><p>이 강의의 대표 슬라이드를 준비하고 있습니다.</p></div>';
      return;
    }
    target.innerHTML = `<div class="lecture-showcase__heading"><p class="eyebrow">Slide study / 01—${String(images.length).padStart(2, '0')}</p><h3>${escapeHtml(lecture.title)}</h3></div>
      <div class="lecture-showcase" data-count="${images.length}">
        ${images.map((image, index) => `<figure class="lecture-showcase__slide"><img src="${escapeHtml(image)}" width="1280" height="720" alt="${escapeHtml(lecture.title)} 대표 슬라이드 ${index + 1}" loading="lazy"><figcaption>${String(index + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}</figcaption></figure>`).join('')}
      </div>`;
  }

  function renderLectures() {
    const matches = curatedLectures();
    const shown = state.expanded ? matches : matches.slice(0, 5);
    if (!shown.some((lecture) => lecture.id === state.activeLectureId)) state.activeLectureId = shown[0]?.id || '';
    document.getElementById('lectureLedger').innerHTML = shown.map((lecture) => `
      <li class="lecture-ledger__item">
        <button class="lecture-ledger__button" type="button" data-lecture-id="${escapeHtml(lecture.id)}" ${lecture.id === state.activeLectureId ? 'aria-current="true"' : ''}>
          <span class="lecture-ledger__year">${escapeHtml(lecture.year)}</span>
          <span class="lecture-ledger__title">${escapeHtml(lecture.title)}</span>
          <span class="lecture-ledger__org">${escapeHtml(lecture.org)}</span>
        </button>
      </li>`).join('') || '<li class="lecture-ledger__item"><p class="lecture-ledger__empty">이 주제의 기록을 준비하고 있습니다.</p></li>';
    renderShowcase(shown.find((lecture) => lecture.id === state.activeLectureId));
    const more = document.getElementById('lectureMore');
    more.hidden = state.topic === 'selected' || matches.length <= 5;
    more.firstChild.textContent = state.expanded ? '대표 기록만 보기 ' : `전체 ${matches.length}개 기록 보기 `;
  }

  function renderVideos() {
    const videos = [...(data.youtubeVideos || [])].filter((video) => video.visible !== false);
    document.getElementById('videoGrid').innerHTML = videos.map((video) => {
      const id = String(video.link || '').match(/(?:youtu\.be\/|v=|live\/|shorts\/)([\w-]{11})/)?.[1];
      const localImage = assetUrl(video.images?.[0] || video.image);
      const image = localImage || (id ? 'https://img.youtube.com/vi/' + id + '/maxresdefault.jpg' : '');
      const link = externalUrl(video.link);
      const fallback = !localImage && id ? ' data-youtube-id="' + escapeHtml(id) + '"' : '';
      const media = image ? `<a class="media-frame media-frame--landscape" href="${escapeHtml(link)}" target="_blank" rel="noopener"><img src="${escapeHtml(image)}"${fallback} width="1280" height="720" alt="${escapeHtml(video.title)} 영상 썸네일" loading="lazy" referrerpolicy="no-referrer"><span class="media-frame__caption">Watch ↗</span></a>` : '';
      return `<article class="video-card" data-video-slide>${media}<h3 class="video-card__title">${escapeHtml(video.title)}</h3></article>`;
    }).join('');
    document.querySelectorAll('img[data-youtube-id]').forEach((image) => image.addEventListener('error', () => {
      image.src = 'https://img.youtube.com/vi/' + image.dataset.youtubeId + '/hqdefault.jpg';
    }, { once: true }));
  }

  function bindCarousel() {
    const viewport = document.getElementById('videoViewport');
    const slides = [...document.querySelectorAll('[data-video-slide]')];
    const track = document.getElementById('videoGrid');
    const status = document.getElementById('videoStatus');
    const previous = document.getElementById('videoPrev');
    const next = document.getElementById('videoNext');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const pad = (value) => String(value).padStart(2, '0');
    const visibleCount = () => {
      if (!slides[0]) return 0;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      return Math.max(1, Math.round((viewport.clientWidth + gap) / (slides[0].getBoundingClientRect().width + gap)));
    };
    const lastStart = () => Math.max(0, slides.length - visibleCount());
    const update = (index, move = true) => {
      state.videoIndex = Math.max(0, Math.min(index, lastStart()));
      const end = Math.min(slides.length, state.videoIndex + visibleCount());
      status.textContent = end === state.videoIndex + 1
        ? pad(end) + ' / ' + pad(slides.length)
        : pad(state.videoIndex + 1) + '—' + pad(end) + ' / ' + pad(slides.length);
      previous.disabled = state.videoIndex === 0;
      next.disabled = state.videoIndex >= lastStart();
      if (move && slides[state.videoIndex]) {
        viewport.scrollTo({ left: slides[state.videoIndex].offsetLeft, behavior: reduced.matches ? 'auto' : 'smooth' });
      }
    };
    previous.addEventListener('click', () => update(state.videoIndex - 1));
    next.addEventListener('click', () => update(state.videoIndex + 1));
    viewport.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      update(state.videoIndex + (event.key === 'ArrowRight' ? 1 : -1));
    });
    let frame = 0;
    viewport.addEventListener('scroll', () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const candidates = slides.slice(0, lastStart() + 1);
        const nearest = candidates.reduce((best, slide, index) => Math.abs(slide.offsetLeft - viewport.scrollLeft) < Math.abs(candidates[best].offsetLeft - viewport.scrollLeft) ? index : best, 0);
        update(nearest, false);
      });
    }, { passive: true });
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => requestAnimationFrame(() => update(state.videoIndex, false))).observe(viewport);
    }
    update(0, false);
  }

  document.getElementById('lectureTopics').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-topic]');
    if (!button) return;
    state.topic = button.dataset.topic;
    state.expanded = false;
    state.activeLectureId = '';
    renderTopics(state.topic);
    renderLectures();
  });
  document.getElementById('lectureLedger').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-lecture-id]');
    if (!button) return;
    state.activeLectureId = button.dataset.lectureId;
    renderLectures();
    requestAnimationFrame(() => document.querySelector(`[data-lecture-id="${CSS.escape(state.activeLectureId)}"]`)?.focus());
  });
  document.getElementById('lectureMore').addEventListener('click', () => {
    state.expanded = !state.expanded;
    renderLectures();
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== ProfileLectureStore.key) return;
    state.activeLectureId = '';
    renderTopics();
    renderLectures();
  });
  renderTopics();
  renderLectures();
  renderVideos();
  bindCarousel();
});
