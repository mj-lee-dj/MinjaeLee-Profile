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

- Node 테스트 11개 통과: 환경 누락 fail-closed, 교차 출처 차단, 로그인/세션, 위변조, 스키마, 중복 ID, 삭제 감지, 실제 운영 경로 단일 커밋, Vercel Web 진입점
- Vercel ncc: 전체 관리자 핸들러 CJS 번들 및 Web 진입점 ESM 번들 성공
- 로컬/Production 브라우저: 로그인 화면만 표시, 대시보드 hidden, 오류 오버레이/콘솔 오류 0
- Production `cea1e7d`: Vercel success `HKk94M5Kwq9MXC3etDq67kMGqZTg`
- Production 확인: index 200, admin 200, API 503 fail-closed, 강의 60·보도 12
- 내장 Browser는 Windows sandbox `helper_unknown_error`로 실패하여 기존 `agent-browser`로 대체 검증

## 해결된 Vercel blocker

- 실패 원문: 함수 이름에 공백이 포함된 `이민재 프로필/profile-site/api/...` 경로가 사용됨
- Vercel Root Directory의 `Include files outside the root directory in the Build Step`을 Disabled로 변경
- 검증된 `profile-site/api/admin.mjs`를 복원한 `cea1e7d` 배포 성공
- 운영 `/api/admin?action=session`이 503과 누락된 키 이름 3개를 반환해 함수 실행 확인
- 로컬 Vercel CLI는 한글 컴퓨터명 HTTP 헤더 오류가 있어 계속 사용하지 않음

## HOLD — 환경변수·E2E 전 관리자 저장 금지

- 관리자 화면과 공개 사이트, 서버 함수는 정상이나 로그인/저장은 아직 불가
- Production에 `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `GITHUB_ADMIN_TOKEN` 설정 필요
- 실제 테스트 수정 저장→GitHub→Vercel→공개 사이트 E2E 검증 전까지 HOLD 유지

## 다음 작업

1. Production 환경변수 3개 설정 후 최신 배포 Redeploy
2. 구 브라우저 PAT 폐기/교체
3. 로그인·60/12·편집 취소·로그아웃 검증
4. 테스트용 무해 필드 저장/원복 E2E 후에만 HOLD 해제

## 주의

- 비밀값은 커밋, 문서, 채팅, HANDOFF에 남기지 않는다.
- 정확한 파일만 stage; `git add .`, hard reset, force push 금지.
- unrelated `.agent/workflows/deploy.md` 삭제와 untracked 도구 파일은 보존한다.
- 롤백은 임시 Vercel Promote/Instant Rollback, 영구 Git revert 커밋을 사용한다.
