const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const published = JSON.parse(read('data_v3.json'));
const plain = (value) => JSON.parse(JSON.stringify(value));
const expectedBooks = [
  ['pub_1', 'Google로 칼퇴하는 교사들의 시크릿', '교사크리에이터협회', '2025', '144246572'],
  ['pub_mlrv9tugxeozh', '그리와 로미의 제미나이 탐험대', '앤써북', '2026', '178064014'],
  ['pub_2', '그리와 로미의 구글 탐험대', '앤써북', '2025', '155119009'],
  ['pub_mr29b0grgnumy', '코딩 미술 융합 프로젝트를 위한 코드위즈 AI 메이커 스케치북', '상상충전소', '2024', '125581310'],
].map(([id, title, publisher, year, goods]) => ({
  id, title, publisher, year, link: `https://www.yes24.com/product/goods/${goods}`,
  cover: `https://image.yes24.com/goods/${goods}/XL`,
}));
const expectedCourses = [
  {
    id: 'oc_3', title: 'Gemini x Google AI - AI 콜라보로 완성하는 수업 혁신', platform: '한국교원연수원', credit: '1학점',
    link: 'https://www.hstudy.co.kr/newmain/subject_view.asp?inx=1&jnx=1&gcode=s1905',
    images: ['uploads/0a7f878c8f3b.png', 'uploads/b51a3fa17ffa.png'], image: 'uploads/0a7f878c8f3b.png', visible: true,
  },
  {
    id: 'oc_1', title: 'Google 협업 도구, Gemini로 교사 업무 혁신하기', platform: '티처빌', credit: '1학점',
    link: 'https://www.teacherville.co.kr/trainapply/courseDetail.edu?division=T&courseSeq=O1005493&t=G002',
    images: ['uploads/3c3d5f94efb5.png'], image: 'uploads/3c3d5f94efb5.png', visible: true,
  },
  {
    id: 'oc_2', title: 'ChatGPT, 수업에 날개를 달다', platform: '교육사랑연수원', credit: '1학점',
    link: 'https://www.edulove.co.kr/main/subject_view.asp?gcode=s0818&inx=1',
    images: ['uploads/5597b32125de.png'], image: 'uploads/5597b32125de.png', visible: true,
  },
];

// Exercise the real DOMContentLoaded callback. This minimal DOM only supplies the
// nodes used by the renderer; browser layout and actual navigation need browser QA.
function render(data = published, { storage = new Map(), loadStore = false } = {}) {
  const nodes = new Map();
  const listeners = new Map();
  const getNode = (id) => {
    if (!nodes.has(id)) {
      const attributes = {};
      nodes.set(id, {
        innerHTML: '', textContent: '',
        setAttribute(name, value) { attributes[name] = String(value); },
        getAttribute(name) { return attributes[name] ?? null; },
        removeAttribute(name) { delete attributes[name]; },
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener() {}, querySelectorAll() { return []; },
      });
    }
    return nodes.get(id);
  };
  const context = vm.createContext({
    profileData: structuredClone(data), structuredClone, console,
    document: {
      getElementById: getNode, querySelectorAll() { return []; },
      addEventListener(name, callback) {
        if (!listeners.has(name)) listeners.set(name, []);
        listeners.get(name).push(callback);
      },
    },
    window: { addEventListener() {}, dispatchEvent() {}, scrollY: 0 },
    localStorage: {
      getItem: (key) => storage.get(key) || '',
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    CustomEvent: class CustomEvent {},
    IntersectionObserver: class IntersectionObserver { observe() {} unobserve() {} },
    requestAnimationFrame: (callback) => callback(),
    location: { reload() {} },
  });
  if (loadStore) vm.runInContext(read('draft-content-store.js'), context);
  const before = JSON.stringify(context.profileData);
  vm.runInContext(read('draft-v2.js'), context);
  assert.equal(listeners.get('DOMContentLoaded')?.length, 1, 'one renderer initialization');
  listeners.get('DOMContentLoaded')[0]();
  assert.equal(JSON.stringify(context.profileData), before, 'rendering must not mutate profile data');
  return { nodes, context, storage, books: parse(getNode('bookGrid').innerHTML), courses: parse(getNode('courseGrid').innerHTML) };
}

const decode = (value) => value.replace(/&#(x[\da-f]+|\d+);/gi, (_, code) =>
  String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code)))
  .replaceAll('&quot;', '"').replaceAll('&apos;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');

