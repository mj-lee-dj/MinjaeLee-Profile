# Minjae Lee Profile — Editorial Noir Design System

## 1. Atmosphere & Identity

교사가 만든 친근한 소개 페이지가 아니라, 교육 현장에서 축적한 판단과 결과를 편집자가 한 권의 저널처럼 구성한 포트폴리오다. 검은 종이, 상아색 활자, 실제 기록 사진과 얇은 버밀리언 레드 인덱스가 핵심 재료다. 기억에 남을 한 장면은 첫 화면의 인물 사진과 `MINJAE LEE` 활자가 맞물리고, 중복 요약 없이 PROOF 원장으로 곧장 이어지는 구성이다. V12부터는 승인된 Editorial Noir 방향과 현재 semantic DOM을 기준으로 하며, 과거 생성 이미지는 필수 픽셀 기준선으로 사용하지 않는다.

## 2. Color

| Role | Token | Value | Usage |
|---|---|---:|---|
| Ink | `--ink` | `#080808` | 기본 배경 |
| Ink raised | `--ink-raised` | `#11100f` | 미디어·확장 영역 |
| Paper | `--paper` | `#e8e0d3` | 제목·핵심 본문 |
| Paper bright | `--paper-bright` | `#f5efe6` | 가장 중요한 활자 |
| Paper muted | `--paper-muted` | `#aaa397` | 설명·메타데이터 |
| Rule | `--rule` | `#3a3733` | 구획선 |
| Rule bright | `--rule-bright` | `#777065` | 포커스 가능한 경계 |
| Editorial red | `--red` | `#ef3f49` | 선택·순서·CTA·핵심 수치. 검정 면의 가는 세리프 숫자에도 식별되는 밝기 |
| Editorial red dark | `--red-deep` | `#95151d` | CTA hover·넓은 마감 면 |
| Success | `--success` | `#3d8d68` | 관리자 성공 상태 |
| Warning | `--warning` | `#c38a39` | 관리자 주의 상태 |

규칙:

- 레드는 장식이 아니라 읽기 순서를 알리는 편집 기호다. 한 화면에서 면적의 약 10%를 넘지 않는다.
- 그라디언트, 네온, 유리 효과는 사용하지 않는다.
- 공개 사이트의 깊이는 그림자 대신 색조 차이, 사진 명도, 선의 밀도로 만든다.

## 3. Typography

| Level | Size | Weight | Line height | Tracking | Usage |
|---|---|---:|---:|---:|---|
| Display XL | `clamp(4.2rem, 12vw, 10.5rem)` | 600 | .9 | -.05em | 영문 이름·마감 CTA |
| Display KR | `clamp(2.35rem, 5.4vw, 5.4rem)` | 400 | 1.45 | -.035em | 한국어 선언문 |
| H1 | `clamp(2.4rem, 5vw, 5rem)` | 600 | 1.02 | -.035em | 섹션 제목 |
| H2 | `clamp(1.5rem, 2.5vw, 2.5rem)` | 500 | 1.15 | -.025em | 항목 제목 |
| Body lead | `clamp(1.05rem, 1.5vw, 1.35rem)` | 400 | 1.85 | -.01em | 철학·소개 |
| Body | `1rem` | 400 | 1.75 | 0 | 설명 |
| Meta | `.75rem` | 600 | 1.35 | .09em | 영문 분류·연도·기관 |
| Index | `clamp(2.1rem, 4vw, 4.5rem)` | 400 | .9 | -.05em | 섹션·증거 번호 |

Font stacks:

- Latin display: `"Playfair Display", Georgia, "Times New Roman", serif` — 패션 에디토리얼 인상은 유지하되 굵은 획과 넓은 카운터로 큰 제목을 더 쉽게 식별한다.
- Korean editorial: `"Gowun Batang", "Batang", serif`
- Korean statement: `\"Gowun Batang\", \"Batang\", serif`, 400 — 첫 화면 선언문에만 사용하고, 넉넉한 행간으로 명조의 고전적인 인상과 식별성을 함께 유지한다.
- Operational microcopy: `"Arial Narrow", "Aptos Narrow", "Helvetica Neue", sans-serif`

세 계열은 역할이 겹치지 않아 예외적으로 함께 사용한다. `Pretendard`, `Noto Sans`, `Inter`, `Poppins`, `Montserrat`는 사용하지 않는다. 한국어 제목은 조사나 한 글자 종결어가 외따로 남지 않도록 폭과 글자 크기를 조절한다.

## 4. Spacing & Layout

Base unit: `4px`.

| Token | Value | Usage |
|---|---:|---|
| `--space-1` | `4px` | 인덱스와 선 |
| `--space-2` | `8px` | 작은 메타 그룹 |
| `--space-3` | `12px` | 버튼 안쪽 간격 |
| `--space-4` | `16px` | 모바일 기본 간격 |
| `--space-6` | `24px` | 카드·행 간격 |
| `--space-8` | `32px` | 그룹 사이 |
| `--space-10` | `40px` | 섹션 내부 |
| `--space-12` | `48px` | 태블릿 구획 |
| `--space-16` | `64px` | 모바일 섹션 |
| `--space-20` | `80px` | 데스크톱 섹션 |

