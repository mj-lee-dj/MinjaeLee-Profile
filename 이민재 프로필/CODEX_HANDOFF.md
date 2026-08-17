# 이민재 프로필 사이트 — Codex 상세 인수인계

- 마지막 검증: 2026-08-17 KST
- 상태: 관리자 서버 함수·Production 환경변수·재배포 완료, 실제 저장 E2E 전 HOLD
- 이 문서는 2026-08-17 감사와 이후 복구 이력을 함께 보존한다. 현재 상태와 다음 작업은 `HANDOFF.md`를 우선한다.

## 1. 현재 핵심 결론

공개 사이트와 관리자 서버 함수는 정상 배포됐고, 오래된 복제 경로·공개 비밀번호·브라우저 GitHub PAT 저장 문제는 해결됐다. Production 필수 환경변수 3개 설정과 `67bb810` 재배포도 완료됐지만 실제 저장→GitHub→Vercel→공개 사이트 E2E 검증 전까지 관리자 저장은 HOLD다.

| 구분 | 정확한 값 |
|---|---|
| Git 저장소 루트 | 기기별 clone에서 `git rev-parse --show-toplevel`로 확인 |
| 프로젝트 루트 | `<Git 저장소 루트>/이민재 프로필` |
| Vercel Root Directory | `이민재 프로필/profile-site` |
| 운영 데이터 원본 | `이민재 프로필/profile-site/data_v3.js` |
| 오래된 복제본 | 저장소 루트 `profile-site/` 추적 파일 제거 완료 |
| 브랜치 | `main` |
| 운영 URL | `https://minjae-lee-profile.vercel.app/` |

## 2. 2026-08-17 18:32 감사 당시 Git·배포 상태

- 현재 HEAD/원격 main: `3ee571b1f2f70b15c962145a92409523a8e0aa7a`
- 커밋 시각: 2026-08-17 18:32:32 KST
- 이 커밋은 `.agents/AGENTS.md`와 `CODEX_HANDOFF.md`만 추가했고 사이트 루트는 변경하지 않았다.
- GitHub의 Vercel status는 success이며 대상 배포 ID는 `J2cX7EQv2e9b1iAVeD264GWVrbQD`다.
- 실제 공개 콘텐츠의 마지막 변경 커밋은 `b4dd583`이다.
- `main`은 보호 규칙이 없고, Deployment Check·Deploy Hook도 없다.
- GitHub Release/Tag와 GitHub Pages는 사용하지 않는다.

Vercel 설정:

- Framework Preset: Other
- Build/Install/Output/Development 명령 재정의: 없음
- Production branch: `main`
- Root Directory: `이민재 프로필/profile-site`
- 프로젝트 환경변수: 없음
- Git LFS: 꺼짐
- `main` push는 Production 배포를 만든다.

## 3. 실제 파일과 데이터 구조

사이트는 패키지 설치나 컴파일이 없는 정적 HTML/CSS/JavaScript다.

```text
이민재 프로필/
├─ .agents/AGENTS.md
├─ HANDOFF.md
├─ CODEX_HANDOFF.md
└─ profile-site/
   ├─ index.html
   ├─ admin.html
   ├─ data_v3.js       # 공개 런타임 원본
   ├─ data_v3.json     # 현재는 보조/백업본, 런타임 미사용
   ├─ script.js
   ├─ style.css
   ├─ assets/
   └─ uploads/
```

현재 정상 데이터:

| 영역 | 개수 |
|---|---:|
| YouTube | 16 |
| 전문 분야 | 8 |
| 출판물 | 4 |
| 온라인 강좌 | 3 |
| 강의 | 60 |
| 수상 | 5 |
| 활동 | 11 |
| 보도 | 12 |

공개 페이지의 실제 주요 DOM ID는 `pubRow`, `courseRow`, `awardsList`, `actList`, `pressList`, `youtubeVideosContainer` 등이다. 과거 문서의 `pubGrid`, `courseGrid`, `awardList`, `pressGrid`, `ytGrid` 표기는 틀렸다.

## 4. Source of truth

- 콘텐츠: `profile-site/data_v3.js`
- JSON 보조본: `profile-site/data_v3.json`
- 고정 프로필 이미지: `profile-site/assets/profile.jpg`, `profile2.jpg`
- 콘텐츠 이미지: `profile-site/uploads/`와 데이터의 상대경로
- 코드·영구 이력: GitHub `main`
- 실제 사용자 결과: Vercel Production alias

