# HANDOFF — 이민재 프로필 사이트

- 마지막 갱신: 2026-08-17 KST
- 현재 목표: 노트북·데스크탑 전환 환경 구성과 관리자 E2E 완료

## 기본 구조

- Git 루트: 기기별 clone에서 `git rev-parse --show-toplevel`로 확인
- 프로젝트: `<Git 루트>/이민재 프로필`
- Vercel Root: `이민재 프로필/profile-site`
- 운영 URL: `https://minjae-lee-profile.vercel.app/`
- 운영 원본: `profile-site/data_v3.js`
- JSON 동기 본: `profile-site/data_v3.json`
- 정상 기준: 강의 60, 보도 12

## 구현 완료

- 공개 HTML의 하드코딩 비밀번호와 브라우저 GitHub PAT 직접 저장 제거
- 서버 관리자 API, 4시간 서명 세션, 교차 출처 차단 구현
- 실제 Git 경로 고정, JS·JSON·index·이미지 원자적 저장 구현
- 동시 수정 SHA, 스키마·중복 ID, 의도하지 않은 삭제 방어
- 저장 후 운영 JSON 일치를 최대 2분 확인
- 오래된 루트 `profile-site/` 추적 복제본 제거
- Production 환경변수 3개 설정 후 `67bb810` 재배포
- 기기 전환 문서: `MULTI_DEVICE_WORKFLOW.md`
- 기기별 자동 점검: `tools/setup-device.cmd`, `work-start.cmd`, `work-finish.cmd`
- 전환 구성 브랜치: `codex/multi-device-workflow`

## 검증

- Node 테스트 11개 통과
- 공개·데이터·관리자 API JavaScript 구문 검사 통과
- Vercel ncc CJS·ESM 번들 성공
- Production index 200, admin 200
- 동일 출처 비로그인 세션 API 401로 환경 설정과 인증 대기 상태 확인
- 관리자 로그인 전 대시보드 hidden, 기존 브라우저 콘솔 오류 0

## 관리자 HOLD — 실제 저장 E2E 전

- Production 환경변수와 재배포는 완료됨
- 실제 로그인·편집 취소·로그아웃 검증은 아직 필요
- 무해한 필드 저장→GitHub→Vercel→공개 사이트 반영 및 원복 전까지 관리자 저장 HOLD

## 기기 전환 규칙

- 각 기기는 Google Drive·OneDrive·Dropbox 밖에 별도 clone 사용
- 같은 `.git` 폴더를 클라우드 드라이브로 동기화하지 않음
- 작업 시작: `tools/work-start.cmd`
- 기기 전환 전: `tools/work-finish.cmd`, HANDOFF 갱신, 작업 브랜치 동기화
- 진행 중 작업은 `codex/<작업명>`, Production 배포만 `main`
- 자동 pull·`git add .`·자동 commit/push·force push 금지
- 동시에 두 기기에서 같은 브랜치를 수정하지 않음

## 다음 작업

1. 다른 기기에서 `codex/multi-device-workflow` 브랜치를 클라우드 밖에 clone 후 `tools/setup-device.cmd` 실행
2. 관리자 로그인·60/12·편집 취소·로그아웃 검증
3. 무해한 필드 저장·원복 E2E 후 HOLD 해제

## 주의

- 비밀값은 Git, 문서, 채팅, HANDOFF, 클라우드 파일에 남기지 않는다.
- unrelated `.agent/workflows/deploy.md` 삭제와 다른 프로젝트 변경은 보존한다.
- 루트의 미추적 복구 스크립트는 실행·스테이징하지 않는다.
- `main` push는 Vercel Production 배포다.
- 롤백은 임시 Vercel Promote/Instant Rollback, 영구 Git revert를 사용한다.