| `--space-24` | `96px` | 강한 장면 전환 |

V5 component aliases:

| Token | Value | Usage |
|---|---:|---|
| `--type-proof-ledger-title` | `clamp(1.35rem, 2.4vw, 2rem)` | PROOF 제목 |
| `--proof-ledger-row-min-height` | `104px` | 데스크톱 이력 행 |
| `--proof-ledger-index-column` | `72px` | 데스크톱 이력 번호 열 |
| `--lecture-layout-showcase-min` | `420px` | 강의 슬라이드 열 최소 폭 |
| `--lecture-ledger-index-column` | `64px` | 데스크톱 강의 연도 열 |
| `--contact-panel-card-min` | `360px` | 연락처 카드 열 최소 폭 |
| `--proof-ledger-row-min-height-mobile` | `88px` | 모바일 전체 이력 행 |
| `--proof-ledger-index-column-mobile` | `52px` | 모바일 전체 이력 번호 열 |
| `--proof-hero-index-column-mobile` | `56px` | 모바일 핵심 이력 번호 열 |
| `--lecture-ledger-index-column-mobile` | `48px` | 모바일 강의 연도 열 |


### Implementation token registry

운영 진입점은 기능별 후속 레이어를 순서대로 불러오지만 토큰 소유권은 다음 네 묶음으로 제한한다. 후속 레이어는 기존 토큰을 재정의하거나 아래 역할의 의미 토큰만 추가하며, 색·공통 치수·전환을 선택자 안의 임의 값으로 새로 만들지 않는다.

| Owner | Token families | Responsibility |
|---|---|---|
| editorial.css | --ink*, --paper*, --red*, --rule*, --font-*, --space-*, --timing-*, --gutter, --content | 전역 색·글꼴·간격·동작 |
| editorial-v2.css | --type-*-readable, --instagram-*, --hero-portrait-*, --radius-instagram | 가독성·Instagram·인물 사진 |
| editorial-v3.css | --type-*, --ratio-*, --control-*, --carousel-*, --proof-*, --lecture-*, --contact-* | 공개 컴포넌트 치수·비율 |
| admin-content-v12.css, admin-content-v13.css | --admin-*, --type-admin-* | 관리자 원장·편집창·배포 콘솔 |

공통 프레임 토큰은 --nav-height, --proof-card-min-height, --hero-portrait-min-height, --manifesto-portrait-max-height로 관리한다. 관리자 오버레이와 깊이는 --admin-dialog-backdrop, --admin-dialog-backdrop-soft, --admin-publish-shadow, --admin-login-width가 소유한다. 픽셀 값이 남을 수 있는 곳은 아이콘의 선 좌표, 1px 구획선, 브레이크포인트처럼 재사용 가치가 없는 국소 표현뿐이다.

- Max content width: `1440px`; 기본 좌우 gutter는 `clamp(20px, 4vw, 64px)`.
- Desktop: 12 columns / 24px gutter. Tablet: 8 columns / 20px gutter. Mobile: 4 columns / 16px gutter.
- Breakpoints: 640 / 768 / 1024 / 1280px.
- 공개 사이트는 문서 자체가 스크롤 소유자다. 고정 헤더 외에 세로 중첩 스크롤을 만들지 않는다.
- 비대칭은 사진과 활자 사이의 긴장을 위한 것이다. 텍스트 가독 영역은 약 38–68자를 유지한다.

## 5. Components

### Editorial Navigation
- **Structure**: 로고, 동일 페이지 앵커, 모바일 메뉴 버튼.
- **Variants**: transparent, scrolled, mobile-open.
- **States**: hover/active는 얇은 레드 선, focus-visible은 상아색 외곽선.
- **Accessibility**: 모바일 버튼에 `aria-expanded`; 메뉴가 열리면 명확한 닫기 상태.
- **Motion**: opacity와 transform만 사용, 220ms.
- **Layout**: cluster; 모바일 메뉴는 문서 흐름에 배치.

### Proof Ledger
- **Structure**: 순번, 제목, 선택적 링크. 제목 안의 관리자 줄바꿈은 공개면에서도 그대로 유지한다. 분류·기관·보조 문구는 공개면과 관리자 필수 입력에서 제외한다.
- **Variants**: full-index, admin-row.
- **States**: 링크 행은 hover 시 제목 색과 화살표 이동, focus-visible 외곽선.
- **Accessibility**: 의미 있는 순서의 `<ol>`; 링크가 없으면 비상호작용 요소.
- **Motion**: 링크 화살표 transform 160ms.
- **Layout**: 공개면은 세로 full-index ledger만 사용해 같은 이력을 두 번 노출하지 않는다.