`data_v3.json`은 공개 페이지나 현재 관리자 페이지가 읽지 않는다. 제거 여부가 결정되기 전까지는 JS에서 생성해 의미상 동일하게 유지한다.

## 5. 개선 전 관리자 문제 — 해결 이력

아래 경로와 동작은 수정 전 코드의 기록이며 현재 구현에는 적용되지 않는다. 현재 상태는 `HANDOFF.md`와 `ADMIN_RUNBOOK.md`를 따른다.

```text
FILE_PATH = profile-site/data_v3.js
이미지 저장 = profile-site/uploads/...
캐시 갱신 = profile-site/index.html
```

Vercel이 실제 배포하는 경로:

```text
이민재 프로필/profile-site/data_v3.js
이민재 프로필/profile-site/uploads/...
이민재 프로필/profile-site/index.html
```

개선 전 관리자 초기화는 GitHub의 오래된 복제본을 다시 불러왔고, 복제본은 강의 54건·보도 10건으로 정상 원본 60건·12건보다 적었다. 이 문제 때문에 저장 경로를 교정하고 오래된 추적 복제본을 제거했다.

추가 문제:

- 공개 HTML의 하드코딩된 비밀번호는 실질 인증이 아니다.
- `admin_auth`, `gh_token`, Gemini API 키, Google Client ID가 localStorage에 저장된다.
- 기존 안내는 광범위한 GitHub `repo` 권한을 요구한다.
- 로그아웃은 인증 상태와 GitHub 토큰을 지우지 않는다.
- JS만 저장하고 JSON은 갱신하지 않는다.
- 편집·순서 변경이 많은 개별 커밋과 Production 배포를 만든다.
- 사용자 콘텐츠가 `innerHTML`로 렌더링돼 입력 검증이 필요하다.

## 6. 과거 경위

| 시점 | 확인 내용 |
|---|---|
| 2026-02 | 사이트가 저장소 루트 `profile-site/`에서 시작했고 관리자 GitHub 직접 저장 경로도 여기에 맞춰 작성됨 |
| 2026-06-21 | 데이터·이미지 복원 커밋 `167b375`, `b51bb35`, `a42682f` 존재. 정확한 최초 유실 원인은 확인 불가 |
| 2026-06-22 | `1f545fd`에서 Vercel Root 불일치 대응, `af76fbb`에서 `이민재 프로필/profile-site`를 단일 원본으로 선언 |
| 2026-07-02 | 관리자 상수를 고치지 않아 `profile-site/data_v3.js`에 다시 9회 저장 |
| 2026-08-09 | 불완전한 관리자 데이터로 강의 6건·보도 2건이 누락됐고 `3d7f039`에서 복원 |
| 2026-08-09 | `b4dd583`까지 디자인·이미지 변경 완료 |
| 2026-08-17 | `3ee571b`이 오래된 경로를 전제로 한 문서를 추가. Vercel 배포는 성공했으나 사이트 파일은 미변경 |

`af76fbb`에서 `/profile-site/`를 `.gitignore`에 넣었지만 당시에는 추적된 파일이 제거되지 않았다. 이후 오래된 데이터 1개와 이미지 10개, 총 11개 추적 파일을 제거해 원본을 단일화했다.

안티그래비티 보고서의 “2026-08-09 복구 시 force push”는 현재 선형 Git 그래프와 reflog만으로 실행 여부를 입증할 수 없다. 향후 복구 절차에는 force push를 사용하지 않는다.

## 7. 외부 서비스와 비밀정보

- GitHub: 원격 저장소, 자동 배포 트리거, 현재 관리자 저장 API
- Vercel: Production 정적 호스팅
- Google Drive/Picker/OAuth, Gemini: 관리자 보조 기능
- Microlink/noembed/YouTube/Google Fonts/jsDelivr: 미디어·메타데이터·정적 자원

로컬 `.agent/mcp-google-workspace/credentials.json`과 `token.json`에 OAuth 비밀이 있다. Git에는 추적되지 않으며 사이트 런타임과 무관하다. 실제 값은 문서나 로그에 남기지 않는다.

## 8. 표준 수정·배포 Runbook

