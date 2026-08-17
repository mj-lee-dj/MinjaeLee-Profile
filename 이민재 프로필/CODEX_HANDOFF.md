# 이민재 프로필 사이트 — Codex 인수인계 문서

> 이 문서는 AI 코딩 에이전트(Codex 등)가 이 프로젝트를 이어받아 작업할 때 반드시 숙지해야 할
> 배포 워크플로우, 파일 구조, 캐시 무효화 규칙, 데이터 동기화 방법을 정리한 인수인계 문서입니다.

---

## 1. 프로젝트 개요

| 항목 | 값 |
|---|---|
| **GitHub 저장소** | https://github.com/mj-lee-dj/MinjaeLee-Profile.git |
| **브랜치** | `main` (단일 브랜치) |
| **배포 플랫폼** | Vercel (GitHub 연동 자동 배포) |
| **라이브 URL** | https://minjae-lee-profile.vercel.app/ |
| **사이트 루트 폴더** | `profile-site/` |
| **프레임워크** | 없음 — 순수 HTML/CSS/JS (빌드 과정 없음) |

---

## 2. 배포 워크플로우 (★ 가장 중요)

### 배포 원리
`main` 브랜치에 `git push`가 발생하면 → Vercel이 자동으로 감지하여 재배포합니다.
빌드 과정이 없는 정적 사이트이므로, 보통 **30초~90초** 이내에 반영됩니다.

### AI 에이전트(Codex)의 배포 흐름

```
1. 파일 수정 (index.html, style.css, script.js, data_v3.js 등)
2. 캐시 버스팅 파라미터 갱신 (★ 아래 섹션 참조)
3. git add <수정된 파일들>
4. git commit -m "영어로 작성한 커밋 메시지"
5. git push origin main
6. 약 30~90초 대기 후 https://minjae-lee-profile.vercel.app/ 에서 확인
```

### 반드시 지켜야 할 규칙

1. **커밋 메시지는 반드시 영어로 작성** — Windows cmd/PowerShell의 한글 인코딩 이슈로 한글 커밋 메시지 사용 시 깨짐
2. **Vercel CLI 사용 금지** — 한글 컴퓨터명으로 인해 CLI 로그인 불가. 반드시 `git push` 기반 배포만 사용
3. **로컬 수정 전 반드시 `git pull origin main`** — 관리자 페이지(admin.html)에서 직접 GitHub에 커밋하는 경우가 있으므로, 로컬과 원격이 불일치할 수 있음

---

## 3. 캐시 버스팅 (Cache Busting) — ★★★ 매우 중요

### 왜 필요한가?
이 사이트는 정적 파일로만 구성되어 있어, 브라우저가 이전 버전의 CSS/JS를 캐시에서 재사용하여
**수정 사항이 사용자에게 보이지 않는 문제**가 반복적으로 발생했습니다.

### 캐시 버스팅 방법
`index.html` 내에서 `style.css`, `script.js`, `data_v3.js`를 로드할 때 `?v=` 쿼리 파라미터를 사용합니다.

**파일을 수정할 때마다, 해당 파일의 `?v=` 파라미터 값을 반드시 변경해야 합니다.**

#### 현재 구조 (index.html 내)

```html
<!-- head 태그 안 -->
<link rel="stylesheet" href="style.css?v=20260809_v700" />

<!-- body 닫기 직전 -->
<script src="data_v3.js?v=20260809_v700"></script>
<script src="script.js?v=20260809_v700"></script>
```

#### 갱신 규칙

| 수정한 파일 | 갱신할 파라미터 |
|---|---|
| `style.css` 수정 | `style.css?v=` 파라미터 변경 |
| `script.js` 수정 | `script.js?v=` 파라미터 변경 |
| `data_v3.js` 수정 | `data_v3.js?v=` 파라미터 변경 |
| 위 파일 중 2개 이상 수정 | 해당 파일들의 파라미터 모두 변경 |

#### 파라미터 값 네이밍 컨벤션

```
YYYYMMDD_vNNN
```

- `YYYYMMDD` = 작업 날짜 (예: 20260817)
- `vNNN` = 해당 날짜 내 버전 순번 (v100, v200, v300, ...)

예시: `20260817_v100` → `20260817_v200` → `20260817_v300`

#### ⚠️ 주의: admin.html 자동 갱신 로직

관리자 페이지(`admin.html`)에서 "저장 & 배포" 시, index.html 내 `?v=` 파라미터를
JavaScript `Date.now()` 타임스탬프로 자동 교체하는 로직이 포함되어 있습니다 (L998~L1002).
이 로직은 `data_v3.js`, `style.css`, `script.js` 세 파일 모두를 커버합니다.