### Admin Book Order
- **Structure**: 순번, 책 제목·출판 정보, 드래그 핸들, 키보드 이동 버튼, 저장 상태.
- **States**: default, dragging, dirty, saved, focus-visible.
- **Accessibility**: 드래그를 사용하지 않아도 위·아래 버튼만으로 전체 순서를 편집할 수 있다.
- **Layout**: desktop은 한 행, mobile은 정보 아래에 이동 버튼을 배치한다.

### Editorial Media Frame
- **Structure**: 고정 비율 figure, image, caption.
- **Variants**: portrait, landscape, book, press.
- **States**: 링크형만 hover 시 이미지 scale 1.018.
- **Accessibility**: 의미 있는 alt와 시각적으로 연결된 figcaption.
- **Motion**: transform 500ms, reduced-motion에서 제거.
- **Layout**: intrinsic aspect-ratio; 모든 이미지에 width/height 또는 비율 지정.

### Topic Index
- **Structure**: topic button list, 현재 선택 레드 밑줄, 필터 결과 ledger.
- **Variants**: desktop wrap, mobile horizontal-scroll.
- **States**: default, hover, selected, focus-visible, empty.
- **Accessibility**: `aria-pressed`; 결과 변경은 별도 제목으로 식별.
- **Motion**: opacity 180ms; 필터 결과 레이아웃 자체는 움직이지 않는다.
- **Layout**: mobile에서 topic 행만 가로 스크롤을 허용한다.

### Text Link / CTA
- **Structure**: label + arrow; 최종 Instagram CTA는 넓은 레드 면.
- **Variants**: text, inverse, red-panel.
- **States**: hover, active, focus-visible, disabled.
- **Accessibility**: 최소 터치 높이 44px, 명시적 링크 목적.
- **Motion**: 화살표 transform 160ms, active scale .99.
- **Layout**: cluster.

### Admin Guidance Panel
- **Structure**: 목적, 추천 유형 목록, 4/10 운영 규칙, 현재 개수.
- **Variants**: info, warning, complete.
- **States**: 정적 안내; 경고 상태는 색과 텍스트를 함께 사용.
- **Accessibility**: 제목과 목록의 의미 구조, 색만으로 상태 구분 금지.
- **Motion**: 없음.
- **Layout**: stack.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|---|---:|---|---|
| Micro | 160ms | ease-out | 링크·버튼 |
| Standard | 220ms | ease-in-out | 모바일 메뉴·필터 |
| Emphasis | 520ms | cubic-bezier(.16,1,.3,1) | 첫 장면·사진 reveal |

- 대표 동작은 첫 화면 활자와 사진의 절제된 fade-through 한 번이다.
- 스크롤 reveal은 정보의 시작을 알릴 때만 사용하며 반복하지 않는다.
- `prefers-reduced-motion: reduce`에서 모든 비필수 transition과 animation을 끈다.
- 부드러운 앵커 스크롤은 reduced-motion에서 즉시 이동으로 전환한다.

## 7. Depth & Surface

Strategy: tonal-shift + rules.

- 기본 면은 `--ink`, 사진/확장 정보는 `--ink-raised`.
- 카드 그림자는 사용하지 않는다.
- 구분은 `1px solid var(--rule)`과 사진의 명도 차이로 만든다.
- 전체 배경에는 1% 이하의 미세 종이 입자감을 CSS 패턴으로만 더한다.
- 모서리는 기본 0; 이미지나 버튼도 잡지 지면처럼 각을 유지한다.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA 목표. 본문 대비 4.5:1, 큰 글자·UI 경계 3:1 이상.
- 모든 조작 요소는 키보드로 접근 가능하고 `:focus-visible`이 보인다.
- 모바일 터치 대상 최소 44×44px.
- 이미지 alt는 실제 기록을 설명하고, 장식 이미지는 빈 alt를 사용한다.
- 375px에서 기본 콘텐츠의 가로 스크롤이 없어야 한다. Topic Index만 예외다.
- 한국어 제목의 외톨이 음절, 잘린 받침, 너무 긴 4행 이상 hero를 허용하지 않는다.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|---|---|---|---|
| 관리자 전체 시각 개편 | `admin.html` | 이번 초안은 핵심 이력 CRUD와 가이드 추가를 우선하고 기존 관리 기능의 스타일은 보존 | 공개 사이트 방향 확정 후 별도 관리자 개편 |
| 외부 웹폰트 의존 | `index.html` | 초안의 타이포 방향을 빠르게 검증하기 위함 | 최종 배포 전 필요한 서브셋을 로컬 자산으로 전환 |



## 9. V3 Media, Curation & Readability Extension

### Brief and hierarchy