// A strict parser for this small HTML subset deliberately rejects nested anchors,
// rather than silently repairing them the way a browser's HTML parser would.
function parse(markup) {
  const rootNode = { tag: '#root', attrs: {}, children: [] };
  const stack = [rootNode];
  for (const token of markup.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) || []) {
    if (/^<!/.test(token)) continue;
    if (!token.startsWith('<')) { stack.at(-1).children.push(decode(token)); continue; }
    if (token.startsWith('</')) {
      const tag = token.match(/^<\/([^\s>]+)/)[1].toLowerCase();
      assert.equal(stack.at(-1).tag, tag, `balanced closing tag ${token}`);
      stack.pop();
      continue;
    }
    const match = token.match(/^<([^\s/>]+)([\s\S]*?)\/?\s*>$/);
    assert.ok(match, `valid opening tag ${token}`);
    const tag = match[1].toLowerCase();
    if (tag === 'a') assert.ok(!stack.some((node) => node.tag === 'a'), 'anchors must never nest');
    const attrs = {};
    for (const attr of match[2].matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attrs[attr[1]] = decode(attr[2] ?? attr[3] ?? attr[4] ?? '');
    }
    const node = { tag, attrs, children: [], parent: stack.at(-1) };
    stack.at(-1).children.push(node);
    if (!/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag)) stack.push(node);
  }
  assert.equal(stack.length, 1, 'all generated elements close');
  return rootNode;
}
const descendants = (node, predicate) => node.children.flatMap((child) => typeof child === 'string' ? [] :
  [...(predicate(child) ? [child] : []), ...descendants(child, predicate)]);
const hasClass = (node, name) => (node.attrs.class || '').split(/\s+/).includes(name);
const byClass = (node, name) => descendants(node, (child) => hasClass(child, name));
const byTag = (node, tag) => descendants(node, (child) => child.tag === tag);
const text = (node) => node.children.map((child) => typeof child === 'string' ? child : text(child)).join('');
const one = (nodes, label) => { assert.equal(nodes.length, 1, label); return nodes[0]; };
const titleTexts = (tree, className) => byClass(tree, className).map(text);

function assertExternalLink(link, href) {
  assert.equal(link.tag, 'a');
  assert.equal(link.attrs.href, href);
  assert.equal(link.attrs.target, '_blank');
  assert.ok((link.attrs.rel || '').split(/\s+/).includes('noopener'));
}

// Read declaration contracts without depending on a package install or exact
// whitespace, spacing values, colors, or a particular mobile breakpoint.
function cssRules(source, media = []) {
  const rules = [];
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  let start = 0;
  while (start < css.length) {
    const opening = css.indexOf('{', start);
    if (opening < 0) break;
    const selector = css.slice(start, opening).trim();
    let depth = 1;
    let end = opening + 1;
    while (end < css.length && depth) {
      if (css[end] === '{') depth += 1;
      if (css[end] === '}') depth -= 1;
      end += 1;
    }
    assert.equal(depth, 0, `balanced CSS: ${selector}`);
    const body = css.slice(opening + 1, end - 1);
    if (selector.startsWith('@')) rules.push(...cssRules(body, [...media, selector]));
    else rules.push({ selector, media, declarations: Object.fromEntries(body.split(';').map((part) => {
      const colon = part.indexOf(':');
      return colon < 0 ? null : [part.slice(0, colon).trim(), part.slice(colon + 1).trim()];
    }).filter(Boolean)) });
    start = end;
  }
  return rules;
}
function activeAt(rule, width) {
  return rule.media.every((query) => [...query.matchAll(/(min|max)-width\s*:\s*(\d+(?:\.\d+)?)px/g)]
    .every(([, mode, limit]) => mode === 'max' ? width <= Number(limit) : width >= Number(limit)));
}
function styles(rules, target, width) {
  const selector = new RegExp(`\\.${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`);
  return Object.assign({}, ...rules.filter((rule) => selector.test(rule.selector) && activeAt(rule, width)).map((rule) => rule.declarations));
}
const compact = (value) => (value || '').replace(/\s+/g, '');