1. 프로젝트 `HANDOFF.md`를 읽는다.
2. `git rev-parse --show-toplevel`로 Git 루트를 확인하고 프로젝트가 그 아래 `이민재 프로필`인지 검증한다.
3. 브랜치, 원격 차이, 사용자 변경, 미추적 파일을 확인한다.
4. 더러운 작업 트리에서 무조건 pull하지 않는다. fetch 후 안전한 fast-forward 가능 여부를 판단한다.
5. `이민재 프로필/profile-site/`의 정확한 원본만 수정한다.
6. 데이터 변경 시 JS 구문·ID·개수·이미지 참조를 검사하고 JSON을 동기화한다.
7. CSS/JS/data 변경 시 `index.html`의 해당 `?v=` 값을 고유 값으로 갱신한다.
8. 로컬 정적 서버에서 데스크톱·모바일·콘솔·깨진 이미지·주요 카드 수를 확인한다.
9. Git 저장소 루트 기준 정확한 파일만 스테이징한다. `git add .`는 금지한다.
10. staged diff에 비밀값, 오래된 `profile-site/`, 다른 프로젝트가 없는지 확인한다.
11. 사용자가 배포를 요청한 경우에만 영어 관례의 커밋 메시지로 commit/push한다.
12. GitHub Vercel status와 Production Ready를 확인한다.
13. 운영 도메인에서 콘텐츠·이미지·콘솔·캐시를 다시 확인한다.
14. 커밋·배포·검증 결과를 `HANDOFF.md`에 반영한다.

Vercel CLI 54.14.5는 이 PC의 한글 컴퓨터명이 HTTP 헤더 값으로 처리되며 실패한 기록이 있다. 현재 운영 배포는 GitHub 연동을 표준으로 쓴다. CLI가 영구적으로 불가능하다는 뜻은 아니지만, 재검증 없이 운영 배포에 사용하지 않는다.

## 9. CSS와 캐시 규칙 정정

- 현재 `style.css`는 2038줄이다. 줄 번호는 변경 때마다 달라지므로 대략적인 구간을 운영 규칙으로 삼지 않는다.
- 새 CSS를 무조건 파일 끝에 붙이지 않는다.
- `!important`는 기존 우선순위를 이해한 뒤 불가피할 때만 좁게 사용한다.
- 중복 규칙은 가능한 한 정리하고 컴포넌트 범위를 명확히 한다.
- 변경한 CSS/JS/data 파일의 `?v=`만 갱신한다.
- 현재 `20260809_v700`은 현 상태의 값일 뿐 다음 버전이 반드시 `v800`이어야 하는 것은 아니다.
- 배포 후 실제 정적 파일과 화면을 확인해야 하며, 임의 대기 시간만으로 성공을 판단하지 않는다.

## 10. 롤백

긴급 복구:

1. Vercel에서 직전 정상 Ready 배포를 찾는다.
2. Promote 또는 Instant Rollback으로 Production alias를 임시 복구한다.
3. 이 조치는 Git `main`을 고치지 않는다는 점을 기록한다.

영구 복구:

1. 문제 커밋과 직전 정상 커밋을 확인한다.
2. 문제 커밋을 revert하거나 정상 파일을 복원한 새 커밋을 만든다.
3. 정확한 파일만 검토·push한다.
4. 새 Production 배포와 운영 도메인을 검증한다.

`git reset --hard`와 force push는 사용하지 않는다.

## 11. 현재 우선순위

| 우선순위 | 작업 |
|---|---|
| P0 | 다른 기기에 클라우드 밖의 별도 clone을 만들고 전환 스크립트 검증 |
| P0 | 구 브라우저 PAT 폐기·교체 |
| P0 | 로그인·60/12·편집 취소·로그아웃 검증 |
| P0 | 무해한 필드 저장·원복 E2E 후에만 HOLD 해제 |
| P1 | main 보호와 배포 체크 도입 검토 |
| P2 | 고아 이미지 29개와 대용량 자산 정리 계획 |
| P2 | 이미지 출처·사용 권리 확인 |
| P3 | 플레이스홀더 저서 표지와 일부 누락 썸네일 확인 |

## 12. 금지 사항

- 관리자 페이지에서 저장·배포
- 저장소 루트의 오래된 `profile-site/` 수정·병합·복구 원본 사용
- `git add .`, hard reset, force push
- 오래된 `deploy.md`, `merge_data.js`, `download_images.js` 등 검증되지 않은 복구 자동화 실행
- 비밀값을 코드·Git·문서·대화에 기록
- CSS 맨 아래 무조건 추가 또는 습관적인 `!important`
- Vercel 대시보드의 Ready 확인 없이 배포 완료 선언
