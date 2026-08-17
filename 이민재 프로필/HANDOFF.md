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

## 구현 완료

- 공개 HTML의 하드코딩 비밀번호와 브라우저 GitHub PAT 직접 저장을 제거함
- 서버용 관리자 로직: `profile-site/api/_handler.js`, `_core.js`
- 세션: HttpOnly + Secure + SameSite=Strict, 4시간, HMAC 서명
- 실제 Git 경로 `이민재 프로필/profile-site/...`로 고정
- JS·JSON·index·새 이미지를 하나의 non-force 커밋으로 저장
- 동시 수정 SHA 충돌, 스키마/중복 ID, 의도하지 않은 항목 감소를 차단
- 저장 후 운영 JSON 일치를 최대 2분 확인
- Gemini/Google Client ID는 탭 세션에만 보관하며 client_id 미설정 콘솔 오류 제거
- Git 루트의 오래된 중복 `profile-site/` 11개 파일을 제거해 원본 단일화
- 운영 절차: `ADMIN_RUNBOOK.md`

## 검증

- Node 테스트 10개 통과: 환경 누락 fail-closed, 교차 출처 차단, 로그인/세션, 위변조, 스키마, 중복 ID, 삭제 감지, 실제 운영 경로 단일 커밋
- Vercel ncc: 전체 관리자 핸들러 CJS 번들 및 Web 진입점 ESM 번들 성공
- 로컬/Production 브라우저: 로그인 화면만 표시, 대시보드 hidden, 오류 오버레이/콘솔 오류 0
- Production `e5ea081`: Vercel success `DWHH19Y8r3GZ3ZJTUe6FQXmJ4pcb`
- Production 확인: index 200, admin 200·로컬 exact, API 404, 강의 60·보도 12
- 내장 Browser는 Windows sandbox `helper_unknown_error`로 실패하여 기존 `agent-browser`로 대체 검증

## 확인된 Vercel blocker

- 정적 파일만 있는 `d80a053`, `e5ea081`은 배포 성공
- 전체 함수, 단일 export, 최신 Web export가 모두 빌드 실패
- 외부 의존 없는 최소 `api/ping.mjs`도 `7f2e33e`에서 실패
- 따라서 관리자 코드가 아니라 이 Vercel 프로젝트의 Functions 빌드 설정/계정 상태 문제로 확정
- 최소 함수 실패 배포: `FjkT2NEG89Z2nHJa16cFgVVrP86o`
- 로컬 Vercel CLI는 한글 컴퓨터명 HTTP 헤더 오류로 배포 로그 인증 불가
- 현재 함수 진입점은 제거했고 내부 로직만 보존되어 `/api/admin`은 404 fail-closed

## HOLD — 관리자 저장 금지

- 관리자 화면과 공개 사이트는 안전하지만 로그인/저장은 아직 불가
- Vercel Functions blocker 원인을 해결하고 함수 진입점을 복원해야 함
- 그 다음 Production에 `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `GITHUB_ADMIN_TOKEN` 설정
- 실제 테스트 수정 저장→GitHub→Vercel→공개 사이트 E2E 검증 전까지 HOLD 유지

## 다음 작업

1. Vercel Dashboard에서 배포 `FjkT2NEG89Z2nHJa16cFgVVrP86o`의 첫 Build Logs 오류 원문 확보
2. Functions 프로젝트 설정/런타임 blocker 수정
3. 검증된 Web 진입점 `e8c97b2`의 `profile-site/api/admin.mjs` 복원
4. Production 환경변수 3개 설정, 구 브라우저 PAT 폐기/교체
5. 로그인·60/12·편집 취소·로그아웃 검증
6. 테스트용 무해 필드 저장/원복 E2E 후에만 HOLD 해제

## 주의

- 비밀값은 커밋, 문서, 채팅, HANDOFF에 남기지 않는다.
- 정확한 파일만 stage; `git add .`, hard reset, force push 금지.
- unrelated `.agent/workflows/deploy.md` 삭제와 untracked 도구 파일은 보존한다.
- 롤백은 임시 Vercel Promote/Instant Rollback, 영구 Git revert 커밋을 사용한다.
