document.addEventListener('DOMContentLoaded', () => {
  const dialog = document.getElementById('contentEditor');
  const form = document.getElementById('contentForm');
  const supportedSections = new Set(['onlineCourses', 'youtubeVideos', 'lectures']);
  const supportedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
  const maximumBytes = 900 * 1024;
  const maximumDimension = 1600;

  const readFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });

  const loadImage = (source) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('이미지 형식을 확인할 수 없습니다.'));
    image.src = source;
  });

  const canvasBlob = (canvas, quality) => new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));

  async function prepareImage(file) {
    if (!supportedTypes.has(file.type)) throw new Error('PNG, JPEG, WebP, GIF 이미지만 사용할 수 있습니다.');
    const source = await readFile(file);
    const image = await loadImage(source);
    const ratio = Math.min(1, maximumDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    canvas.getContext('2d', { alpha: false }).drawImage(image, 0, 0, canvas.width, canvas.height);
    let blob = null;
    for (const quality of [.88, .78, .68, .58]) {
      blob = await canvasBlob(canvas, quality);
      if (blob && blob.size <= maximumBytes) break;
    }
    if (!blob || blob.size > maximumBytes) throw new Error('이미지를 900KB 이하로 줄이지 못했습니다. 더 작은 이미지를 사용하세요.');
    return { dataUrl: await readFile(blob), size: blob.size };
  }

  function values(control) {
    return String(control.value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }

  function render(field) {
    const control = field.querySelector('[data-image-paste-input]');
    const preview = field.querySelector('[data-image-preview]');
    const items = values(control);
    preview.innerHTML = items.map((source, index) => `
      <figure class="image-paste__preview">
        <img src="${source.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}" alt="붙여넣은 이미지 ${index + 1}">
        <button type="button" data-remove-image="${index}" aria-label="이미지 ${index + 1} 삭제">삭제</button>
      </figure>`).join('');
    field.dataset.hasImages = String(items.length > 0);
  }

  function setValues(field, next) {
    const control = field.querySelector('[data-image-paste-input]');
    control.value = next.join('\n');
    control.dispatchEvent(new Event('input', { bubbles: true }));
    render(field);
  }

  function setStatus(field, message, error = false) {
    const status = field.querySelector('[data-image-status]');
    status.textContent = message;
    status.dataset.error = String(error);
  }

  async function addFiles(field, files) {
    const maximum = Number(field.dataset.maximumImages || 1);
    const current = values(field.querySelector('[data-image-paste-input]'));
    setStatus(field, '이미지를 최적화하고 있습니다.');
    try {
      const prepared = [];
      for (const file of files) prepared.push(await prepareImage(file));
      const incoming = prepared.map((item) => item.dataUrl);
      const next = maximum === 1 ? incoming.slice(-1) : [...current, ...incoming].slice(0, maximum);
      setValues(field, next);
      const kilobytes = Math.round(prepared.reduce((sum, item) => sum + item.size, 0) / 1024);
      setStatus(field, `${next.length}장 준비됨 · ${kilobytes}KB · 운영 저장 시 자동 업로드됩니다.`);
    } catch (error) {
      setStatus(field, error.message, true);
    }
  }

  function enhance() {
    const section = document.getElementById('contentSection').value;
    if (!supportedSections.has(section)) return;
    const control = form.querySelector('[data-image-paste-input]');
    if (!control || control.closest('[data-image-paste-field]')) return;
    const maximum = section === 'lectures' ? 3 : 1;
    const field = control.closest('[data-image-field-shell]');
    field.dataset.imagePasteField = '';
    field.dataset.maximumImages = String(maximum);
    const tools = document.createElement('div');
    tools.className = 'image-paste';
    tools.tabIndex = 0;
    tools.setAttribute('role', 'group');
    tools.innerHTML = `
      <div class="image-paste__copy"><strong>이미지 붙여넣기</strong><span>이 영역을 누른 뒤 Ctrl+V · 최대 ${maximum}장</span></div>
      <label class="image-paste__file">파일 선택<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" ${maximum > 1 ? 'multiple' : ''}></label>
      <p class="image-paste__status" data-image-status role="status">경로 입력 또는 이미지 붙여넣기를 사용할 수 있습니다.</p>
      <div class="image-paste__previews" data-image-preview></div>`;
    control.before(tools);
    tools.querySelector('input[type="file"]').addEventListener('change', (event) => {
      addFiles(field, [...event.target.files]);
      event.target.value = '';
    });
    tools.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-remove-image]');
      if (!remove) return;
      const next = values(control);
      next.splice(Number(remove.dataset.removeImage), 1);
      setValues(field, next);
      setStatus(field, next.length ? `${next.length}장 준비됨` : '이미지를 삭제했습니다.');
    });
    render(field);
  }

  dialog.addEventListener('paste', (event) => {
    const field = dialog.querySelector('[data-image-paste-field]');
    const files = [...(event.clipboardData?.items || [])]
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile()).filter(Boolean);
    if (!field || files.length === 0) return;
    event.preventDefault();
    addFiles(field, files);
  });
  window.addEventListener('profileAdmin:editorOpened', enhance);
});
