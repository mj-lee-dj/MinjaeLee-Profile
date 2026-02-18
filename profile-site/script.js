/**
 * 이민재 포트폴리오 — Netflix-Style 렌더링 & 인터랙션
 */
document.addEventListener('DOMContentLoaded', () => {
  const D = profileData;

  /* ═══ 히어로 ═══ */
  const badgesWrap = document.getElementById('heroBadges');
  D.personal.credentials.forEach(c => {
    const el = document.createElement('span');
    el.className = 'hero-badge';
    el.textContent = c;
    badgesWrap.appendChild(el);
  });

  /* 통계 바 */
  const lecCount = D.lectures.length;
  const pubCount = D.publications.length;
  const awardCount = D.awards.length;
  const pressCount = D.press.length;
  const stats = [
    { val: lecCount, suf: '건+', label: '강의·연수' },
    { val: pubCount, suf: '권', label: '출판 저서' },
    { val: awardCount, suf: '건', label: '수상 경력' },
    { val: pressCount, suf: '건', label: '보도 자료' }
  ];
  const heroStats = document.getElementById('heroStats');
  const statRow = document.createElement('div');
  statRow.className = 'stat-row';
  stats.forEach(s => {
    const item = document.createElement('div');
    item.className = 'stat-item';
    item.innerHTML = `<div class="stat-val" data-t="${s.val}" data-s="${s.suf}">0${s.suf}</div><div class="stat-label">${s.label}</div>`;
    statRow.appendChild(item);
  });
  heroStats.appendChild(statRow);

  /* 카운트업 */
  function countUp(el) {
    const target = +el.dataset.t, suf = el.dataset.s;
    const dur = 1400, start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  // 페이지 로드 시 바로 트리거
  setTimeout(() => {
    heroStats.querySelectorAll('.stat-val').forEach(countUp);
  }, 600);

  /* ═══ ABOUT ═══ */
  document.getElementById('aboutBio').textContent = D.personal.bio;
  const credList = document.getElementById('credentialList');
  D.personal.credentials.forEach(c => {
    const el = document.createElement('div');
    el.className = 'credential-item reveal';
    el.innerHTML = `<span class="credential-dot"></span>${c}`;
    credList.appendChild(el);
  });

  /* 전문분야 */
  const expRow = document.getElementById('expertiseRow');
  D.expertise.forEach(e => {
    const chip = document.createElement('span');
    chip.className = 'exp-chip';
    chip.textContent = e;
    expRow.appendChild(chip);
  });

  /* ═══ 이미지 갤러리 헬퍼 ═══ */
  /* OG 이미지 캐시 (localStorage) */
  let ogCache = {};
  try { ogCache = JSON.parse(localStorage.getItem('ogImageCache') || '{}'); } catch (e) { }
  function saveOgCache() { try { localStorage.setItem('ogImageCache', JSON.stringify(ogCache)); } catch (e) { } }

  function getItemImages(item) {
    if (item.images && item.images.length) return item.images;
    if (item.image) return [item.image];
    /* YouTube 링크에서 자동 썸네일 */
    if (item.link) {
      const m = item.link.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
      if (m) return [`https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`];
      /* 캐시에 OG 이미지가 있으면 사용 */
      if (ogCache[item.link]) return [ogCache[item.link]];
    }
    return [];
  }

  /* 링크가 있지만 이미지가 없는 모든 항목에 대해 OG 이미지 자동 가져오기 */
  async function autoFetchOgImages() {
    const allItems = [...D.publications, ...D.lectures, ...D.press, ...D.onlineCourses];
    const needsFetch = allItems.filter(item => {
      if (!item.link) return false;
      if (item.images && item.images.length) return false;
      if (item.image) return false;
      /* YouTube는 이미 자동 처리됨 */
      if (/youtu\.?be/.test(item.link)) return false;
      /* 이미 캐시에 있으면 스킵 */
      if (ogCache[item.link]) return false;
      return true;
    });

    if (!needsFetch.length) return;

    /* 병렬로 최대 5개씩 가져오기 */
    for (let i = 0; i < needsFetch.length; i += 5) {
      const batch = needsFetch.slice(i, i + 5);
      await Promise.allSettled(batch.map(async item => {
        try {
          const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(item.link)}`);
          const json = await res.json();
          if (json.status === 'success' && json.data?.image?.url) {
            ogCache[item.link] = json.data.image.url;
            /* 해당 카드의 .press-icon 또는 빈 갤러리를 이미지로 교체 */
            updateCardImage(item, json.data.image.url);
          }
        } catch (e) { /* 실패 시 무시 */ }
      }));
      saveOgCache();
    }
  }

  /* 카드에 동적으로 이미지 삽입 */
  function updateCardImage(item, imgUrl) {
    /* 해당 아이템의 카드를 찾아서 이미지 삽입 */
    const cards = document.querySelectorAll('[data-item-id="' + item.id + '"]');
    cards.forEach(card => {
      const icon = card.querySelector('.press-icon');
      if (icon) {
        const gallery = document.createElement('div');
        gallery.className = 'card-gallery';
        gallery.innerHTML = `<img src="${imgUrl}" alt="" onerror="this.parentElement.remove()"/>`;
        icon.replaceWith(gallery);
      }
      /* 이미지가 없는 카드에 갤러리 삽입 */
      if (!card.querySelector('.card-gallery')) {
        const gallery = document.createElement('div');
        gallery.className = 'card-gallery';
        gallery.innerHTML = `<img src="${imgUrl}" alt="" onerror="this.parentElement.remove()"/>`;
        card.prepend(gallery);
      }
    });
  }

  function imgGalleryHTML(images, alt) {
    if (!images.length) return '';
    if (images.length === 1) {
      return `<div class="card-gallery"><img src="${images[0]}" alt="${alt}" onerror="this.parentElement.remove()"/></div>`;
    }
    const id = 'g_' + Math.random().toString(36).slice(2, 8);
    return `
      <div class="card-gallery multi" id="${id}">
        ${images.map((img, i) => `<img src="${img}" alt="${alt} ${i + 1}" class="${i === 0 ? 'active' : ''}" onerror="this.remove()"/>`).join('')}
        <button class="gal-prev" onclick="slideGallery('${id}',-1)">‹</button>
        <button class="gal-next" onclick="slideGallery('${id}',1)">›</button>
        <div class="gal-dots">${images.map((_, i) => `<span class="gal-dot${i === 0 ? ' active' : ''}" onclick="goSlide('${id}',${i})"></span>`).join('')}</div>
      </div>
    `;
  }

  /* 갤러리 전역 함수 */
  window.slideGallery = function (id, dir) {
    const el = document.getElementById(id); if (!el) return;
    const imgs = el.querySelectorAll('img');
    const dots = el.querySelectorAll('.gal-dot');
    let cur = [...imgs].findIndex(i => i.classList.contains('active'));
    imgs[cur]?.classList.remove('active'); dots[cur]?.classList.remove('active');
    cur = (cur + dir + imgs.length) % imgs.length;
    imgs[cur]?.classList.add('active'); dots[cur]?.classList.add('active');
  };
  window.goSlide = function (id, idx) {
    const el = document.getElementById(id); if (!el) return;
    el.querySelectorAll('img').forEach((img, i) => img.classList.toggle('active', i === idx));
    el.querySelectorAll('.gal-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
  };

  /* ═══ 저서 ═══ */
  const pubRow = document.getElementById('pubRow');
  D.publications.forEach(p => {
    const card = document.createElement('div');
    card.className = 'pub-card reveal';
    card.setAttribute('data-item-id', p.id);
    const imgs = getItemImages(p);
    card.innerHTML = `
      ${imgGalleryHTML(imgs, p.title)}
      <span class="pub-year">${p.year}</span>
      <h3 class="pub-title">${p.title}</h3>
      <p class="pub-publisher">${p.publisher}</p>
      <p class="pub-desc">${p.previewDesc || p.description}</p>
      <div class="pub-tags">${(p.tags || []).map(t => `<span class="pub-tag">${t}</span>`).join('')}</div>
      ${p.link ? `<a href="${p.link}" target="_blank" class="pub-link">자세히 보기 →</a>` : ''}
    `;
    pubRow.appendChild(card);
  });

  const courseRow = document.getElementById('courseRow');
  D.onlineCourses.forEach(c => {
    const card = document.createElement('div');
    card.className = 'course-card reveal';
    card.setAttribute('data-item-id', c.id);
    const imgs = getItemImages(c);
    card.innerHTML = `
      ${imgs.length ? imgGalleryHTML(imgs, c.title) : '<div class="course-icon">🎥</div>'}
      <div class="course-body">
        <div class="course-title">${c.title}</div>
        <div class="course-meta">${c.platform} · ${c.credit}</div>
      </div>
      ${c.link ? `<a href="${c.link}" target="_blank" class="course-link">수강하기 →</a>` : ''}
    `;
    if (c.link && !imgs.length) { card.style.cursor = 'pointer'; card.onclick = (e) => { if (e.target.tagName !== 'A') window.open(c.link, '_blank'); }; }
    courseRow.appendChild(card);
  });

  /* ═══ 강의 (필터) ═══ */
  const categories = ['전체', ...new Set(D.lectures.map(l => l.category))];
  const filterBar = document.getElementById('filterBar');
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `filter-btn${cat === '전체' ? ' active' : ''}`;
    btn.textContent = cat;
    btn.onclick = () => {
      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLectures(cat === '전체' ? null : cat);
    };
    filterBar.appendChild(btn);
  });

  const lecGrid = document.getElementById('lecGrid');
  function renderLectures(filter) {
    lecGrid.innerHTML = '';
    const items = filter ? D.lectures.filter(l => l.category === filter) : D.lectures;
    items.forEach((l, i) => {
      const card = document.createElement('div');
      card.className = `lec-card${l.highlight ? ' hl' : ''}`;
      card.setAttribute('data-item-id', l.id);
      const imgs = getItemImages(l);
      card.innerHTML = `
        ${imgGalleryHTML(imgs, l.title)}
        <div class="lec-header">
          <div class="lec-title">${l.title}</div>
          <span class="lec-year">${l.year}</span>
        </div>
        ${l.org ? `<div class="lec-org">${l.org}</div>` : ''}
        ${l.previewDesc ? `<div class="lec-preview-desc">${l.previewDesc}</div>` : ''}
        <span class="lec-cat">${l.category}</span>
        ${l.link ? `<a href="${l.link}" target="_blank" class="lec-link">관련 자료 →</a>` : ''}
      `;
      card.style.opacity = '0'; card.style.transform = 'translateY(14px)';
      lecGrid.appendChild(card);
      requestAnimationFrame(() => {
        setTimeout(() => {
          card.style.transition = 'opacity .3s ease, transform .3s ease';
          card.style.opacity = '1'; card.style.transform = 'translateY(0)';
        }, i * 35);
      });
    });
  }
  renderLectures(null);

  /* ═══ 수상·활동 ═══ */
  const aList = document.getElementById('awardsList');
  [...D.awards].sort((a, b) => b.year - a.year).forEach(a => {
    const el = document.createElement('div');
    el.className = `award-item reveal${a.highlight ? ' gold' : ''}`;
    el.innerHTML = `<div class="award-year">${a.year}</div><div class="award-title">${a.title}</div>${a.org ? `<div class="award-org">${a.org}</div>` : ''}`;
    aList.appendChild(el);
  });

  const actList = document.getElementById('actList');
  D.activities.forEach(a => {
    const el = document.createElement('div');
    el.className = 'act-item reveal';
    el.innerHTML = `${a.period ? `<div class="act-period">${a.period}</div>` : ''}<div class="act-title">${a.title}</div>`;
    actList.appendChild(el);
  });

  /* ═══ 보도 ═══ */
  const pList = document.getElementById('pressList');
  D.press.forEach(p => {
    const card = document.createElement('div');
    card.className = 'press-card reveal';
    card.setAttribute('data-item-id', p.id);
    const imgs = getItemImages(p);
    const hasVisual = imgs.length > 0;
    card.innerHTML = `
      ${hasVisual ? imgGalleryHTML(imgs, p.title) : '<div class="press-icon">📰</div>'}
      <div class="press-body">
        <div class="press-title">${p.title}</div>
        ${p.previewDesc ? `<div class="press-preview-desc">${p.previewDesc}</div>` : ''}
        <div class="press-meta"><span>${p.source}</span><span>${p.date}</span></div>
      </div>
      ${p.link ? `<a href="${p.link}" target="_blank" class="press-link">기사 보기 →</a>` : ''}
    `;
    pList.appendChild(card);
  });

  /* ═══ CONTACT ═══ */
  const cg = document.getElementById('contactGrid');
  const ct = D.personal.contact;
  cg.innerHTML = `
    <div class="c-item"><span class="ci">📞</span>${ct.tel}</div>
    <div class="c-item"><span class="ci">✉️</span><a href="mailto:${ct.email}">${ct.email}</a></div>
  `;
  const cs = document.getElementById('contactSocials');
  cs.innerHTML = `
    <a href="${ct.instagram}" target="_blank" class="soc-btn" title="Instagram">📷</a>
    <a href="${ct.youtube}" target="_blank" class="soc-btn" title="YouTube">▶️</a>
    <a href="mailto:${ct.email}" class="soc-btn" title="Email">✉️</a>
  `;

  /* ═══ 네비게이션 ═══ */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  /* 모바일 메뉴 */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  hamburger.onclick = () => { hamburger.classList.toggle('open'); navLinks.classList.toggle('open'); };
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    hamburger.classList.remove('open'); navLinks.classList.remove('open');
  }));

  /* ═══ Reveal on Scroll ═══ */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  /* 네비 액티브 표시 */
  const sections = document.querySelectorAll('section[id]');
  const navAs = document.querySelectorAll('.nav-links a:not(.nav-cta)');
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navAs.forEach(a => { a.style.color = a.getAttribute('href') === `#${e.target.id}` ? '#fff' : ''; });
      }
    });
  }, { threshold: 0.25 });
  sections.forEach(s => secObs.observe(s));

  /* ═══ 링크 항목 OG 이미지 자동 가져오기 ═══ */
  autoFetchOgImages();
});
