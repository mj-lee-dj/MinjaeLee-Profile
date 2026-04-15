/**
 * 이민재 포트폴리오 — Netflix-Style 렌더링 & 인터랙션
 */
document.addEventListener('DOMContentLoaded', async () => {
  let D = profileData; // data.js의 기본값

  // 로컬 스토리지 연동 로직 제거 (캐시 충돌 방지)

  /* [구글 시트 연동] URL이 있으면 시트 데이터 가져오기 */
  if (typeof GAS_API_URL !== 'undefined' && GAS_API_URL) {
    try {
      const res = await fetch(GAS_API_URL);
      const json = await res.json();
      if (json && json.personal) { // 유효한 데이터인지 확인
        D = json;
        console.log('📦 Data loaded from Google Sheets');
      }
    } catch (e) {
      console.error('Failed to load data from Google Sheets:', e);
    }
  }

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
    { val: 100, suf: '건+', label: '강의·연수' },
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

  /* ═══ 헬퍼: 플레이스홀더 패턴 생성 (이미지 없을 때 시각적 요소 제공) ═══ */
  function getPlaceholder(type, title) {
    const chars = title ? title.charAt(0) : '';
    const colors = [
      ['#e53e3e', '#ed8936'], ['#4299e1', '#667eea'], ['#38b2ac', '#4fd1c5'],
      ['#ecc94b', '#d69e2e'], ['#9f7aea', '#b794f4'], ['#ed64a6', '#f687b3']
    ];
    // 제목 해시로 색상 결정
    const hash = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const [c1, c2] = colors[hash % colors.length];

    let icon = '';
    if (type === 'book') icon = '<rect x="30" y="20" width="40" height="60" rx="2" fill="rgba(255,255,255,0.2)"/><path d="M70 20c-5 0-10 2-10 2v60s5-2 10-2V20z" fill="rgba(0,0,0,0.2)"/>';
    if (type === 'video') icon = '<circle cx="50" cy="50" r="20" fill="rgba(255,255,255,0.2)"/><path d="M45 40l15 10-15 10z" fill="white"/>';
    if (type === 'news') icon = '<rect x="25" y="30" width="50" height="40" rx="2" fill="rgba(255,255,255,0.2)"/><rect x="30" y="38" width="20" height="4" rx="1" fill="rgba(255,255,255,0.4)"/><rect x="30" y="46" width="40" height="4" rx="1" fill="rgba(255,255,255,0.4)"/><rect x="30" y="54" width="40" height="4" rx="1" fill="rgba(255,255,255,0.4)"/>';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs><linearGradient id="grad${hash}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${c1};stop-opacity:1" /><stop offset="100%" style="stop-color:${c2};stop-opacity:1" /></linearGradient></defs>
      <rect width="100" height="100" fill="url(#grad${hash})" />
      ${icon}
      <text x="50" y="85" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-family="sans-serif" font-weight="bold" font-size="60" dy=".3em" style="display:${icon ? 'none' : 'block'}">${chars}</text>
    </svg>`;

    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  /* 정렬 로직: 주요이력(highlight) -> 연도(year) -> 썸네일(hasImage) -> 원본순서 */
  function compareItems(a, b) {
    // 1. Highlight
    if (!!a.highlight !== !!b.highlight) {
      return a.highlight ? -1 : 1;
    }
    // 2. Year (descending)
    if (a.year !== b.year) {
      return a.year > b.year ? -1 : 1;
    }
    // 3. Thumbnail (Has Image/Video)
    const hasImgA = getItemImages(a).length > 0;
    const hasImgB = getItemImages(b).length > 0;
    if (hasImgA !== hasImgB) {
      return hasImgA ? -1 : 1;
    }
    // 4. Original Order (Implicit stable sort)
    return 0;
  }

  /* ═══ 저서 ═══ */
  const pubRow = document.getElementById('pubRow');
  [...D.publications].sort(compareItems).forEach(p => {
    const card = document.createElement('div');
    card.className = 'pub-card reveal';
    card.setAttribute('data-item-id', p.id);
    const imgs = getItemImages(p);
    // 이미지가 없으면 플레이스홀더 사용
    const displayImgs = imgs.length ? imgs : [getPlaceholder('book', p.title)];

    card.innerHTML = `
      ${imgGalleryHTML(displayImgs, p.title)}
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
    const displayImgs = imgs.length ? imgs : [getPlaceholder('video', c.title)];

    card.innerHTML = `
      ${imgGalleryHTML(displayImgs, c.title)}
      <div class="course-body">
        <div class="course-title">${c.title}</div>
        <div class="course-meta">${c.platform} · ${c.credit}</div>
      </div>
      ${c.link ? `<a href="${c.link}" target="_blank" class="course-link">수강하기 →</a>` : ''}
    `;
    if (c.link) { card.style.cursor = 'pointer'; card.onclick = (e) => { if (e.target.tagName !== 'A') window.open(c.link, '_blank'); }; }
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
    let items = filter ? D.lectures.filter(l => l.category === filter) : [...D.lectures];

    // 정렬 적용
    items.sort(compareItems);

    items.forEach((l, i) => {
      const card = document.createElement('div');
      card.className = `lec-card${l.highlight ? ' hl' : ''}`;
      card.setAttribute('data-item-id', l.id);
      const imgs = getItemImages(l);
      /* 강의는 이미지가 없으면 굳이 플레이스홀더 쓰지 않고 깔끔하게 텍스트 위주로 감 (또는 필요시 추가) */
      /* 하지만 통일성을 위해 하이라이트 항목은 플레이스홀더 추가 가능 */
      const hasImg = imgs.length > 0;

      card.innerHTML = `
        ${hasImg ? imgGalleryHTML(imgs, l.title) : ''}
        <div class="lec-header">
          <div class="lec-title">${l.title}</div>
          <span class="lec-year">${l.year}</span>
        </div>
        ${l.org ? `<div class="lec-org">${l.org}</div>` : ''}
        ${l.previewDesc ? `<div class="lec-preview-desc">${l.previewDesc}</div>` : ''}
        <span class="lec-cat">${l.category}</span>
        ${l.link ? `<a href="${l.link}" target="_blank" class="lec-link">자료 보기 →</a>` : ''}
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
  [...D.awards].sort(compareItems).forEach(a => {
    const el = document.createElement('div');
    el.className = `award-item reveal${a.highlight ? ' gold' : ''}`;
    el.innerHTML = `<div class="award-year">${a.year}</div><div class="award-title">${a.title}</div>${a.org ? `<div class="award-org">${a.org}</div>` : ''}`;
    aList.appendChild(el);
  });

  const actList = document.getElementById('actList');
  D.activities.forEach(a => {
    const el = document.createElement('div');
    el.className = 'act-item reveal';
    el.innerHTML = `<div class="act-content">${a.period ? `<div class="act-period">${a.period}</div>` : ''}<div class="act-title">${a.title}</div></div>${a.link ? `<a href="${a.link}" target="_blank" class="act-link">보기</a>` : ''}`;
    actList.appendChild(el);
  });

  /* ═══ 보도 ═══ */
  const pList = document.getElementById('pressList');
  D.press.forEach(p => {
    const card = document.createElement('div');
    card.className = 'press-card reveal';
    card.setAttribute('data-item-id', p.id);
    const imgs = getItemImages(p);
    // 보도자료도 플레이스홀더 적용
    const displayImgs = imgs.length ? imgs : [getPlaceholder('news', p.title)];

    card.innerHTML = `
      ${imgGalleryHTML(displayImgs, p.title)}
      <div class="press-body">
        <div class="press-title">${p.title}</div>
        ${p.previewDesc ? `<div class="press-preview-desc">${p.previewDesc}</div>` : ''}
        <div class="press-meta"><span>${p.source}</span><span>${p.date}</span></div>
      </div>
      ${p.link ? `<a href="${p.link}" target="_blank" class="press-link">기사 보기 →</a>` : ''}
    `;
    if (p.link) { card.style.cursor = 'pointer'; card.onclick = (e) => { if (e.target.tagName !== 'A') window.open(p.link, '_blank'); }; }
    pList.appendChild(card);
  });

  /* ═══ 유튜브 영상 ═══ */
  function renderYoutubeVideos() {
    const container = document.getElementById('youtubeVideosContainer');
    if (!container) return; // index.html에 아직 요소가 없으면 패스

    const videos = D.youtubeVideos || [];
    if (videos.length === 0) {
      container.closest('section').style.display = 'none';
      return;
    }

    // 캐러셀 구조 생성
    const carouselId = 'yt_carousel_' + Math.random().toString(36).substr(2, 9);
    container.innerHTML = `
      <div class="yt-carousel-wrapper">
        <button class="yt-nav prev" onclick="slideYoutube('${carouselId}', -1)">‹</button>
        <div class="yt-carousel" id="${carouselId}">
          ${videos.map(v => {
      // 사용자 지정 썸네일 확인
      const thumbUrl = (v.images && v.images.length > 0 && v.images[0]) ? v.images[0] : getYouTubeThumbnail(v.link);
      return `
            <div class="yt-item">
              <div class="yt-thumb-wrap" onclick="window.open('${v.link}', '_blank')">
                <img src="${thumbUrl}" alt="${v.title}" style="object-fit:cover" />
                <div class="yt-play-icon">▶</div>
              </div>
              <div class="yt-info">
                <div class="yt-title">${v.title}</div>
              </div>
            </div>
            `;
    }).join('')}
        </div>
        <button class="yt-nav next" onclick="slideYoutube('${carouselId}', 1)">›</button>
      </div>
    `;
  }

  /* 유튜브 썸네일 추출 헬퍼 */
  function getYouTubeThumbnail(url) {
    if (!url) return '';
    // live/ 링크 지원 추가
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : '';
  }

  /* 유튜브 캐러셀 슬라이드 함수 (전역) */
  window.slideYoutube = function (id, dir) {
    const el = document.getElementById(id);
    if (!el) return;

    // 현재 스크롤 위치 기반으로 다음/이전 아이템으로 스크롤
    const itemWidth = el.querySelector('.yt-item')?.offsetWidth || 300;
    const gap = 16;
    const scrollAmount = itemWidth + gap;

    el.scrollBy({
      left: dir * scrollAmount * 3, // 3개씩 이동
      behavior: 'smooth'
    });
  };

  renderYoutubeVideos();

  /* ═══ CONTACT ═══ */
  const cg = document.getElementById('contactGrid');
  const ct = D.personal.contact;

  // 아이콘 SVG 문자열
  const iconMail = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="svg-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`;
  const iconInsta = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="svg-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01" /><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /></svg>`;
  const iconYoutube = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="svg-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
  const iconCamera = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="svg-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`;

  /* 전화번호 삭제, 이메일 강조 */
  cg.innerHTML = `
    <div class="c-item highlight">
      ${iconMail}
      <a href="mailto:${ct.email}">${ct.email}</a>
    </div>
  `;

  const cs = document.getElementById('contactSocials');
  cs.innerHTML = `
    <a href="${ct.instagram}" target="_blank" class="soc-btn" title="Instagram">${iconInsta}</a>
    <a href="${ct.youtube}" target="_blank" class="soc-btn" title="YouTube">${iconYoutube}</a>
    <a href="mailto:${ct.email}" class="soc-btn" title="Email">${iconMail}</a>
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