- 방문자의 결정 경로는 `첫인상 → 핵심 증거 → 저서·온라인 강의 → 실제 영상 → 대표 강의 슬라이드 → 전체 기록 → Instagram`이다.
- 강의 슬라이드와 영상 썸네일은 장식이 아니라 작업의 증거다. 어떤 viewport에서도 원본의 네 모서리와 활자를 자르지 않는다.
- 강의 첫 탭은 기본값 `TITLE`을 사용하고 관리자에서 24자 이내로 바꿀 수 있다.
- 첫 탭 포함과 `주제별 목록에 표시`는 서로 독립된 상태다. 새 강의는 기본적으로 주제별 목록에는 보이고 첫 탭에는 포함되지 않는다.

### Audience and task constraints

- 협업 검토자: 첫 화면과 핵심 증거를 빠르게 훑고, 영상·슬라이드 원본을 확인한 뒤 Instagram 또는 이메일로 이동한다.
- 모바일 방문자: 375px 한 손 스크롤에서도 영상 한 장과 제목을 온전히 읽고, 캐러셀을 터치 또는 버튼으로 넘긴다.
- 관리자: 마우스 드래그 또는 키보드 이동 버튼으로 대표 다섯 건의 순서를 바꾸고, 두 노출 상태를 각각 변경한다.

### V3 semantic aliases

| Token | Value | Usage |
|---|---:|---|
| `--type-proof-title` | `clamp(1.4rem, 1.9vw, 1.9rem)` | 첫 화면 핵심 이력 본문 |
| `--type-proof-title-mobile` | `clamp(1.45rem, 6vw, 1.7rem)` | 모바일 핵심 이력 본문 |
| `--type-proof-index` | `clamp(2.75rem, 4vw, 4rem)` | 식별 가능한 적색 순번 |
| `--type-contact-lead` | `clamp(1.25rem, 2vw, 1.75rem)` | Contact 전환 문장 |
| `--type-hero-statement` | `clamp(1.75rem, 2.8vw, 2.85rem)` | Hero Korean statement |
| `--type-video-title` | `clamp(1.05rem, 1.3vw, 1.25rem)` | Watch card title |
| `--type-lecture-title` | `clamp(1.05rem, 1.35vw, 1.3rem)` | Lecture ledger title |
| `--type-showcase-title` | `clamp(1.2rem, 1.7vw, 1.55rem)` | Selected lecture heading |
| `--type-contact-aside` | `clamp(1.05rem, 1.4vw, 1.3rem)` | Contact supporting copy |
| `--ratio-presentation` | `16 / 9` | 강의 대표 슬라이드 |
| `--ratio-video` | `16 / 9` | Watch 썸네일 |
| `--carousel-gap` | `24px` | Watch 슬라이드 간격 |
| `--surface-contact-card` | `var(--paper-bright)` | 적색 Contact 안의 검정 활자 카드 |
| `--ink-contact-card` | `var(--ink)` | Contact 카드 본문·링크 |
| `--hero-copy-inset` | `clamp(64px, 8vw, 120px)` | Hero copy top inset |
| `--lecture-row-min-height` | `124px` | Selected lecture ledger row |
| `--lecture-sticky-offset` | `92px` | Desktop gallery sticky offset |
| `--contact-card-inset` | `clamp(28px, 4vw, 52px)` | Instagram card inset |

Admin V3 uses the documented `--type-admin-*`, `--admin-*-min-height`, `--admin-control-size`, and `--admin-checkbox-size` semantic token families for typography, row geometry, and minimum 44px controls.

### Lecture Slide Gallery

- **Structure**: 선택 가능한 강의 ledger + 현재 강의 제목 + 최대 3장의 16:9 슬라이드 gallery.
- **Variants**: 1장 full, 2장 equal, 3장 hero-plus-two.
- **Media**: `object-fit: contain`; 원본 비율을 보존하며 남는 면적만 `--ink-raised`로 채운다.
- **States**: default, selected, hover, focus-visible, empty.
- **Responsive**: desktop은 큰 슬라이드 1장과 작은 슬라이드 2장, mobile은 한 열 scroll-snap gallery.
- **Motion**: 선택 변경은 220ms opacity만 사용하며 reduced-motion에서는 즉시 교체한다.

### Video Carousel

- **Structure**: 이전/다음 버튼, 현재 위치, scroll-snap viewport, 영상 카드.
- **Sizing**: desktop 3장, tablet 2장, mobile 1장. 제목은 줄 수로 자르지 않는다.
- **Media**: `object-fit: contain`; 모든 썸네일을 16:9 프레임 안에서 온전히 노출한다.
- **Input**: 터치/트랙패드 스크롤, 이전/다음 버튼, viewport의 좌우 방향키를 모두 지원한다.
- **Motion**: beui.dev `cylinder-carousel`에서 snap, 즉시 재입력, reduced-motion 원칙만 취하고 3D·자동재생은 사용하지 않는다.
- **Controls**: 이전·다음 버튼은 첫 썸네일과 마지막 썸네일의 바깥 모서리에 10px 겹치고, 시각 상태 숫자는 숨기되 `aria-live` 상태는 유지한다.
- **Media sources**: YES24 구입 링크의 상품 번호는 `image.yes24.com/goods/{id}/XL` 표지로 파생한다. YouTube 원격 썸네일은 16:9 `maxresdefault`를 먼저 사용하고 실패할 때만 `hqdefault`로 되돌린다.