test('the original four books and three course records remain in both published feeds', () => {
  const context = vm.createContext({});
  vm.runInContext(read('data_v3.js'), context);
  const jsData = vm.runInContext('profileData', context);
  for (const key of ['publications', 'onlineCourses']) assert.deepEqual(plain(jsData[key]), published[key]);
  assert.equal(published.publications.length, 4);
  published.publications.forEach((book, index) => {
    const { cover, ...expected } = expectedBooks[index];
    assert.deepEqual(Object.fromEntries(Object.keys(expected).map((key) => [key, book[key]])), expected);
    assert.equal(book.visible, true);
    assert.deepEqual(book.images, []);
    assert.equal(book.image, '');
  });
  assert.deepEqual(published.onlineCourses, expectedCourses);
  expectedCourses.forEach((course) => course.images.forEach((image) => assert.ok(fs.existsSync(path.join(root, image)), image)));
});

test('books render full visible titles, the same cover URLs and the same publisher/year/link', () => {
  const { books, nodes } = render();
  const cards = byClass(books, 'book-card');
  assert.equal(cards.length, 4);
  cards.forEach((card, index) => {
    const expected = expectedBooks[index];
    const title = one(byClass(card, 'book-card__title'), 'one visible book title');
    assert.equal(text(title), expected.title);
    assert.ok(!Object.hasOwn(title.attrs, 'hidden'));
    assert.notEqual(title.attrs['aria-hidden'], 'true');
    const image = one(byTag(card, 'img'), 'one book cover');
    assert.equal(image.attrs.src, expected.cover);
    assert.ok(image.attrs.alt.includes(expected.title));
    assert.equal(image.attrs.loading, 'lazy');
    assertExternalLink(one(byTag(card, 'a'), 'one book destination'), expected.link);
    assert.equal(text(one(byClass(card, 'book-card__meta'), 'book metadata')), `${expected.publisher} · ${expected.year}`);
  });
  assert.equal(nodes.get('bookCount').textContent, '4권');
  assert.equal(nodes.get('booksCountLabel').textContent, '/ 04');
});

test('every course is a single whole-card link containing its original image, title, provider, credit and CTA', () => {
  const { courses, nodes } = render();
  const cards = byClass(courses, 'course-card');
  assert.equal(cards.length, 3);
  cards.forEach((card, index) => {
    const expected = expectedCourses[index];
    assert.equal(card.tag, 'article');
    const link = one(byClass(card, 'course-card__link'), 'one whole-card link');
    assert.equal(link.parent, card, 'the whole-card link is a direct article child');
    assert.equal(byTag(card, 'a').length, 1, 'no separate image or CTA anchors');
    assertExternalLink(link, expected.link);
    const media = one(byClass(link, 'course-card__media'), 'media belongs to link');
    const image = one(byTag(media, 'img'), 'one original thumbnail');
    assert.equal(image.attrs.src, expected.image);
    assert.ok(image.attrs.alt.includes(expected.title));
    assert.equal(image.attrs.loading, 'lazy');
    assert.equal(text(one(byClass(link, 'course-card__title'), 'title belongs to link')), expected.title);
    assert.equal(text(one(byClass(link, 'course-card__provider'), 'provider belongs to link')), expected.platform);
    assert.equal(text(one(byClass(link, 'course-card__credit'), 'credit belongs to link')), expected.credit);
    const cta = one(byClass(link, 'course-card__cta'), 'CTA belongs to link');
    assert.match(text(cta), /과정 보기/);
    assert.match(text(cta), /↗/);
    assert.notEqual(cta.tag, 'a');
  });
  assert.equal(nodes.get('courseCount').textContent, '3과정');
  assert.equal(nodes.get('coursesCountLabel').textContent, '/ 03');
});

test('explicit visibility flags are honored before rendering and counting', () => {
  const data = structuredClone(published);
  data.publications[0].visible = false;
  data.onlineCourses[1].visible = false;
  delete data.publications[1].visible;
  delete data.onlineCourses[0].visible;
  const { books, courses, nodes } = render(data);
  assert.deepEqual(titleTexts(books, 'book-card__title'), expectedBooks.slice(1).map((item) => item.title));
  assert.deepEqual(titleTexts(courses, 'course-card__title'), [expectedCourses[0].title, expectedCourses[2].title]);
  assert.equal(nodes.get('bookCount').textContent, '3권');
  assert.equal(nodes.get('courseCount').textContent, '2과정');
  assert.equal(nodes.get('booksCountLabel').textContent, '/ 03');
  assert.equal(nodes.get('coursesCountLabel').textContent, '/ 02');
});

