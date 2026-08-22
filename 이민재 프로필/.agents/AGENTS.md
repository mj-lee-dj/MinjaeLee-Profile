# 이민재 프로필 사이트 — 작업 규칙

## 문서 우선순위

1. 이 파일의 안전 규칙
2. 프로젝트 루트 `HANDOFF.md`의 현재 상태
3. `CODEX_HANDOFF.md`의 상세 운영 절차와 이력

세 문서가 충돌하면 실제 Git·Vercel 설정·운영 사이트를 다시 확인하고 작업을 중지한다.

## 실제 경로

- Git 저장소 루트: `G:\내 드라이브\0. 바이브코딩`
- 프로젝트 루트: `G:\내 드라이브\0. 바이브코딩\이민재 프로필`
- Vercel Root Directory: `이민재 프로필/profile-site`
- 운영 데이터 원본: `이민재 프로필/profile-site/data_v3.js`
- 운영 URL: `https://minjae-lee-profile.vercel.app/`
- 저장소 루트의 `profile-site/`는 오래된 복제본이며 수정·병합·복구에 사용하지 않는다.

## 관리자 페이지 HOLD

- 관리자 페이지는 같은 출처의 `/api/admin` 서버 함수를 통해 인증·저장하며 브라우저에 GitHub PAT를 저장하지 않는다.
- 운영 원본은 강의 60건·보도 12건이고 관리자와 공개 사이트가 같은 `profile-site/data_v3.js`를 사용한다.
- Production 환경변수 3개 설정과 실제 저장→GitHub→Vercel→공개 사이트 E2E 검증 전까지 관리자 저장을 사용하지 않는다.
- 관리자 페이지나 채팅에 GitHub PAT, Gemini API 키 또는 다른 비밀값을 입력하지 않는다.

## 수정 원칙

- Git 확인은 매 프롬프트가 아니라 **작업 세션 게이트**에서만 수행한다. 상세 조건은 `MULTI_DEVICE_WORKFLOW.md`를 따른다.
- 새 Codex 작업·앱 재실행·기기 전환 뒤 처음으로 파일을 변경하기 전에는 `HANDOFF.md`, Git 상태, 원격과의 차이를 확인한다.
- 같은 Codex 작업에서 연속으로 이어지는 후속 요청은 다른 기기·관리자 저장·원격 변경 신호가 없는 한 fetch를 반복하지 않는다. 날짜가 바뀐 사실만으로 새 세션으로 보지 않는다.
- 단순 질문·설명·기획처럼 파일을 변경하지 않는 요청에는 Git 원격 확인을 생략한다.
- commit·push·배포 직전에는 세션 중 확인 여부와 관계없이 원격을 다시 확인한다.
- 작업 트리가 더러우면 무조건 pull하지 않는다. 사용자 변경을 보존한 채 fetch/상태 확인 후 안전한 방법을 선택한다.
- 사이트 파일은 프로젝트 루트 기준 `profile-site/` 아래만 수정한다.
- Git 저장소 루트에서 경로를 지정할 때는 반드시 `이민재 프로필/profile-site/...`를 사용한다.
- 콘텐츠 원본은 `data_v3.js`다. 현재는 `data_v3.json`도 의미상 동일하게 동기화한다.
- 정확한 파일만 스테이징하고 `git add .`를 사용하지 않는다.
- `git reset --hard`, force push, 오래된 복구 스크립트·deploy workflow를 사용하지 않는다.
- 비밀번호·토큰·OAuth 비밀·개인정보를 코드, 문서, 로그, 커밋에 기록하지 않는다.

## CSS·캐시

- CSS를 무조건 파일 끝에 추가하거나 `!important`로 덮지 않는다. 기존 규칙을 찾아 가장 좁은 범위에서 수정한다.
- `style.css`, `script.js`, `data_v3.js` 변경 시 `index.html`의 해당 `?v=` 값을 함께 갱신한다.
- 버전 값은 작업 시각 또는 커밋과 연결되는 고유 값으로 사용하고, 배포 후 실제 응답을 검증한다.

## 배포

- 사용자가 배포를 요청한 범위에서만 commit/push한다.
- 기본 배포 경로는 GitHub `main` push → Vercel Production 자동 배포다.
- 현재 Windows 환경에서 Vercel CLI 54.14.5가 한글 컴퓨터명 때문에 실패한 기록이 있으므로 운영 배포에 사용하지 않는다.
- 커밋 메시지는 기존 이력과의 일관성을 위해 영어로 작성한다. 이는 Git의 기술적 제약이 아니라 프로젝트 관례다.
- push 전 스테이징 diff, 비밀값, 데이터 동기화, 이미지 참조, 무관한 프로젝트 포함 여부를 확인한다.
- push 후 GitHub Vercel status, Production Ready, 운영 페이지·콘솔·이미지를 확인한다.
- 완료 후 `HANDOFF.md`를 80줄 이내 최신 상태로 갱신한다.

## 롤백

- 긴급 복구는 Vercel의 이전 Ready 배포를 Promote/Instant Rollback할 수 있다.
- 영구 복구는 문제 커밋을 revert하거나 정상 파일을 복원한 새 커밋으로 한다.
- Git 이력을 되쓰는 hard reset/force push는 사용하지 않는다.