### Contact Conversion Card

- **Structure**: 큰 `SEE THE WORK` 편집 활자 + 상아색 전환 카드.
- **Hierarchy**: 카드 문장은 Body가 아니라 `--type-contact-lead`; Instagram을 검정 면의 주요 CTA로, 이메일을 보조 링크로 둔다.
- **Contrast**: 검정 활자는 상아색 카드 위에서만 사용한다. 적색 면의 작은 검정 글씨는 금지한다.

### Proof hierarchy

- 적색 순번은 Playfair Display 700과 tabular figures를 사용해 작은 화면에서도 획이 사라지지 않게 한다.
- 핵심 이력 카드와 PROOF는 적색 순번과 제목만 표시하며, 제목에 `text-wrap: balance; word-break: keep-all`을 적용한다.
- 모바일 핵심 이력은 순번과 제목을 같은 행에 두고 16px 간격으로 묶는다. 카드 높이로 여백을 만들지 않는다.
- `file:` 문서에서 브라우저 저장소가 차단되어도 기본 큐레이션으로 Watch와 Lectures를 모두 렌더링한다.

### V3 accepted debt

| Item | Location | Why accepted | Owner / Exit |
|---|---|---|---|
| 강의 큐레이션의 운영 관리자 통합 | `admin.html`, `data_v3.js` | 최종 디자인 승인 전 운영 CRUD·Git 저장 경로를 변경하지 않는 비배포 조건 | 사용자 최종 승인 후 운영 관리자 필드와 저장 스키마에 이식 |
| 로컬 초안 상태 저장 | `profileDraft.featuredProofs`, `profileDraft.bookOrder`, `profileDraft.lectureCuration` | localStorage 프로토타입으로 줄바꿈·책 순서·탭 이름과 강의 선정을 검증하며, 쓰기가 제한된 브라우저에서는 예외 대신 재시도 안내를 표시 | 운영 통합 시 기존 관리자 저장 API로 이전 |

## 10. V10 Hero Name & Media Entry Cues

### Identity mark

- Hero의 `MINJAE LEE`는 개별 이니셜 강조 없이 전체를 `--paper-bright` 상아색으로 표시한다. 내비게이션 로고도 같은 색상 계열을 유지한다.
- 문자 구조는 시각적으로 분할하되 접근 가능한 제목은 `MINJAE LEE` 한 문장으로 제공한다.

### Readable metadata

| Token | Value | Usage |
|---|---:|---|
| `--type-card-meta` | `clamp(.9rem, 1vw, 1rem)` | 책 출판사·연도, 온라인 연수원·학점 |
| `--type-book-meta` | `clamp(1rem, 1.15vw, 1.125rem)` | 책 출판사·연도 강화 표기 |
| `--type-lecture-meta` | `clamp(.875rem, .95vw, .95rem)` | 강의 목록의 연도·연수기관 |
| `--type-media-action` | `.76rem` | 썸네일 위 절제된 외부 상세 링크 표식 |
| `--type-instagram-hero` | `clamp(1.125rem, 1.5vw, 1.3rem)` | Hero Instagram CTA 본문 |
| `--type-instagram-kicker` | `.72rem` | Hero Instagram CTA 보조 문구 |
| `--type-proof-creator-mobile` | `clamp(1.15rem, 5.1vw, 1.25rem)` | 모바일 G-Creator 긴 제목 단일 행 |

- 메타정보는 제목보다 작되 375px에서도 육안 식별 가능한 최소 크기와 `--paper-muted-readable` 대비를 유지한다. 책 출판사·연도는 16px 미만으로 내려가지 않는다.
- 데이터에 없는 연도는 추정하지 않는다. 온라인 연수는 현재의 `연수원 · 학점` 구조를 그대로 표시한다.

### Linked media affordance

- 외부 상세 링크가 있는 책·온라인 연수 썸네일만 전체 프레임을 링크로 만든다.
- 우하단 `OPEN ↗`은 검정 면과 1px 경계선으로 조용하게 유지하고, hover·focus-visible에서만 적색으로 전환한다.
- 링크가 없는 미디어에는 표식을 표시하지 않는다. 새 창 링크는 `rel="noopener"`를 유지한다.

### V10 conversion and curation

