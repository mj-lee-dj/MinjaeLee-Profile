document.addEventListener('DOMContentLoaded', () => {
  const configs = ProfileAdminCollections;
  const byKey = new Map(configs.map((config) => [config.key, config]));
  let state = structuredClone(ProfileContentStore.load());
  const summary = document.getElementById('contentSummary');
  const nav = document.getElementById('collectionNav');
  const collections = document.getElementById('contentCollections');
  const dialog = document.getElementById('contentEditor');
  const form = document.getElementById('contentForm');
  const fieldsRoot = document.getElementById('contentFields');
  const globalNotice = document.getElementById('contentGlobalNotice');
  const profileForm = document.getElementById('profileSettingsForm');
  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function itemMeta(config, item) {
    const parts = {
      publications: [item.publisher, item.year],
      onlineCourses: [item.platform, item.credit],
      youtubeVideos: [item.link ? 'YouTube link' : '링크 없음'],
      lectures: [item.year, item.org, item.topic],
      awards: [item.org, item.year],
      activities: [item.period],
      press: [item.source, item.date],
    }[config.key] || [];
    return parts.filter(Boolean).join(' · ');
  }

  function showNotice(message, section = '', error = false) {
    const target = section ? document.getElementById('notice-' + section) : globalNotice;
    if (!target) return;
    target.textContent = message;
    target.dataset.error = String(error);
  }

  function persist(message, section = '') {
    const saved = ProfileContentStore.save(state);
    if (!saved) {
      showNotice('이 브라우저에서는 로컬 초안을 저장할 수 없습니다. 일반 브라우저에서 다시 시도하세요.', section, true);
      return false;
    }
    state = structuredClone(saved);
    showNotice(message, section);
    renderSummary();
    renderCollection(section);
    return true;
  }

  function renderSummary() {
    const cards = configs.map((config) => {
      const items = state[config.key];
      const visible = items.filter((item) => item.visible !== false).length;
      return `<a class="content-summary__card" href="#admin-${config.key}">
        <strong>${visible}</strong><span>${escapeHtml(config.label)}</span><small>${items.length}개 등록</small>
      </a>`;
    }).join('');
    summary.innerHTML = `<div><p class="eyebrow">Content inventory / local draft</p>
      <h2>공개 콘텐츠 원장</h2>
      <p>총 ${configs.reduce((total, config) => total + state[config.key].length, 0)}개 항목. 저장하면 같은 브라우저의 사이트 초안에 반영됩니다.</p></div>
      <div class="content-summary__grid">${cards}</div>`;
  }

  function buildShell() {
    nav.innerHTML = `<a href="#profileSettings">프로필</a><a href="#proof">PROOF</a>${configs.map((config) =>
      `<a href="#admin-${config.key}">${escapeHtml(config.label)}</a>`).join('')}`;
    collections.innerHTML = configs.map((config) => `<section class="collection-admin" id="admin-${config.key}" data-section="${config.key}">
      <div class="collection-admin__head">
        <div><p class="eyebrow">Editable collection</p><h2>${escapeHtml(config.label)}</h2><p>${escapeHtml(config.description)}</p></div>
        <button class="proof-admin__button proof-admin__button--primary" type="button" data-add="${config.key}">새 ${escapeHtml(config.singular)} 추가</button>
      </div>
      <label class="collection-admin__search">목록 검색
        <input type="search" data-search="${config.key}" placeholder="제목과 메타정보 검색">
      </label>
      <ol class="collection-admin__list" id="list-${config.key}"></ol>
      <p class="collection-admin__notice" id="notice-${config.key}" role="status">운영 사이트에는 아직 배포되지 않습니다.</p>
    </section>`).join('');
  }

  function renderCollection(section) {
    if (!section || !byKey.has(section)) {
      configs.forEach((config) => renderCollection(config.key));
      return;
    }
    const config = byKey.get(section);
    const list = document.getElementById('list-' + section);
    const search = document.querySelector('[data-search="' + section + '"]')?.value.trim().toLowerCase() || '';
    const matches = state[section].filter((item) =>
      `${item.title} ${itemMeta(config, item)}`.toLowerCase().includes(search));
    list.innerHTML = matches.map((item) => {
      const index = state[section].findIndex((candidate) => candidate.id === item.id);
      return `<li class="collection-admin__row" data-id="${escapeHtml(item.id)}" data-hidden="${item.visible === false}">
        <span class="collection-admin__index">${String(index + 1).padStart(2, '0')}</span>
        <div class="collection-admin__copy"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(itemMeta(config, item) || '추가 정보 없음')}</p></div>
        <span class="collection-admin__visibility">${item.visible === false ? '비공개' : '공개'}</span>
        <div class="collection-admin__actions" aria-label="${escapeHtml(item.title)} 관리">
          <button type="button" data-action="up" aria-label="위로 이동" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-action="down" aria-label="아래로 이동" ${index === state[section].length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" data-action="toggle">${item.visible === false ? '공개' : '숨김'}</button>
          <button type="button" data-action="edit">수정</button>
          <button type="button" data-action="delete">삭제</button>
        </div>
      </li>`;
    }).join('') || '<li class="collection-admin__empty">검색 결과가 없습니다.</li>';
  }

  function focusAction(section, id, action) {
    requestAnimationFrame(() => {
      const row = document.querySelector('[data-section="' + CSS.escape(section) + '"] [data-id="' + CSS.escape(id) + '"]');
      const preferred = row?.querySelector('[data-action="' + CSS.escape(action) + '"]:not(:disabled)');
      (preferred || row?.querySelector('button[data-action]:not(:disabled)'))?.focus();
    });
  }

  function openEditor(section, item = null) {
    const config = byKey.get(section);
    document.getElementById('contentDialogTitle').textContent = item ? config.singular + ' 수정' : '새 ' + config.singular + ' 추가';
    document.getElementById('contentSection').value = section;
    document.getElementById('contentId').value = item?.id || '';
    document.getElementById('contentVisible').checked = item?.visible !== false;
    fieldsRoot.innerHTML = config.fields.map(([name, label, type, required]) => {
      const requiredAttr = required ? ' required' : '';
      const labelText = `<span class="content-editor__label-text"><span>${escapeHtml(label)}</span><span class="content-editor__requirement" data-required="${Boolean(required)}">${required ? '필수' : '선택'}</span></span>`;
      if (type === 'images') {
        const hint = '<small>이미지를 Ctrl+V로 붙여넣거나 uploads/·https:// 경로를 한 줄에 하나씩 입력하세요.</small>';
        return `<div class="content-editor__field content-editor__field--images" data-image-field-shell><label for="field-${name}">${labelText}</label><textarea id="field-${name}" name="${name}" rows="2"${requiredAttr} data-image-paste-input spellcheck="false"></textarea>${hint}</div>`;
      }
      if (type === 'textarea') {
        return `<label>${labelText}<textarea name="${name}" rows="5"${requiredAttr}></textarea></label>`;
      }
      if (type === 'topic') {
        return `<label>${labelText}<select name="${name}"${requiredAttr}>${ProfileContentStore.lectureTopics.map((topic) =>
          `<option value="${escapeHtml(topic)}">${escapeHtml(topic)}</option>`).join('')}</select></label>`;
      }
      return `<label>${labelText}<input name="${name}" type="${type}"${requiredAttr}></label>`;
    }).join('');
    config.fields.forEach(([name, , type]) => {
      const control = fieldsRoot.elements?.[name] || fieldsRoot.querySelector('[name="' + name + '"]');
      if (!control) return;
      control.value = type === 'images' ? (item?.images || []).join('\n') : (item?.[name] ?? '');
    });
    dialog.showModal();
    window.dispatchEvent(new CustomEvent('profileAdmin:editorOpened', { detail: { section } }));
    fieldsRoot.querySelector('input, textarea, select')?.focus();
  }

  function fillProfile() {
    const personal = state.personal;
    ['name', 'nameEn', 'statement', 'photo', 'lectureCount', 'email', 'instagram'].forEach((name) => {
      profileForm.elements[name].value = personal[name] || '';
    });
  }

  collections.addEventListener('input', (event) => {
    if (event.target.matches('[data-search]')) renderCollection(event.target.dataset.search);
  });
  collections.addEventListener('click', (event) => {
    const add = event.target.closest('[data-add]');
    if (add) return openEditor(add.dataset.add);
    const button = event.target.closest('button[data-action]');
    const sectionNode = event.target.closest('[data-section]');
    const row = event.target.closest('[data-id]');
    if (!button || !sectionNode || !row) return;
    const section = sectionNode.dataset.section;
    const items = state[section];
    const index = items.findIndex((item) => item.id === row.dataset.id);
    if (index < 0) return;
    const action = button.dataset.action;
    if (action === 'edit') return openEditor(section, items[index]);
    if (action === 'delete') {
      if (!confirm(`“${items[index].title}” 항목을 로컬 초안에서 삭제할까요?`)) return;
      items.splice(index, 1);
    } else if (action === 'toggle') {
      items[index].visible = items[index].visible === false;
    } else if (action === 'up' && index > 0) {
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
    } else if (action === 'down' && index < items.length - 1) {
      [items[index + 1], items[index]] = [items[index], items[index + 1]];
    } else return;
    if (persist('로컬 초안에 바로 반영했습니다.', section) && action !== 'delete') {
      focusAction(section, row.dataset.id, action);
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (event.submitter?.value === 'cancel') {
      dialog.close();
      return;
    }
    if (!form.reportValidity()) return;
    const section = document.getElementById('contentSection').value;
    const id = document.getElementById('contentId').value;
    const config = byKey.get(section);
    const existingIndex = state[section].findIndex((item) => item.id === id);
    const item = existingIndex >= 0 ? { ...state[section][existingIndex] } : {
      id: `${section}_${Date.now().toString(36)}`,
    };
    const formData = new FormData(form);
    config.fields.forEach(([name, , type]) => {
      const value = String(formData.get(name) || '').trim();
      item[name] = type === 'images' ? value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : value;
    });
    item.visible = document.getElementById('contentVisible').checked;
    if (existingIndex >= 0) state[section][existingIndex] = item;
    else state[section].push(item);
    if (persist('로컬 초안으로 저장했습니다. 공개 초안을 새로고침하면 확인할 수 있습니다.', section)) dialog.close();
  });

  profileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!profileForm.reportValidity()) return;
    const formData = new FormData(profileForm);
    const nextPersonal = Object.fromEntries(['name', 'nameEn', 'statement', 'photo', 'lectureCount', 'email', 'instagram']
      .map((name) => [name, String(formData.get(name) || '').trim()]));
    state.photoDirty = state.photoDirty === true || nextPersonal.photo !== state.personal.photo;
    state.personal = nextPersonal;
    if (persist('핵심 프로필을 로컬 초안으로 저장했습니다.')) fillProfile();
  });

  window.addEventListener('profileDraft:published', (event) => {
    if (!event.detail) return;
    state = structuredClone(event.detail);
    fillProfile();
    renderSummary();
    renderCollection('');
  });

  document.getElementById('resetContent').addEventListener('click', () => {
    if (!confirm('통합 콘텐츠 초안을 초기 데이터로 되돌릴까요? PROOF와 대표 강의 설정은 유지됩니다.')) return;
    const reset = ProfileContentStore.reset();
    if (!reset) {
      showNotice('로컬 초안을 초기화할 수 없습니다. 브라우저 저장 권한을 확인하세요.', '', true);
      return;
    }
    state = structuredClone(reset);
    fillProfile();
    renderSummary();
    renderCollection('');
    showNotice('통합 콘텐츠를 초기 데이터로 되돌렸습니다.');
  });

  buildShell();
  fillProfile();
  renderSummary();
  renderCollection('');
});
