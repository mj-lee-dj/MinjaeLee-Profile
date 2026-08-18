# HANDOFF — 이민재 프로필 사이트

- 마지막 갱신: 2026-08-18 21:24 KST
- 현재 상태: 관리자 저장→GitHub→Vercel→운영 반영 E2E 정상

## 기본 구조

- Git 루트: `G:\내 드라이브\0. 바이브코딩`
- 프로젝트: `이민재 프로필`
- Vercel Root: `이민재 프로필/profile-site`
- 운영 URL: `https://minjae-lee-profile.vercel.app/`
- 데이터 원본: `profile-site/data_v3.js`; JSON 동기본: `profile-site/data_v3.json`
- 관리자: `profile-site/admin.html`; 서버: `profile-site/api/admin.mjs` → `_handler.js`
- 정상 기준: 강의 60, 저서 4, 수상 5, 보도자료 12, 링크 항목 18, 이미지 항목 63

## 구현·설정 완료

- 공개 HTML 비밀번호와 브라우저 GitHub PAT 저장을 제거하고 서버 인증으로 전환
- 세션: HttpOnly + Secure + SameSite=Strict, 4시간, HMAC 서명
- Vercel Root Directory 외부 파일 포함을 Disabled로 설정
- Production 환경변수 3종 설정 완료: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `GITHUB_ADMIN_TOKEN`
- GitHub GraphQL `createCommitOnBranch`는 `repositoryNameWithOwner` + `branchName` 사용
- 저장 응답이 `commitSha`, `updatedAt`, `cacheKey`를 반환
- 관리자 UI는 운영 `index.html`의 동일 `cacheKey`와 JSON 일치 확인 후에만 완료 표시
- JS·JSON·index·새 이미지를 non-force 커밋으로 저장하며 SHA 충돌·스키마·중복 ID·항목 감소 차단
- Gemini/Google Client ID는 탭 세션에만 보관

## 2026-08-18 최종 검증

- 수정 커밋: `1aa5bf6`(GraphQL branch 입력), `2bb7451`(회귀 테스트)
- Node 관리자 테스트 11/11 통과; 변경 파일 `node --check` 통과
- Vercel ncc 0.45.0 ESM 번들 성공
- 실제 관리자 무변경 저장 1회 성공: 커밋 `aa0e78e810eea50f2307b39d5a5e319164aa922a`
- 저장 API 200; 화면이 약 18초 후 `운영 사이트 반영 완료` 표시
- 해당 커밋 Vercel 상태 `success`; 배포 ID `7YfFFovFHsby6xf59msx7Gug52p2`
- 운영 index가 반환된 cacheKey `1787055829151`을 사용함을 확인
- 운영 데이터 수량 60·4·5·12 및 관리자 대시보드 18·63 유지 확인

## 운영 절차

1. 관리자 로그인 후 필요한 항목만 수정한다.
2. `전체 저장 & 배포`는 한 번만 누르고 `운영 사이트 반영 완료`까지 기다린다.
3. 실패 시 같은 버튼을 반복 클릭하지 말고 브라우저 메시지와 Vercel Function 로그를 확인한다.
4. GitHub 최신 `content: update profile via admin` 커밋과 Vercel `Ready`를 교차확인한다.
5. 운영 페이지 강의 60·보도 12 등 핵심 수량과 수정 항목을 확인한다.

## 다음 유지보수

- GitHub 토큰 만료일 전 교체하고 Vercel Production/Preview 범위를 함께 확인
- 더 이상 쓰지 않는 구 브라우저 PAT가 남아 있으면 폐기
- 장애 시 Vercel Instant Rollback은 임시 복구, Git revert 커밋은 영구 복구에 사용

## 주의

- 비밀값은 커밋, 문서, 채팅, HANDOFF에 남기지 않는다.
- 정확한 파일만 stage하며 `git add .`, hard reset, force push는 금지한다.
- 공유 checkout의 unrelated 삭제·untracked 파일은 보존한다.
- 로컬 Vercel CLI는 한글 컴퓨터명 HTTP 헤더 오류 이력이 있어 배포 확인에 사용하지 않는다.