- Hero Instagram CTA는 상아색 면을 유지하되 본문·아이콘을 키우고, 아이콘·kicker·화살표에만 `--red`를 사용해 첫 화면의 주 전환 경로임을 분명히 한다.
- Hero 아래 핵심 이력 4개 요약은 PROOF와 중복되므로 렌더링하지 않는다.
- 공개 PROOF의 `교사크리에이터협회 G-Creator`는 관리자 데이터의 줄바꿈과 무관하게 한 칸으로 이어 쓰고, 375px에서도 한 줄을 유지한다.
- Watch는 Google Classroom 기초 영상(`wGgF2MSds5E`)을 세 번째로 배치하고, 기존 세 번째와 네 번째 영상을 각각 네 번째와 다섯 번째로 민다. 그 밖의 순서는 유지한다.


## 11. V12 Local Content Operations

### Editing scope and source of truth

- 로컬 관리자 하나에서 핵심 프로필, PROOF, 저서, 온라인 연수, Watch, Lectures, Awards, Activities, Press를 편집한다.
- 배열형 콘텐츠는 모두 추가·수정·삭제·위·아래 이동을 제공한다. 마우스 조작만 가능한 기능을 만들지 않는다.
- 공개 초안은 `profileDraft.contentV1`의 검증된 사본을 우선 사용하고, 저장값이 없거나 손상되면 `data_v3.js`의 안전한 기본값을 사용한다.
- PROOF와 강의 대표 다섯 건은 기존 전용 큐레이션을 유지하되, 삭제된 항목의 ID는 공개 렌더링 전에 제거한다.
- 새 항목을 추가해도 임의의 `slice()` 제한으로 사라지지 않는다. 섹션 제목의 개수도 실제 공개 항목 수에서 계산한다.

### Admin content shell

- **Scroll ownership**: 문서가 유일한 세로 스크롤 소유자다. 상단 섹션 내비게이션만 가로 reel을 허용한다.
- **Structure**: 상태 요약, 섹션 내비게이션, 핵심 프로필, PROOF, 7개 콘텐츠 컬렉션, 저장 안내 순서의 stack이다.
- **Collection row**: 순번, 제목·메타 요약, 공개 상태, 수정, 삭제, 위·아래 이동으로 구성한다.
- **Editor dialog**: 섹션별 필드만 노출하고 필수 제목, URL 형식, 이미지 경로 목록을 저장 경계에서 검증한다.
- **Responsive**: 920px 아래에서 요약과 행동 영역을 한 열로 전환하며, 375px에서 입력·버튼·행이 가로 넘침 없이 44px 터치 높이를 유지한다.
- **Feedback**: dirty, saved, storage-blocked, invalid 상태는 색과 한국어 문구를 함께 사용한다. 저장 실패 시 편집 중인 값과 열린 dialog를 보존한다.

### Content schemas

| Section | Required | Optional |
|---|---|---|
| Profile | 이름, 영문 이름, 선언문, 이메일, Instagram | 프로필 사진 파일, 강의·연수 수치 |
| Books | 제목 | 출판사, 연도, 구입 링크, 표지 경로, 소개 |
| Online courses | 제목, 연수원, 썸네일 | 학점, 링크 |
| Watch | 제목, 영상 링크 | 썸네일 |
| Lectures | 제목, 주제 | 기관, 연도, 링크, 대표 슬라이드 최대 3장 |
| Awards | 제목 | 기관, 연도, 링크 |
| Activities | 제목 | 기간, 링크 |
| Press | 제목 | 매체, 날짜, 링크, 이미지 경로, 소개 |

강의 주제는 `AI`, `Google`, `Canva·에듀테크`, `교사 업무·학급경영`, `학부모·학생 강의`, `강사코칭` 여섯 개를 기본으로 한다.

### Persistence boundary and deployment debt

- 항목 저장은 브라우저 localStorage 기반 초안이며 `CustomEvent`와 `storage` 이벤트로 같은 브라우저 공개 초안을 즉시 갱신한다.
- 상단 전역 저장은 배포된 HTTPS 관리자에서만 인증된 서버 경로를 사용하며, 로컬 파일과 localhost에서는 운영 호출을 거부한다.
- 서버 저장 전에 운영 최신본과 전체 편집 가능 개인정보·컬렉션·PROOF·강의 큐레이션을 비교해 다른 기기 변경을 덮어쓰지 않는다.

### V12 token ownership and stylesheet cascade

공개 초안의 스타일 로드 순서는 의도된 계층이다.

1. `editorial.css`: 색·간격·서체·기본 editorial primitive.
2. `editorial-mobile.css`: 기본 반응형 구조.
3. `editorial-site.css`: 실제 콘텐츠 섹션과 미디어 primitive.
4. `editorial-final.css`: 승인된 상호작용·접근성 보정.
5. `editorial-v2.css`: 가독성·Instagram 전환·메타 크기 alias.
6. `editorial-v3.css`: V3 이후 최종 레이아웃과 모바일 보정.

V12 관리자는 기존 관리자 토큰 위에 `admin-content-v12.css` 한 층만 추가한다. 아래 alias는 콘텐츠 관리 화면의 재사용 단위이며 개별 행에서 숫자를 다시 쓰지 않는다.