test('saved local title, order, images, links and visibility survive the redesigned renderer', () => {
  const initial = render(published, { loadStore: true });
  const draft = plain(initial.context.window.ProfileContentStore.state);
  draft.publications.reverse();
  Object.assign(draft.publications[0], { title: '로컬에서 편집한 긴 책 제목 & 후속 작업', publisher: '로컬 출판사', year: '2027',
    link: 'https://example.com/local-book?draft=1&v=2', images: ['uploads/local-book.png'], image: 'uploads/local-book.png' });
  draft.publications[1].visible = false;
  draft.onlineCourses.reverse();
  Object.assign(draft.onlineCourses[0], { title: '로컬에서 편집한 과정 제목', platform: '로컬 연수원', credit: '2학점',
    link: 'https://example.com/local-course?draft=1&v=2', images: ['uploads/local-course.png'], image: 'uploads/local-course.png' });
  draft.onlineCourses[1].visible = false;
  const serialized = JSON.stringify(draft);
  const storage = new Map([['profileDraft.contentV1', serialized]]);
  const { books, courses, nodes } = render(published, { storage, loadStore: true });
  assert.deepEqual(titleTexts(books, 'book-card__title'), draft.publications.filter((item) => item.visible !== false).map((item) => item.title));
  assert.deepEqual(titleTexts(courses, 'course-card__title'), draft.onlineCourses.filter((item) => item.visible !== false).map((item) => item.title));
  assert.equal(byTag(books, 'img')[0].attrs.src, 'uploads/local-book.png');
  assert.equal(byTag(courses, 'img')[0].attrs.src, 'uploads/local-course.png');
  assertExternalLink(byTag(books, 'a')[0], draft.publications[0].link);
  assertExternalLink(byTag(courses, 'a')[0], draft.onlineCourses[0].link);
  assert.equal(text(byClass(courses, 'course-card__provider')[0]), '로컬 연수원');
  assert.equal(text(byClass(courses, 'course-card__credit')[0]), '2학점');
  assert.equal(nodes.get('bookCount').textContent, '3권');
  assert.equal(nodes.get('courseCount').textContent, '2과정');
  assert.equal(storage.get('profileDraft.contentV1'), serialized, 'rendering does not overwrite the local draft');
});

test('empty, missing and fully hidden collections produce empty grids and zero counts', () => {
  for (const mode of ['empty', 'missing', 'hidden']) {
    const data = structuredClone(published);
    for (const key of ['publications', 'onlineCourses']) {
      if (mode === 'empty') data[key] = [];
      if (mode === 'missing') delete data[key];
      if (mode === 'hidden') data[key].forEach((item) => { item.visible = false; });
    }
    const { books, courses, nodes } = render(data);
    assert.equal(byClass(books, 'book-card').length, 0, mode);
    assert.equal(byClass(courses, 'course-card').length, 0, mode);
    assert.equal(nodes.get('bookCount').textContent, '0권');
    assert.equal(nodes.get('courseCount').textContent, '0과정');
    assert.equal(nodes.get('booksCountLabel').textContent, '/ 00');
    assert.equal(nodes.get('coursesCountLabel').textContent, '/ 00');
  }
});

test('courses without a safe link use a noninteractive div with no CTA', () => {
  for (const link of ['', undefined, 'javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', '//attacker.test/course', '/relative-course']) {
    const data = structuredClone(published);
    data.onlineCourses = [{ ...data.onlineCourses[0], link }];
    const { courses } = render(data);
    const card = one(byClass(courses, 'course-card'), 'one no-link card');
    const wrapper = one(byClass(card, 'course-card__link'), 'same layout wrapper');
    assert.equal(wrapper.tag, 'div');
    assert.equal(byTag(card, 'a').length, 0);
    assert.equal(byTag(card, 'button').length, 0);
    assert.equal(byClass(card, 'course-card__cta').length, 0);
    assert.equal(wrapper.attrs.href, undefined);
    assert.equal(wrapper.attrs.tabindex, undefined);
    assert.equal(wrapper.attrs.role, undefined);
    assert.equal(text(one(byClass(wrapper, 'course-card__title'), 'no-link title')), expectedCourses[0].title);
  }
});