---

## 4. 파일 구조

```
이민재 프로필/
├── .agents/
│   └── AGENTS.md              # 작업 규칙 (이 문서의 요약 버전)
├── CODEX_HANDOFF.md           # 이 문서 (Codex 인수인계)
└── profile-site/              # ★ 사이트 루트 (Vercel이 서빙하는 폴더)
    ├── index.html             # 메인 HTML (캐시 파라미터 여기서 관리)
    ├── style.css              # 전체 CSS (1줄 ~2030줄, !important 다수 포함)
    ├── script.js              # 데이터 렌더링 JS (data_v3.js의 profileData를 DOM에 삽입)
    ├── data_v3.js             # ★ 메인 데이터 파일 (const profileData = {...})
    ├── data_v3.json           # ★ JSON 백업 (data_v3.js와 동일 내용, 반드시 동기화)
    ├── admin.html             # 관리자 페이지 (GitHub API 직접 커밋 기능 포함)
    ├── assets/                # 정적 에셋 (프로필 사진, 자격증 아이콘 등)
    │   ├── profile.jpg        # 히어로 배경 프로필 사진
    │   ├── profile2.jpg       # About Me 프로필 사진
    │   ├── official_innovator.png    # Google Certified Innovator 공식 로고
    │   ├── official_trainer.png      # Google Certified Trainer 공식 로고
    │   ├── official_geg_leader.png   # GEG Leader 공식 로고
    │   ├── official_gemini.png       # Gemini Teacher Trainer 공식 로고
    │   └── badge_*.svg               # (구버전 SVG, 현재 미사용)
    └── uploads/               # 동적 이미지 (보도자료 썸네일, 저서 표지 등)
        └── *.png / *.jpg
```

---

## 5. 데이터 구조 (data_v3.js)

### 파일 형식

```javascript
const profileData = {
  personal: { ... },      // 이름, 직함, 자격증, 연락처, aboutTitle, bio
  expertise: [ ... ],     // 전문분야 목록
  publications: [ ... ],  // 저서/출판물
  onlineCourses: [ ... ], // 원격 연수
  awards: [ ... ],        // 수상 내역
  activities: [ ... ],    // 주요 활동
  lectures: [ ... ],      // 강의/연수 이력 (60건+)
  youtubeVideos: [ ... ], // 유튜브 영상
  press: [ ... ]          // 보도자료 (12건)
};

if (typeof window !== 'undefined') {
  window.profileData = profileData;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = profileData;
}
```

### data_v3.js ↔ data_v3.json 동기화 방법

두 파일은 **항상 동일한 데이터**를 담고 있어야 합니다. data_v3.js 수정 후:

```bash
node -e "const d = require('./profile-site/data_v3.js'); const fs = require('fs'); fs.writeFileSync('profile-site/data_v3.json', JSON.stringify(d, null, 2), 'utf8'); console.log('synced');"
```

⚠️ data_v3.json 동기화를 빼먹으면, 관리자 페이지에서 불러온 데이터와 불일치가 생길 수 있습니다.

---

## 6. CSS 아키텍처 주의사항

### !important 사용
`style.css` 후반부(약 1640행~)에 전면 개편 CSS가 `!important`를 사용합니다.
이는 상단의 기존 CSS와의 충돌을 방지하기 위한 의도적인 설계입니다.

### 구조
```
style.css 구조:
├── L1~L80: CSS 변수 정의 (:root)
├── L80~L1630: 원본 레이아웃 CSS
└── L1640~L2030: 전면 개편 CSS (2026.08 리디자인, !important 다수)
```

새로운 스타일을 추가할 때는 **파일 맨 아래(2030행 이후)에 추가**하되,
기존 속성을 오버라이드해야 하는 경우 `!important`를 사용하세요.

---

## 7. script.js 핵심 로직

`script.js`는 `data_v3.js`에서 `profileData` 객체를 읽어 DOM에 동적으로 삽입합니다.

### 주요 렌더링 영역
| DOM ID | 데이터 소스 | 설명 |
|---|---|---|
| `heroStats` | lectures, publications, awards, press | 히어로 하단 통계 (100건+, 4권 등) |
| `aboutBio` | personal.bio | About Me 본문 |
| `aboutTitle` | personal.aboutTitle | About Me 제목 |
| `credentialList` | personal.credentials | 주요 자격 (4종 구글 뱃지) |
| `pubGrid` | publications | 저서 카드 |
| `courseGrid` | onlineCourses | 원격 연수 카드 |
| `awardList` | awards | 수상 내역 |
| `activityList` | activities | 주요 활동 |
| `lecGrid` | lectures | 강의/연수 카드 (필터 기능 포함) |
| `pressGrid` | press | 보도자료 카드 |
| `ytGrid` | youtubeVideos | 유튜브 캐러셀 |