| Token family | Ownership |
|---|---|
| `--type-admin-collection-title`, `--type-admin-row-title`, `--type-admin-summary-count` | 관리자 컬렉션 위계 |
| `--admin-row-index-column`, `--admin-row-status-column` | 목록 열 폭 |
| `--admin-summary-card-min-height*`, `--admin-content-row-min-height` | 요약 카드와 행의 최소 높이 |
| `--admin-content-search-max`, `--admin-content-dialog-max` | 검색·편집기의 읽기 폭 |
| `--type-instagram-*`, `--instagram-*`, `--paper-*-readable` | 공개 초안 전환 CTA와 가독성 |

- 밝은 Instagram CTA의 작은 kicker는 `--red-deep`을 사용해 4.5:1 이상의 대비를 유지하고, 검정 면의 큰 적색 포인트는 `--red`를 유지한다.
- V12는 과거 생성 이미지의 픽셀 복제를 목표로 하지 않는다. 현재 semantic DOM과 `.omo/evidence/profile-v12/`의 무결성 매니페스트·반응형 캡처가 검수 기준선이다.
- 비배포 단계에서는 사용자 승인 전 commit을 만들지 않으므로, source/artifact SHA-256 매니페스트가 임시 기준선 역할을 한다.

## 12. V13 Admin Paste & Publish Contract

### Image paste field

- 온라인 연수·Watch·강의 편집기의 이미지 필드는 경로 입력과 `Ctrl+V` 붙여넣기를 함께 제공한다.
- 붙여넣은 이미지는 SVG를 허용하지 않고, 브라우저에서 최대 1600px·900KB 이하 WebP로 축소한 뒤 미리보기·교체·삭제 상태를 제공한다.
- 온라인 연수와 Watch는 대표 이미지 1장, 강의는 대표 슬라이드 최대 3장이다.
- 키보드 포커스, 44px 행동 영역, 텍스트 상태 안내를 제공하며 색만으로 성공·오류를 알리지 않는다.

### Required and optional labels

- 모든 편집 필드 라벨에는 `필수` 또는 `선택`을 명시한다.
- 온라인 연수는 연수명·연수원·썸네일이 필수이며 소개 필드는 노출하지 않는다.
- Watch는 영상 제목·영상 링크가 필수이고 썸네일은 선택이다.
- 강의는 강의명·주제가 필수이며 기관·연도·링크·대표 슬라이드는 선택이고 설명 필드는 노출하지 않는다.

### Publish console

- 관리 화면 상단에는 전역 `운영 사이트 저장 및 배포` 버튼과 idle, validating, uploading, saving, verifying, success, error 상태를 둔다.
- `file:` 로 연 로컬 화면은 운영 저장을 실행하지 않고 배포된 관리자 주소에서 다시 열도록 안내한다.
- 배포된 화면은 기존 HttpOnly 세션·CSRF 보호 API를 사용하고, 이미지 업로드 뒤 데이터와 이미지를 한 Git 커밋으로 저장한다.
- Git 저장과 운영 JSON 확인은 별도 단계로 표시한다. 운영 JSON이 확인되기 전에는 배포 완료 문구를 표시하지 않는다.

### V13 admin tokens

| Token | Usage |
|---|---|
| `--type-admin-field-status` | 필수·선택 배지와 붙여넣기 상태 |
| `--admin-paste-min-height` | 이미지 붙여넣기 영역 최소 높이 |
| `--admin-publish-min-height` | 전역 배포 콘솔 최소 높이 |
| `--admin-dialog-action-height` | 스크롤 편집기의 sticky 저장 영역 |

## 13. Profile Photo Upload & Photo-only Guard

### Existing public flow preservation

- V12의 공개 초안, PROOF, 대표 강의 큐레이션, `storage` 갱신 흐름은 변경하지 않는다.
- 보호 범위는 프로필 사진 하나뿐이다. 기존 브라우저 초안의 `personal.photo`는 `photoDirty`가 명시된 경우에만 공개 미리보기와 운영 저장의 `personal.draftPhoto`를 변경한다.
- 오래된 초안에 `assets/profile.jpg`가 남아 있어도 배포 데이터의 `personal.draftPhoto`를 유지한다. 새 파일을 선택하고 핵심 프로필을 저장한 경우에만 사진 변경을 허용한다.

### Profile Photo Upload

- 핵심 프로필의 사진 경로 텍스트 입력은 노출하지 않는다. PNG, JPEG, WebP, GIF 파일 선택과 현재 사진 미리보기만 제공한다.
- 기존 Image Paste primitive의 파일 검증, 최대 1600px 축소, 900KB 이하 WebP 변환, 상태 문구, 44px 파일 선택 버튼을 재사용한다.
- 새 파일은 로컬 초안에서 미리보기를 제공하고, 전역 운영 저장 시 기존 인증된 이미지 업로드 경로를 통해 고유한 `uploads/` 경로로 치환한다.
- 업로드 또는 운영 저장이 실패하면 기존 `personal.draftPhoto`를 유지한다. 다른 콘텐츠만 수정한 배포는 프로필 사진 필드를 변경하지 않는다.

