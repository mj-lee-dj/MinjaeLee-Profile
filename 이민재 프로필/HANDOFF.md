# HANDOFF — 이민재 프로필 사이트

- 마지막 갱신: 2026-08-24 KST
- 현재 목표: Lectures 관리자·레이아웃 수정 Preview 배포 완료, 사용자 확인 대기
- 작업 브랜치: `codex/web-media-layout` 격리 worktree
- 배포 상태: `650468a`, `8a26b01` 커밋 푸시 및 Vercel Preview Ready; Production 미반영
- Preview URL: `https://minjae-lee-profile-git-cod-2a4a4c-minjae-lees-projects-af61ee98.vercel.app/`
- Preview 접근: Vercel Standard Protection 유지; 운영 도메인은 변경하지 않음

## 운영 기준선

- 운영 URL: `https://minjae-lee-profile.vercel.app/`
- 관리자 URL: `https://minjae-lee-profile.vercel.app/admin.html`
- Vercel Root: `이민재 프로필/profile-site`
- 공개 데이터: `profile-site/data_v3.js`, `profile-site/data_v3.json`
- 공개·관리 진입점: `profile-site/index.html`, `profile-site/admin.html`
- 서버 경계: `profile-site/api/admin.mjs`, `api/_handler.js`, `api/_core.js`
- 디자인 계약: `profile-site/DESIGN.md`

## 이번 수정

- `origin/main@e9f7da3`의 최신 관리자 데이터와 신규 슬라이드 3장을 격리 worktree에 동기화
- 기존 저장 강의 `lectures_mt5sy7fr`을 강의 배열 첫 항목으로 이동해 Google 목록 최상단에 반영
- 새 강의는 다른 컬렉션과 달리 배열 앞에 삽입되어 카테고리 목록에서도 최신 항목이 먼저 표시됨
- 강의 추가·수정 창에 `HIGHLIGHTS에 노출` 체크박스를 추가하고 큐레이션 저장소와 연결
- HIGHLIGHTS는 최대 5개를 유지하며 세부 순서는 기존 큐레이션 UI에서 조정
- 데스크톱 5행 강의 목록이 프레임 높이를 결정하고 오른쪽 3장 갤러리가 같은 높이 안에 1+2 구조로 맞춰짐
- `전체 강의 보기` CTA에 box sizing, clipping, no-wrap을 적용해 글자·화살표 이탈 방지
- 관리자 체크박스 도움말은 별도 행에 배치해 한국어 한 글자 고립 방지
- 관련 디자인 계약과 회귀 테스트 추가

## 검증

- JavaScript 문법 검사 통과
- 전체 Node 테스트 24/24 통과
- `git diff --check` 통과
- 실제 관리자 UI 저장: 신규 Google 강의가 첫 항목이며 HIGHLIGHTS 포함 확인
- 1280px: 가로 넘침 0, 목록·갤러리 높이 646.453px 동일, 갤러리 하단 오차 0
- 1280px: CTA 420×58px, 라벨·화살표 내부 포함
- 375px·768px: 가로 넘침 0, 기존 반응형 동작 유지
- 시각 QA 임시 캡처는 검수 완료 후 삭제했으며 Git에 포함하지 않음
- 최종 독립 시각 QA 2개 lane 모두 PASS, blocker 없음

## 다음 작업

- 사용자가 승인 후 명시적으로 요청할 때만 운영 병합·배포
- 공개 저장 전 최신 원격 SHA와 관리자 데이터 충돌 여부 재확인

## 보안·기기 전환

- 다중 기기 기준: `MULTI_DEVICE_WORKFLOW.md`
- 운영 비밀 이름: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `GITHUB_ADMIN_TOKEN`
- 비밀값은 Git·문서에 기록하지 않으며 저장소 콘텐츠와 이미지는 공개 자료로 취급
- 운영 장애 시 Vercel 직전 Ready 배포 Instant Rollback 사용