test('book fallback cover and noninteractive link wrapper remain usable without a destination or image', () => {
  const data = structuredClone(published);
  data.publications = [{ ...data.publications[0], title: '표지 없는 책', images: [], image: '', link: '' }];
  const { books } = render(data);
  const card = one(byClass(books, 'book-card'), 'one fallback book');
  assert.equal(byTag(card, 'img').length, 0);
  assert.equal(byTag(card, 'a').length, 0);
  assert.equal(one(byClass(card, 'book-card__link'), 'book wrapper').tag, 'div');
  assert.equal(text(one(byClass(card, 'book-card__title'), 'visible fallback title')), '표지 없는 책');
  assert.ok(byClass(card, 'book-card__cover').length > 0);
});

test('untrusted titles, metadata and URL attributes are escaped without creating executable markup', () => {
  const data = structuredClone(published);
  const payload = '<img src=x onerror="alert(1)"> & "quoted" \'single\'';
  const link = 'https://example.com/item?q=" onmouseover="alert(1)&x=<script>';
  const image = 'uploads/cover" onerror="alert(1).png';
  data.publications = [{ ...data.publications[0], title: payload, publisher: payload, year: payload, link, images: [image], image }];
  data.onlineCourses = [{ ...data.onlineCourses[0], title: payload, platform: payload, credit: payload, link, images: [image], image }];
  const { books, courses } = render(data);
  assert.deepEqual(titleTexts(books, 'book-card__title'), [payload]);
  assert.deepEqual(titleTexts(courses, 'course-card__title'), [payload]);
  assert.equal(text(byClass(courses, 'course-card__provider')[0]), payload);
  assert.equal(text(byClass(courses, 'course-card__credit')[0]), payload);
  assert.equal(text(byClass(books, 'book-card__meta')[0]), `${payload} · ${payload}`);
  for (const tree of [books, courses]) {
    assert.equal(byTag(tree, 'script').length, 0);
    assert.equal(byTag(tree, 'img').length, 1, 'untrusted titles do not create extra image elements');
    assert.equal(byTag(tree, 'img')[0].attrs.src, image);
    assert.equal(byTag(tree, 'a')[0].attrs.href, link);
    assert.equal(descendants(tree, (node) => Object.keys(node.attrs).some((key) => /^on/i.test(key))).length, 0);
  }
});

test('unsafe image schemes are excluded while HTTP destinations remain supported', () => {
  const data = structuredClone(published);
  data.publications = [{ ...data.publications[0], link: 'javascript:alert(1)', images: ['data:image/svg+xml,<svg onload="alert(1)">'], image: '' }];
  data.onlineCourses = [{ ...data.onlineCourses[0], link: 'http://example.com/course', images: ['javascript:alert(1)'], image: '' }];
  const { books, courses } = render(data);
  assert.equal(byTag(books, 'a').length, 0);
  assert.equal(byTag(books, 'img').length, 0);
  assert.equal(byTag(courses, 'img').length, 0);
  assertExternalLink(one(byTag(courses, 'a'), 'safe HTTP destination'), 'http://example.com/course');
  assert.equal(byClass(courses, 'course-card__cta').length, 1);
});

test('the rest of the profile renderer still initializes its existing sections', () => {
  const { nodes } = render();
  assert.equal(nodes.get('navLogo').textContent, published.personal.nameEn.trim().toUpperCase());
  assert.equal(nodes.get('heroNameKr').textContent, published.personal.name);
  for (const [key, id] of [['awards', 'awardList'], ['activities', 'activityList'], ['press', 'pressIndex']]) {
    const rendered = parse(nodes.get(id).innerHTML);
    assert.equal(byTag(rendered, 'li').length, published[key].filter((item) => item.visible !== false).length);
  }
  assert.ok(nodes.has('proofLedger'));
  assert.ok(nodes.has('pressFeature'));
});