### Profile Photo states

- **Current**: 현재 배포 사진을 세로 비율 미리보기로 표시한다.
- **Prepared**: 선택한 파일을 최적화한 뒤 운영 저장 시 자동 업로드된다는 상태 문구를 표시한다.
- **Error**: 지원하지 않는 형식이나 크기 실패를 색과 한국어 문구로 함께 알리고 기존 사진을 보존한다.
- **Accessibility**: 파일 입력은 명시적 라벨을 가지며, 상태는 `role="status"`, 미리보기 삭제는 현재 배포 사진으로 복원하는 명확한 버튼 문구를 사용한다.

### V14 admin tokens

| Token | Usage |
|---|---|
| `--admin-profile-preview-max` | 관리자 프로필 사진 미리보기 최대 폭 |
| `--ratio-profile-photo` | 현재 Hero 프로필 사진 비율 |


## 14. Mobile Lecture Discovery & Media Preview

### Archive semantics

- 첫 탭은 `HIGHLIGHTS`로 표시하며 관리자에서 고른 대표 강의 5개만 보여준다. 대표 목록은 전체 강의 수를 뜻하지 않는다.
- 주제 탭은 가로로 스크롤되고 다음 탭의 일부가 화면에 남아 추가 선택지가 있음을 드러낸다.
- 하단 CTA는 개수 없이 정확히 `전체 강의 보기`로 쓴다. 검정 목록에서 충분히 분리되는 상아색 면과 방향 표식으로 링크가 아니라 행동 버튼임을 알린다.
- CTA를 누르면 숨김 처리되지 않은 전체 강의를 같은 목록에서 펼친다. 데이터·대표 강의 큐레이션·관리자 저장 스키마는 변경하지 않는다.

### Mobile lecture row

- 640px 이하에서 각 행은 `연도 / 제목·기관 / 대표 썸네일` 세 열로 구성한다. 대표 이미지는 항상 한 장만 16:9 전체 비율로 보여주며 `object-fit: contain`을 사용한다.
- 행 전체가 선택 버튼이다. 이미지가 두 장 이상이면 썸네일 위에 겹친 이미지 glyph와 개수를 담은 원형 gallery indicator를 표시한다. 단순 화살표는 페이지 이동으로 오해되므로 쓰지 않는다.
- 원형 indicator의 보이는 지름은 32px, 전체 터치 영역은 44px 이상이다. 상아색 면, 검정 glyph, 얇은 적색 keyline을 공통 media control로 사용한다.
- 데스크톱에서는 선택한 강의의 16:9 슬라이드를 오른쪽 한 열에 최대 3장 세로로 쌓아 원본 비율과 내용을 모두 보존한다.

### Lecture gallery dialog

- 모바일에서 이미지가 있는 강의 행을 누르면 새 경로가 아니라 전체 화면 dialog를 연다. 헤더는 닫기, `강의 자료`, 현재 위치를 제공한다.
- 본문은 큰 16:9 이미지 한 장, 이전·다음 원형 control, 하단 thumbnail strip, 강의명·기관 순서다. 썸네일 선택과 좌우 swipe를 지원한다.
- dialog는 `role="dialog"`, `aria-modal="true"`, Escape 닫기, focus trap, 닫은 뒤 원래 행으로 focus 복귀, body scroll 잠금을 제공한다.
- motion은 opacity와 transform만 사용한다. `prefers-reduced-motion`에서는 이동 없이 즉시 전환한다.

### Watch discoverability

- 모바일 Watch 카드는 viewport의 84%를 차지하고 다음 카드 16%가 보이도록 한다. 이 peek는 실제 다음 콘텐츠이며 장식용 복제물이 아니다.
- 이전·다음 control은 lecture gallery와 동일한 원형 media control을 사용하되 썸네일 가장자리에 살짝 겹친다.
- `01 / 17` 형식의 진행상태와 얇은 적색 progress line을 시각적으로 노출한다. 스크린리더용 live status도 유지한다.

### V15 public media tokens

| Token | Value | Usage |
|---|---:|---|
| `--media-control-visible` | `32px` | 원형 media control의 보이는 크기 |
| `--media-control-target` | `44px` | 원형 control의 최소 터치 영역 |
| `--video-card-mobile-basis` | `84%` | 다음 Watch 카드가 보이는 모바일 카드 폭 |
| `--lecture-thumb-mobile` | `clamp(104px, 31vw, 132px)` | 모바일 강의 대표 썸네일 폭 |
| `--lecture-gallery-z` | `80` | 모바일 전체 화면 gallery layer |