### 자격증 아이콘 매칭 로직 (L80~L110)
`credentials` 문자열에 따라 아이콘 이미지를 자동 매칭합니다:
- `"Innovator"` 포함 → `assets/official_innovator.png`
- `"Certified Trainer"` 포함 → `assets/official_trainer.png`
- `"Leader"` 또는 `"GEG"` 포함 → `assets/official_geg_leader.png`
- `"Gemini"` 포함 → `assets/official_gemini.png`

---

## 8. 보도자료 (press) 이미지 처리

보도자료 항목의 썸네일 이미지는 두 가지 필드로 관리됩니다:

```json
{
  "image": "uploads/some_image.png",
  "images": ["uploads/some_image.png"]
}
```

- `image`: 단일 대표 이미지 경로
- `images`: 이미지 배열 (첫 번째 항목이 썸네일로 사용)
- 이미지가 없는 경우: 두 필드 모두 빈 값 (`""`, `[]`)

새 이미지를 추가할 때는 `profile-site/uploads/` 폴더에 저장하고,
상대 경로(`uploads/파일명.png`)로 참조합니다.

---

## 9. 자주 하는 작업 레시피

### A. CSS/디자인 수정
```bash
# 1. 최신 코드 받기
git pull origin main

# 2. style.css 수정
# (파일 맨 아래에 새 스타일 추가)

# 3. index.html 캐시 파라미터 갱신
# style.css?v=20260817_v100 → style.css?v=20260817_v200

# 4. 커밋 & 배포
git add profile-site/style.css profile-site/index.html
git commit -m "style: description of changes"
git push origin main
```

### B. 데이터(강의/보도자료 등) 수정
```bash
# 1. 최신 코드 받기
git pull origin main

# 2. data_v3.js 수정

# 3. data_v3.json 동기화
node -e "const d = require('./profile-site/data_v3.js'); require('fs').writeFileSync('profile-site/data_v3.json', JSON.stringify(d, null, 2)); console.log('synced');"

# 4. index.html 캐시 파라미터 갱신
# data_v3.js?v= 값 변경

# 5. 커밋 & 배포
git add profile-site/data_v3.js profile-site/data_v3.json profile-site/index.html
git commit -m "data: description of changes"
git push origin main
```

### C. 이미지 추가/교체
```bash
# 1. 이미지 파일을 profile-site/uploads/ 또는 profile-site/assets/에 저장
# 2. data_v3.js 또는 index.html에서 참조 경로 설정
# 3. 캐시 파라미터 갱신
# 4. git add/commit/push
```

---

## 10. 트러블슈팅 체크리스트

| 증상 | 원인 | 해결 |
|---|---|---|
| 수정했는데 사이트에 반영 안 됨 | 캐시 버스팅 파라미터 미갱신 | `?v=` 파라미터 새 값으로 교체 후 재배포 |
| `git push` 실패 | 원격과 로컬 불일치 | `git pull origin main` 후 재시도 |
| 관리자 페이지 저장 후 데이터 유실 | admin.html 버그 (2026.08 발견) | 로컬 `data_v3.js`로 복구 후 push |
| 보도자료 썸네일 안 보임 | `image`/`images` 필드 누락 | 두 필드 모두 경로 지정 |
| 모바일에서 글자 잘림/줄바꿈 이상 | `word-break: keep-all` 미적용 | 해당 요소에 `word-break: keep-all !important` 추가 |
| Vercel CLI 로그인 실패 | 한글 컴퓨터명 문제 | CLI 사용하지 말 것, `git push`만 사용 |

---

## 11. 현재 마지막 캐시 버전 상태

```
style.css?v=20260809_v700
data_v3.js?v=20260809_v700
script.js?v=20260809_v700
```

다음 작업 시 `20260817_v100`부터 시작하면 됩니다 (작업 날짜에 맞게 조정).

---

## 12. 모든 설명과 주석은 한글로

사용자의 전역 규칙: **모든 설명과 주석은 한글로 작성해 주세요.**
단, **커밋 메시지만 영어**로 작성합니다 (cmd 인코딩 이슈).

---

*최종 업데이트: 2026-08-17*
