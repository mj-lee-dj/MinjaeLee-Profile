document.addEventListener('DOMContentLoaded', () => {
  let lectures = profileData.lectures || [];
  let byId = new Map(lectures.map((lecture) => [lecture.id, lecture]));
  let curation = structuredClone(ProfileLectureStore.load());
  let dirty = false;
  let query = '';
  const highlights = document.getElementById('adminLectureHighlights');
  const catalog = document.getElementById('adminLectureList');
  const count = document.getElementById('adminLectureCount');
  const notice = document.getElementById('adminLectureNotice');
  const save = document.getElementById('saveLectureCuration');
  const labelInput = document.getElementById('lectureHighlightLabel');
  const labelHeading = document.getElementById('selectedLectureTitle');
  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

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

  function renderHighlights() {
    count.textContent = `${curation.highlights.length} / 5`;
    count.dataset.complete = String(curation.highlights.length === 5);
    highlights.innerHTML = curation.highlights.map((id, index) => {
      const lecture = byId.get(id);
      if (!lecture) return '';
      return `<li class="lecture-admin__highlight" draggable="true" data-id="${escapeHtml(id)}">
        <span class="lecture-admin__drag" aria-hidden="true">DRAG</span>
        <span class="lecture-admin__rank">${String(index + 1).padStart(2, '0')}</span>
        <div><h4>${escapeHtml(lecture.title)}</h4><p>${escapeHtml(lecture.year)} · ${escapeHtml(lecture.org)}</p></div>
        <div class="lecture-admin__move">
          <button type="button" data-move="-1" aria-label="${escapeHtml(lecture.title)} 위로 이동" ${index === 0 ? 'disabled' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"></path></svg></button>
          <button type="button" data-move="1" aria-label="${escapeHtml(lecture.title)} 아래로 이동" ${index === curation.highlights.length - 1 ? 'disabled' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button>
        </div>
      </li>`;
    }).join('');
  }

  function renderCatalog() {
    const hidden = new Set(curation.hidden);
    const selected = new Set(curation.highlights);
    const matches = lectures.filter((lecture) => `${lecture.title} ${lecture.org} ${lecture.year} ${lectureTopic(lecture)}`.toLowerCase().includes(query));
    catalog.innerHTML = matches.map((lecture) => `<li class="lecture-admin__record">
      <div class="lecture-admin__record-copy">
        <span>${escapeHtml(lecture.year)} / ${escapeHtml(lectureTopic(lecture))}</span>
        <h4>${escapeHtml(lecture.title)}</h4>
        <p>${escapeHtml(lecture.org)}</p>
      </div>
      <div class="lecture-admin__toggles">
        <label><input type="checkbox" data-action="selected" data-id="${escapeHtml(lecture.id)}" ${selected.has(lecture.id) ? 'checked' : ''}> <span data-highlight-label>${escapeHtml(curation.label)}</span></label>
        <label><input type="checkbox" data-action="visible" data-id="${escapeHtml(lecture.id)}" ${hidden.has(lecture.id) ? '' : 'checked'}> 주제별 목록에 표시</label>
      </div>
    </li>`).join('');
  }

  function render() {
    labelHeading.textContent = curation.label;
    if (document.activeElement !== labelInput) labelInput.value = curation.label;
    renderHighlights();
    renderCatalog();
    save.disabled = !dirty || curation.highlights.length !== 5 || !curation.label.trim();
  }

  function focusCatalog(id, action) {
    requestAnimationFrame(() => catalog.querySelector('input[data-action=\"' + action + '\"][data-id=\"' + CSS.escape(id) + '\"]')?.focus());
  }

  function focusHighlight(id, direction) {
    requestAnimationFrame(() => {
      const row = highlights.querySelector('[data-id=\"' + CSS.escape(id) + '\"]');
      const preferred = row?.querySelector('button[data-move=\"' + direction + '\"]:not(:disabled)');
      (preferred || row?.querySelector('button:not(:disabled)'))?.focus();
    });
  }

  function markDirty(message) {
    dirty = true;
    notice.textContent = message;
    render();
  }

  function moveHighlight(id, destination, focusDirection = 0) {
    const current = curation.highlights.indexOf(id);
    if (current < 0 || destination < 0 || destination >= curation.highlights.length || current === destination) return;
    const next = [...curation.highlights];
    next.splice(current, 1);
    next.splice(destination, 0, id);
    curation.highlights = next;
    markDirty('대표 강의 순서가 변경되었습니다. 저장 버튼을 눌러 반영하세요.');
    if (focusDirection) focusHighlight(id, focusDirection);
  }

  catalog.addEventListener('change', (event) => {
    const input = event.target.closest('input[data-action]');
    if (!input) return;
    const id = input.dataset.id;
    if (input.dataset.action === 'selected') {
      if (input.checked && curation.highlights.length >= 5) {
        notice.textContent = `${curation.label}에는 다섯 건만 둘 수 있습니다. 기존 항목 하나를 먼저 해제하세요.`;
        render();
        focusCatalog(id, 'selected');
        return;
      }
      curation.highlights = input.checked ? [...curation.highlights, id] : curation.highlights.filter((item) => item !== id);
      markDirty(curation.highlights.length === 5 ? '대표 강의 다섯 건이 준비되었습니다. 순서를 확인하고 저장하세요.' : `${curation.label}에 표시할 강의를 한 건 더 선택하세요.`);
      focusCatalog(id, 'selected');
      return;
    }
    const hidden = new Set(curation.hidden);
    if (input.checked) hidden.delete(id);
    else hidden.add(id);
    curation.hidden = [...hidden];
    markDirty('주제별 목록 공개 설정이 변경되었습니다. 저장 버튼을 눌러 반영하세요.');
    focusCatalog(id, 'visible');
  });

  highlights.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-move]');
    const row = event.target.closest('[data-id]');
    if (!button || !row) return;
    const current = curation.highlights.indexOf(row.dataset.id);
    moveHighlight(row.dataset.id, current + Number(button.dataset.move), Number(button.dataset.move));
  });
  highlights.addEventListener('dragstart', (event) => {
    const row = event.target.closest('[data-id]');
    if (!row) return;
    row.dataset.dragging = 'true';
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', row.dataset.id);
  });
  highlights.addEventListener('dragend', (event) => {
    const row = event.target.closest('[data-id]');
    if (row) delete row.dataset.dragging;
  });
  highlights.addEventListener('dragover', (event) => {
    if (event.target.closest('[data-id]')) event.preventDefault();
  });
  highlights.addEventListener('drop', (event) => {
    const target = event.target.closest('[data-id]');
    if (!target) return;
    event.preventDefault();
    moveHighlight(event.dataTransfer.getData('text/plain'), curation.highlights.indexOf(target.dataset.id));
  });
  document.getElementById('lectureSearch').addEventListener('input', (event) => {
    query = event.target.value.trim().toLowerCase();
    renderCatalog();
  });
  labelInput.addEventListener('input', (event) => {
    curation.label = event.target.value.slice(0, 24);
    dirty = true;
    labelHeading.textContent = curation.label.trim() || ProfileLectureStore.defaultLabel;
    catalog.querySelectorAll('[data-highlight-label]').forEach((label) => {
      label.textContent = curation.label.trim() || ProfileLectureStore.defaultLabel;
    });
    notice.textContent = '첫 강의 탭 이름이 변경되었습니다. 저장 버튼을 눌러 반영하세요.';
    save.disabled = curation.highlights.length !== 5 || !curation.label.trim();
  });
  save.addEventListener('click', () => {
    if (curation.highlights.length !== 5) {
      notice.textContent = '대표 강의를 정확히 다섯 건 선택해야 저장할 수 있습니다.';
      return;
    }
    if (!curation.label.trim()) {
      notice.textContent = '첫 강의 탭 이름을 입력하세요.';
      return;
    }
    const saved = ProfileLectureStore.save(curation);
    if (!saved) {
      notice.textContent = '이 브라우저에서는 로컬 초안을 저장할 수 없습니다. 일반 브라우저에서 다시 시도하세요.';
      return;
    }
    curation = structuredClone(saved);
    dirty = false;
    notice.textContent = '로컬 초안으로 저장했습니다. 열려 있는 사이트 초안에도 바로 반영됩니다.';
    render();
  });
  window.addEventListener('profileDraft:content', () => {
    lectures = profileData.lectures || [];
    byId = new Map(lectures.map((lecture) => [lecture.id, lecture]));
    const invalidated = curation.highlights.some((id) => !byId.has(id) || byId.get(id).visible === false);
    curation = structuredClone(ProfileLectureStore.reconcile(curation, dirty));
    if (invalidated && dirty) {
      notice.textContent = '삭제·비공개 처리된 강의를 제외해 대표 목록을 정리했습니다. 확인 후 저장하세요.';
    } else if (invalidated) {
      const saved = ProfileLectureStore.save(curation);
      if (saved) {
        curation = structuredClone(saved);
        notice.textContent = '삭제·비공개 처리된 강의를 제외하고 대표 목록을 자동 정리했습니다.';
      } else {
        dirty = true;
        notice.textContent = '대표 목록을 정리했지만 저장할 수 없습니다. 일반 브라우저에서 다시 시도하세요.';
      }
    }
    render();
  });
  render();
});
