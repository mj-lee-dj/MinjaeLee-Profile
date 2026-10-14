(() => {
  const topics = Object.freeze([
    { id: 'AI', label: 'AI', description: '생성형 AI · 수업 설계' },
    { id: 'Google', label: 'Google', description: 'Google 도구 · Gemini · NotebookLM' },
    { id: 'Canva·에듀테크', label: 'Canva·에듀테크', description: '시각 자료 · 디지털 도구' },
    { id: '교사 업무·학급경영', label: '교사 업무·학급경영', description: '업무 효율 · 교실 운영' },
    { id: '학부모·학생 강의', label: '학부모·학생 강의', description: '디지털 이해 · 활용 교육' },
    { id: '강사코칭', label: '강사코칭', description: '강의 설계 · 강사 역량' },
  ]);
  const topicOf = (item) => topics.some((topic) => topic.id === item.topic)
    ? item.topic : window.ProfileContentStore?.inferLectureTopic(item) || 'AI';
  const visibleLectures = (data, hidden = []) => {
    const hiddenIds = new Set(hidden);
    return (data.lectures || []).filter((item) => item.visible !== false && !hiddenIds.has(item.id));
  };
  function categoryPage(data, topic, page = 0, pageSize = 2, hidden = []) {
    const records = visibleLectures(data, hidden).filter((item) => topicOf(item) === topic);
    const size = Math.max(1, Math.floor(Number(pageSize) || 2));
    const pages = Math.ceil(records.length / size);
    const current = Math.min(Math.max(0, Math.floor(Number(page) || 0)), Math.max(0, pages - 1));
    const offset = current * size;
    return { items: records.slice(offset, offset + size), total: records.length, page: current, pages,
      start: records.length ? offset + 1 : 0, end: Math.min(offset + size, records.length) };
  }
  function summary(data, hidden = []) {
    const records = visibleLectures(data, hidden);
    const years = records.map((item) => Number(String(item.year || '').match(/\d{4}/)?.[0])).filter(Number.isFinite);
    return { total: records.length, topics: topics.length, years: years.length ? [Math.min(...years), Math.max(...years)] : [] };
  }
  window.ProfileLectureArchiveModel = Object.freeze({ topics, visibleLectures, categoryPage, summary });

  document.addEventListener('DOMContentLoaded', () => {
    const archive = document.getElementById('lectureAccordion');
    if (!archive) return;
    const mobile = matchMedia('(max-width: 640px)');
    const state = { topic: '', pages: {} };
    const escape = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
    const pad = (value) => String(value).padStart(2, '0');
    const asset = (value) => /^(?:uploads\/|assets\/|https?:\/\/|data:image\/(?:png|jpeg|webp|gif);base64,)/i.test(String(value || '')) ? String(value) : '';
    const images = (item) => [...new Set([...(item.images || []), item.image].map(asset).filter(Boolean))];
    const icon = (direction) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${direction === 'prev' ? 'M19 12H5m6-6-6 6 6 6' : 'M5 12h14m-6-6 6 6-6 6'}"/></svg>`;
    const hidden = () => window.ProfileLectureStore.load().hidden;
    const pageSize = () => mobile.matches ? 2 : 4;
    const focus = (id, reveal = false) => requestAnimationFrame(() => {
      const target = document.getElementById(id);
      if (target && !target.disabled) {
        target.focus({ preventScroll: true });
        const bounds = target.getBoundingClientRect();
        if (reveal && (bounds.top < 80 || bounds.bottom > window.innerHeight)) target.scrollIntoView({ block: 'start', behavior: 'auto' });
      }
    });
    function row(item) {
      const gallery = images(item);
      const thumbnail = gallery.length ? `<span class="lecture-accordion__thumb"><img src="${escape(gallery[0])}" alt="" width="160" height="90" loading="lazy"><span class="lecture-accordion__image-count" aria-hidden="true"><svg viewBox="0 0 16 16"><rect x="2" y="4" width="10" height="9"/><path d="M5 1h10v9"/></svg>${gallery.length}</span></span>` : '';
      return `<li><button class="lecture-accordion__record" type="button" data-record-id="${escape(item.id)}" aria-label="${escape(item.title)} 강의 자료 보기"><span class="lecture-accordion__record-text"><span class="lecture-accordion__record-title">${escape(item.title)}</span><span class="lecture-accordion__record-meta">${escape(item.org)}</span></span>${thumbnail}</button></li>`;
    }
    function render(focusId = '') {
      const excluded = hidden();
      const totals = summary(profileData, excluded);
      document.getElementById('lectureArchiveCount').textContent = totals.total;
      document.getElementById('lectureArchiveFields').textContent = `${totals.topics}개 분야`;
      document.getElementById('lectureArchiveYears').textContent = totals.years.length ? [...new Set(totals.years)].join('–') : '';
      document.getElementById('lectureArchiveGuide').textContent = `여섯 가지 분야, ${totals.total}개의 기록.`;
      document.getElementById('lectureArchiveHint').hidden = Boolean(state.topic);
      document.getElementById('lectureArchiveFooter').hidden = Boolean(state.topic);
      archive.classList.toggle('has-open-category', Boolean(state.topic));
      archive.innerHTML = topics.map((topic, index) => {
        const opened = state.topic === topic.id;
        const page = categoryPage(profileData, topic.id, state.pages[topic.id] || 0, pageSize(), excluded);
        state.pages[topic.id] = page.page;
        const headingId = `lecture-category-${index}`;
        const panelId = `lecture-panel-${index}`;
        const body = opened ? `<div class="lecture-accordion__range"><span>${escape(topic.label)} 분야 강의</span><span>${page.total}건 중 ${page.start}–${page.end}</span></div><ol class="lecture-accordion__records">${page.items.map(row).join('')}</ol><div class="lecture-accordion__pagination"><output aria-live="polite" aria-atomic="true">${page.start}–${page.end} / ${page.total}건</output><div><button id="${panelId}-prev" type="button" data-page="prev" aria-label="${escape(topic.label)} 이전 강의" ${page.page === 0 ? 'disabled' : ''}>${icon('prev')}</button><button id="${panelId}-next" type="button" data-page="next" aria-label="${escape(topic.label)} 다음 강의" ${page.page >= page.pages - 1 ? 'disabled' : ''}><span>다음 ${Math.min(pageSize(), Math.max(0, page.total - page.end)) || pageSize()}건</span>${icon('next')}</button></div></div>` : '';
        return `<section class="lecture-accordion__category${opened ? ' is-open' : ''}"><h3><button class="lecture-accordion__trigger" id="${headingId}" type="button" data-category="${index}" aria-expanded="${opened}" aria-controls="${panelId}"><span class="lecture-accordion__category-text"><span class="lecture-accordion__category-title">${escape(topic.label)}</span>${!state.topic ? `<span class="lecture-accordion__description">${escape(topic.description)}</span>` : ''}</span><span class="lecture-accordion__count" aria-label="${page.total}건">${pad(page.total)}</span><svg class="lecture-accordion__toggle" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14${opened ? '' : 'M12 5v14'}"/></svg></button></h3><div id="${panelId}" class="lecture-accordion__panel" role="region" aria-labelledby="${headingId}" ${opened ? '' : 'hidden'}>${body}</div></section>`;
      }).join('');
      if (focusId) focus(focusId, true);
    }
    archive.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-category]');
      if (trigger) {
        const topic = topics[Number(trigger.dataset.category)];
        state.topic = state.topic === topic.id ? '' : topic.id;
        render(trigger.id);
        return;
      }
      const pager = event.target.closest('[data-page]');
      if (pager && !pager.disabled) {
        const next = pager.dataset.page === 'next';
        state.pages[state.topic] = (state.pages[state.topic] || 0) + (next ? 1 : -1);
        const id = pager.id;
        render();
        const control = document.getElementById(id);
        focus(control?.disabled ? id.replace(next ? '-next' : '-prev', next ? '-prev' : '-next') : id);
        return;
      }
      const record = event.target.closest('[data-record-id]');
      if (record) {
        const lecture = visibleLectures(profileData, hidden()).find((item) => item.id === record.dataset.recordId);
        if (lecture) window.ProfileLectureGallery.open(lecture, record);
      }
    });
    archive.addEventListener('keydown', (event) => {
      const trigger = event.target.closest('[data-category]');
      if (!trigger || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = Number(trigger.dataset.category);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? topics.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + topics.length) % topics.length;
      document.getElementById(`lecture-category-${next}`).focus();
    });
    mobile.addEventListener('change', () => { state.pages = {}; render(); });
    window.addEventListener('profileDraft:lectureCuration', () => render());
    window.addEventListener('profileDraft:content', () => render());
    render();
  });
})();