for (const file of ['index.html', 'draft-v2.html']) {
  test(`${file} preserves the English headings and labels a scoped course collection`, () => {
    const html = read(file);
    const tree = parse(html);
    const books = one(descendants(tree, (node) => node.attrs.id === 'books'), 'Books section');
    const collection = one(byClass(books, 'course-collection'), 'scoped course collection');
    assert.equal(collection.attrs['aria-labelledby'], 'coursesHeading');
    const heading = one(descendants(collection, (node) => node.attrs.id === 'coursesHeading'), 'accessible course heading');
    assert.equal(heading.tag, 'h3');
    assert.match(text(heading), /^ONLINE COURSES\s/);
    assert.match(text(books), /Published work & online courses/);
    assert.match(text(books), /BOOKS/);
    assert.match(text(collection), /Recorded lectures/);
    assert.equal(descendants(collection, (node) => node.attrs.id === 'courseGrid').length, 1);
    assert.equal(descendants(books, (node) => node.attrs.id === 'bookGrid').length, 1);
    const sheets = byTag(tree, 'link').filter((node) => node.attrs.rel === 'stylesheet').map((node) => node.attrs.href.split('?')[0]);
    assert.equal(sheets.filter((href) => href === 'books-courses.css').length, 1);
    assert.ok(sheets.indexOf('books-courses.css') > sheets.indexOf('editorial-v4.css'), 'scoped overrides load after the legacy stylesheet');
    assert.equal(byTag(books, 'input').length, 0, 'no search added');
    assert.equal(byTag(books, 'button').length, 0, 'no link-copy controls added');
  });
}

test('scoped CSS preserves four desktop/two mobile books and three desktop course columns', () => {
  const rules = cssRules(read('books-courses.css'));
  assert.ok(rules.length > 0);
  rules.forEach((rule) => rule.selector.split(',').forEach((selector) => {
    assert.match(selector, /#books\b|\.works\b|\.course-collection\b/, `scoped selector: ${selector}`);
  }));
  assert.equal(compact(styles(rules, 'book-grid', 1280)['grid-template-columns']), 'repeat(4,minmax(0,1fr))');
  for (const width of [320, 390, 480]) {
    assert.equal(compact(styles(rules, 'book-grid', width)['grid-template-columns']), 'repeat(2,minmax(0,1fr))', `${width}px books`);
  }
  assert.equal(compact(styles(rules, 'course-grid', 1280)['grid-template-columns']), 'repeat(3,minmax(0,1fr))');
});

test('mobile courses use a single-column list with horizontal media-and-content rows', () => {
  const rules = cssRules(read('books-courses.css'));
  for (const width of [320, 390, 480]) {
    assert.match(compact(styles(rules, 'course-grid', width)['grid-template-columns']), /^(?:1fr|minmax\(0,1fr\)|repeat\(1,minmax\(0,1fr\)\))$/);
    const link = styles(rules, 'course-card__link', width);
    const columns = compact(link['grid-template-columns']);
    const horizontalGrid = link.display === 'grid' && /\)minmax\(0,1fr\)$/.test(columns);
    const horizontalFlex = link.display === 'flex' && (!link['flex-direction'] || link['flex-direction'] === 'row');
    assert.ok(horizontalGrid || horizontalFlex, `${width}px mobile course link needs two horizontal areas`);
  }
});

test('titles stay fully readable, images use contain, and keyboard focus is visible', () => {
  const css = read('books-courses.css');
  const rules = cssRules(css);
  for (const width of [390, 1280]) {
    for (const name of ['book-card__title', 'course-card__title']) {
      const title = styles(rules, name, width);
      assert.notEqual(title.display, 'none');
      assert.notEqual(title['text-overflow'], 'ellipsis');
      assert.notEqual(title['white-space'], 'nowrap');
      assert.ok(!title['-webkit-line-clamp'] || /^(none|unset|initial)$/.test(title['-webkit-line-clamp']));
      assert.ok(!title['line-clamp'] || /^(none|unset|initial)$/.test(title['line-clamp']));
    }
  }
  for (const media of ['book-card__cover-image', 'course-card__media']) {
    const imageRules = rules.filter((rule) => rule.selector.includes(`.${media}`) && /\bimg\b/.test(rule.selector));
    assert.ok(imageRules.some((rule) => rule.declarations['object-fit'] === 'contain'), `${media} keeps full images`);
  }
  assert.ok(rules.some((rule) => /\.course-card__link:focus-visible/.test(rule.selector) &&
    Object.entries(rule.declarations).some(([key, value]) => /outline|box-shadow/.test(key) && !/^(none|0)$/.test(value))), 'keyboard focus treatment');
  assert.doesNotMatch(css, /-webkit-line-clamp\s*:\s*\d|(?<!-)line-clamp\s*:\s*\d/);
});
