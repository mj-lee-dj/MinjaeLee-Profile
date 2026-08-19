document.addEventListener('DOMContentLoaded', () => {
  let proofs = structuredClone(profileData.featuredProofs || []);
  const list = document.getElementById('adminProofList');
  const count = document.getElementById('adminProofCount');
  const notice = document.getElementById('adminNotice');
  const dialog = document.getElementById('proofDialog');
  const form = document.getElementById('proofForm');
  const fields = {
    id: document.getElementById('proofId'),
    title: document.getElementById('proofTitle'),
    link: document.getElementById('proofLink'),
    visible: document.getElementById('proofVisible'),
  };

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const twoDigits = (index) => String(index + 1).padStart(2, '0');

  function persist(message) {
    try {
      localStorage.setItem('profileDraft.featuredProofs', JSON.stringify(proofs));
    } catch (error) {
      if (error?.name !== 'SecurityError') console.warn('핵심 이력 초안을 저장하지 못했습니다.', error);
      notice.textContent = '이 브라우저에서는 로컬 초안을 저장할 수 없습니다. 일반 브라우저에서 다시 시도하세요.';
      return false;
    }
    window.dispatchEvent(new CustomEvent('profileDraft:changed', { detail: { source: 'featuredProofs' } }));
    notice.textContent = message;
    render();
    return true;
  }

  function render() {
    count.textContent = String(proofs.length);
    const visibleIds = proofs.filter((proof) => proof.visible !== false).slice(0, 4).map((proof) => proof.id);
    list.innerHTML = proofs.map((proof, index) => `
      <li class="proof-admin__item" data-id="${escapeHtml(proof.id)}" data-hidden="${proof.visible === false}">
        <span class="proof-admin__index">${twoDigits(index)}</span>
        <div>
          ${visibleIds.includes(proof.id) ? '<span class="proof-admin__featured">FIRST VIEW</span>' : ''}
          <h3 class="proof-admin__item-title">${escapeHtml(proof.title)}</h3>
        </div>
        <div class="proof-admin__actions" aria-label="${escapeHtml(proof.title)} 관리">
          <button type="button" data-action="up" aria-label="위로 이동" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-action="down" aria-label="아래로 이동" ${index === proofs.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" data-action="toggle">${proof.visible === false ? '공개' : '숨김'}</button>
          <button type="button" data-action="edit">수정</button>
          <button type="button" data-action="delete">삭제</button>
        </div>
      </li>`).join('');
  }

  function openEditor(proof) {
    document.getElementById('dialogTitle').textContent = proof ? '핵심 정보 수정' : '핵심 정보 추가';
    fields.id.value = proof?.id || '';
    fields.title.value = proof?.title || '';
    fields.link.value = proof?.link || '';
    fields.visible.checked = proof?.visible !== false;
    dialog.showModal();
    fields.title.focus();
  }

  document.getElementById('addProof').addEventListener('click', () => {
    if (proofs.length >= 10) {
      notice.textContent = '공개 인덱스는 10개까지 운영합니다. 기존 항목을 정리한 뒤 추가하세요.';
      return;
    }
    openEditor(null);
  });

  list.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    const row = event.target.closest('[data-id]');
    if (!button || !row) return;
    const index = proofs.findIndex((proof) => proof.id === row.dataset.id);
    if (index < 0) return;
    const action = button.dataset.action;
    if (action === 'up' && index > 0) [proofs[index - 1], proofs[index]] = [proofs[index], proofs[index - 1]];
    if (action === 'down' && index < proofs.length - 1) [proofs[index + 1], proofs[index]] = [proofs[index], proofs[index + 1]];
    if (action === 'toggle') proofs[index].visible = proofs[index].visible === false;
    if (action === 'edit') return openEditor(proofs[index]);
    if (action === 'delete') {
      if (!confirm(`“${proofs[index].title}” 항목을 로컬 초안에서 삭제할까요?`)) return;
      proofs.splice(index, 1);
    }
    persist('로컬 초안에 반영했습니다. 사이트 초안을 새로고침하면 확인할 수 있습니다.');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (event.submitter?.value === 'cancel') {
      dialog.close();
      return;
    }
    if (!form.reportValidity()) return;
    const id = fields.id.value;
    const existing = id ? proofs.find((item) => item.id === id) : null;
    const proof = {
      id: id || `proof_${Date.now().toString(36)}`,
      type: existing?.type || '',
      title: fields.title.value.replace(/\r\n?/g, '\n').trim(),
      meta: existing?.meta || '',
      link: fields.link.value.trim(),
      visible: fields.visible.checked,
    };
    if (id) {
      const index = proofs.findIndex((item) => item.id === id);
      proofs[index] = proof;
    } else {
      proofs.push(proof);
    }
    if (persist('로컬 초안으로 저장했습니다. 운영 사이트에는 배포되지 않았습니다.')) dialog.close();
  });

  render();
});
