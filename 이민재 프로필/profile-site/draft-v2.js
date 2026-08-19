document.addEventListener('DOMContentLoaded', () => {
  const data = profileData;
  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const multilineHtml = (value) => escapeHtml(value).replace(/\r?\n/g, '<br>');
  const twoDigits = (index) => String(index + 1).padStart(2, '0');
  const externalUrl = (value) => /^https?:\/\//i.test(String(value ?? '')) ? String(value) : '';
  const assetUrl = (value) => { const candidate = String(value ?? ''); return candidate.startsWith('uploads/') || candidate.startsWith('assets/') || candidate.startsWith('https://') || candidate.startsWith('http://') || ['data:image/png;base64,', 'data:image/jpeg;base64,', 'data:image/webp;base64,', 'data:image/gif;base64,'].some((prefix) => candidate.startsWith(prefix)) ? candidate : ''; };
  const itemImage = (item) => assetUrl(item?.images?.[0] || item?.image || '');
  const itemLink = (item) => externalUrl(item?.link);
  const visible = (items) => (items || []).filter((item) => item.visible !== false);
  const mediaAction = () => '<span class="media-action" aria-hidden="true">OPEN <span>↗</span></span>';
  const bookCover = (book) => {
    const image = itemImage(book);
    if (image) return image;
    const yes24Link = itemLink(book);
    const goodsId = yes24Link.includes('yes24.com/product/goods/')
      ? yes24Link.split('/goods/')[1]?.split('/')[0].split('?')[0].split('#')[0]
      : '';
    return goodsId ? 'https://image.yes24.com/goods/' + goodsId + '/XL' : '';
  };
  const linkWrap = (item, content, className = '') => {
    const link = itemLink(item);
    return link ? `<a class="${className}" href="${escapeHtml(link)}" target="_blank" rel="noopener">${content}</a>` : `<div class="${className}">${content}</div>`;
  };

  function renderProofs() {
    const proofs = visible(data.featuredProofs).slice(0, 10);
    document.getElementById('proofLedger').innerHTML = proofs.map((proof, index) => {
      const isCreatorProof = proof.id === 'proof_g_creator';
      const title = isCreatorProof ? escapeHtml(proof.title).replace(/\s+/g, ' ') : multilineHtml(proof.title);
      const content = `<span class="ledger__index">${twoDigits(index)}</span>
        <h3 class="ledger__title${isCreatorProof ? ' ledger__title--creator' : ''}">${title}</h3>`;
      return `<li>${linkWrap(proof, content, 'ledger__row ledger__link')}</li>`;
    }).join('');
  }

  function renderBooks() {
    const publications = visible(data.publications);
    const courses = visible(data.onlineCourses);
    document.getElementById('bookCount').textContent = `${publications.length}권`;
    document.getElementById('courseCount').textContent = `${courses.length}과정`;
    document.getElementById('booksCountLabel').textContent = '/ ' + String(publications.length).padStart(2, '0');
    document.getElementById('coursesCountLabel').textContent = '/ ' + String(courses.length).padStart(2, '0');
    document.getElementById('bookGrid').innerHTML = publications.map((book, index) => {
      const image = bookCover(book);
      const cover = image
        ? `<div class="media-frame media-frame--book book-card__cover-image"><img src="${escapeHtml(image)}" width="900" height="1275" alt="${escapeHtml(book.title)} 책 표지" loading="lazy" referrerpolicy="no-referrer"></div>`
        : `<div class="book-card__cover"><span class="book-card__number">${twoDigits(index)}</span><h3 class="book-card__cover-title">${escapeHtml(book.title)}</h3></div>`;
      return `<article class="book-card reveal-block">${linkWrap(book, itemLink(book) ? cover + mediaAction() : cover, 'book-card__link')}<p class="book-card__meta">${escapeHtml(book.publisher)} · ${escapeHtml(book.year)}</p></article>`;
    }).join('');
    document.getElementById('courseGrid').innerHTML = courses.map((course, index) => {
      const image = itemImage(course);
      const picture = image ? `<img src="${escapeHtml(image)}" width="1280" height="720" alt="${escapeHtml(course.title)} 연수 화면" loading="lazy">` : '';
      const media = itemLink(course)
        ? `<a class="media-frame media-frame--landscape" href="${escapeHtml(itemLink(course))}" target="_blank" rel="noopener">${picture}${mediaAction()}</a>`
        : `<div class="media-frame media-frame--landscape">${picture}</div>`;
      return `<article class="course-card reveal-block">${media}<span class="course-card__index">${twoDigits(index)}</span><h4 class="course-card__title">${escapeHtml(course.title)}</h4><p class="course-card__meta">${escapeHtml(course.platform)} · ${escapeHtml(course.credit)}</p></article>`;
    }).join('');
  }

  function renderRecords() {
    const awards = visible(data.awards);
    const activities = visible(data.activities);
    const pressItems = visible(data.press);
    document.getElementById('awardList').innerHTML = awards.map((award, index) =>
      `<li class="record-list__item"><span class="record-list__index">${twoDigits(index)}</span><h4 class="record-list__title">${escapeHtml(award.title)}<span class="record-list__meta">${escapeHtml([award.org, award.year].filter(Boolean).join(' · '))}</span></h4></li>`).join('');
    document.getElementById('activityList').innerHTML = activities.map((activity, index) =>
      `<li class="record-list__item"><span class="record-list__index">${twoDigits(index)}</span><h4 class="record-list__title">${escapeHtml(activity.title)}<span class="record-list__meta">${escapeHtml(activity.period)}</span></h4></li>`).join('');
    const lead = pressItems.find((press) => /맥락/.test(press.title)) || pressItems[0];
    const feature = document.getElementById('pressFeature');
    if (lead) {
      const image = itemImage(lead);
      const media = image ? linkWrap(lead, `<img src="${escapeHtml(image)}" width="1280" height="720" alt="${escapeHtml(lead.source)} 인터뷰 기사" loading="lazy"><span class="media-frame__caption">${escapeHtml(lead.source)} / ${escapeHtml(lead.date)}</span>`, 'media-frame media-frame--landscape') : '';
      feature.innerHTML = `<blockquote class="press-feature__quote">“도구보다<br>맥락이 먼저입니다”</blockquote>${media}`;
    } else feature.innerHTML = '';
    document.getElementById('pressIndex').innerHTML = pressItems.map((press, index) =>
      `<li>${linkWrap(press, `<span class="press-index__number">${twoDigits(index)}</span><span class="press-index__source">${escapeHtml(press.source)}</span><h4 class="press-index__title">${escapeHtml(press.title)}</h4><span class="press-index__date">${escapeHtml(press.date)}</span>`, 'press-index__item')}</li>`).join('');
  }

  function bindProfile() {
    const personal = data.personal || {};
    const contact = personal.contact || {};
    const nameEn = String(personal.nameEn || 'Minjae Lee').trim().toUpperCase();
    const parts = nameEn.split(/\s+/);
    const heroName = document.getElementById('heroName');
    heroName.setAttribute('aria-label', nameEn);
    heroName.innerHTML = `<span>${escapeHtml(parts.slice(0, -1).join(' ') || parts[0])}</span>${parts.length > 1 ? `<span>${escapeHtml(parts.at(-1))}</span>` : ''}`;
    document.getElementById('navLogo').textContent = nameEn;
    document.getElementById('heroNameKr').textContent = personal.name || '이민재';
    document.getElementById('heroStatement').innerHTML = multilineHtml(personal.statement || '기술을 고르는 기준은\n언제나 교실입니다.');
    document.getElementById('heroPortrait').src = assetUrl(personal.draftPhoto) || 'assets/profile-2026.png';
    document.getElementById('heroPortrait').alt = `${personal.name || '이민재'} 프로필 사진`;
    document.getElementById('lectureCount').textContent = personal.lectureCount || '150+';
    [['heroInstagram', contact.instagram], ['contactInstagram', contact.instagram]].forEach(([id, href]) => document.getElementById(id).href = externalUrl(href));
    document.getElementById('heroEmail').href = `mailto:${contact.email || ''}`;
    document.getElementById('contactEmail').href = `mailto:${contact.email || ''}`;
    document.getElementById('contactEmail').textContent = contact.email || '';
  }

  function bindPage() {
    const nav = document.getElementById('siteNav');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.setAttribute('aria-label', expanded ? '메뉴 열기' : '메뉴 닫기');
      links.classList.toggle('is-open', !expanded);
      nav.classList.toggle('is-open', !expanded);
      if (!expanded) requestAnimationFrame(() => { nav.scrollTop = 0; });
    });
    links.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', '메뉴 열기');
      links.classList.remove('is-open');
      nav.classList.remove('is-open');
    }));
    const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }), { threshold: .12 });
    document.querySelectorAll('.reveal-block').forEach((element) => revealObserver.observe(element));
    const sectionObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll('.editorial-nav__link').forEach((link) => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    }), { rootMargin: '-30% 0px -60%', threshold: 0 });
    document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));
    document.addEventListener('scroll', () => nav.classList.toggle('is-scrolled', window.scrollY > 16), { passive: true });
  }

  bindProfile();
  renderProofs();
  renderBooks();
  renderRecords();
  bindPage();
  window.addEventListener('storage', (event) => {
    if ([ProfileContentStore.key, 'profileDraft.featuredProofs', ProfileLectureStore.key].includes(event.key)) location.reload();
  });
});
