# HANDOFF — 이민재 프로필 사이트

- 마지막 갱신: 2026-08-17 KST
- 현재 목표: 관리자 페이지 정상화와 안전한 운영 전환

## 기본 구조

- Git 루트: `G:\내 드라이브\0. 바이브코딩`
- 프로젝트: `이민재 프로필`
- Vercel Root: `이민재 프로필/profile-site`
- 운영 URL: `https://minjae-lee-profile.vercel.app/`
- 운영 원본: `profile-site/data_v3.js`
- JSON 동기 본: `profile-site/data_v3.json`
- 정상 기준: 강의 60, 보도 12

## 관리자 정상화 구현

- 공개 HTML의 하드코딩 비밀번호와 브라우저 GitHub PAT 직접 저장을 제거함
- Vercel Function `profile-site/api/admin.js`가 로그인, 세션, GitHub 읽기/저장을 전담함
- 세션: HttpOnly + Secure + SameSite=Strict, 4시간, HMAC 서명
- 저장 경로: `이민재 프로필/profile-site/...`로 고정
- `data_v3.js`, `data_v3.json`, `index.html`, 새 이미지를 하나의 non-force 커밋으로 저장
- 동시 수정 SHA 충돌, 스키마/중복 ID, 의도하지 않은 항목 감소를 차단함
- 저장 후 운영 JSON 일치를 최대 2분간 확인하며 실패 시 추가 저장 중단을 안내함
- Gemini/Google Client ID는 탭 세션에만 보관하며 Client ID 미설정 초기화 오류를 제거함
- Git 루트의 오래된 중복 `profile-site/` 11개 파일을 Git 삭제해 source of truth를 단일화함

## 검증 상태

- Node 테스트 10개 통과: 환경 누락 fail-closed, 교차 출처 차단, 로그인/세션, 위변조, 스키마, 중복 ID, 삭제 감지, 운영 경로 단일 커밋
- `admin.html` 인라인 스크립트와 `api/admin.js` 문법 통과
- 로컬 렌더: 로그인 화면만 표시, 대시보드 hidden, 오류 오버레이 0, Google client_id 콘솔 오류 0
- 내장 Browser는 Windows sandbox `helper_unknown_error`로 연결 실패; 기존 `agent-browser` 경로로 대체 검증

## HOLD — 운영 관리자 저장

- 코드는 fail-closed 상태로 복구됨
- Vercel Production에 `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `GITHUB_ADMIN_TOKEN` 설정이 필요함
- 설정 후 새 Production 배포와 실제 테스트 수정 저장→GitHub→Vercel→공개 사이트 E2E 검증 전까지 HOLD 유지

## 다음 작업

1. 관리자 정상화 커밋을 `main`에 push하고 Vercel 배포/fail-closed 확인
2. 사용자가 Vercel Production 환경변수 3개를 설정하고 구 PAT는 폐기/교체
3. 새 배포 후 로그인, 최신 데이터 60/12, 편집 취소, 로그아웃 검증
4. 테스트용 무해 필드를 저장해 전체 E2E 검증 후 원복 커밋
5. 데이터/JS/JSON/이미지/공개 페이지가 모두 일치할 때만 HOLD 해제

## 중요 파일

- `.agents/AGENTS.md`, `CODEX_HANDOFF.md`, `ADMIN_RUNBOOK.md`
- `profile-site/admin.html`, `profile-site/api/admin.js`, `profile-site/vercel.json`
- `profile-site/.env.example`, `profile-site/tests/*.test.js`
- `profile-site/data_v3.js`, `profile-site/data_v3.json`

## 주의

- 비밀값은 커밋, 문서, 채팅, `HANDOFF.md`에 남기지 않는다.
- 정확한 파일만 stage; `git add .`, hard reset, force push 금지.
- Vercel CLI는 이 PC에서 한글 컴퓨터명 헤더 오류 이력이 있어 Git push 배포를 사용한다.
- 롤백은 임시 Vercel Promote/Instant Rollback, 영구 Git revert 커밋을 사용한다.
