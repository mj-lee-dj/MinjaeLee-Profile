# HANDOFF — 이민재 프로필 사이트

- 마지막 갱신: 2026-08-25 KST
- 현재 목표: Lectures 카테고리 갤러리·전체 강의 CTA·최신 Watch 공개 수정 완료, 로컬 검증 중
- 작업 브랜치: `codex/web-media-layout` 격리 worktree
- 배포 상태: 이번 수정은 미커밋·미배포; Production 미반영
- 이전 Preview: `https://minjae-lee-profile-git-cod-2a4a4c-minjae-lees-projects-af61ee98.vercel.app/`

## 운영 기준선

- 운영 URL: `https://minjae-lee-profile.vercel.app/`
- 관리자 URL: `https://minjae-lee-profile.vercel.app/admin.html`
- Vercel Root: `이민재 프로필/profile-site`
- 공개 데이터: `profile-site/data_v3.js`, `profile-site/data_v3.json`
- 공개·관리 진입점: `profile-site/index.html`, `profile-site/admin.html`
- 서버 경계: `profile-site/api/admin.mjs`, `api/_handler.js`, `api/_core.js`
- 디자인 계약: `profile-site/DESIGN.md`

## 이번 수정

- HIGHLIGHTS와 개별 주제의 데스크톱 gallery layout을 분리
- HIGHLIGHTS는 5개 ledger 전체 높이와 오른쪽 1+2 gallery 높이를 동일하게 유지
- AI·Google 등 개별 주제는 선택 행과 같은 Y축에 최대 3장의 16:9 썸네일을 가로로 배치
- 개별 주제 오른쪽에서 중복되던 제목을 숨겨 선택 행과 썸네일이 한 줄의 시각 단위가 되도록 조정
- 1024px 이하는 오른쪽 고정 gallery를 숨기고 행 썸네일 클릭 시 기존 상세 gallery 사용
- 1024px 이하 상세 gallery의 이전·다음 원형 컨트롤을 화면 안쪽에 배치해 내부 가로 넘침 제거
- `전체 강의 보기`를 넓은 상아색 박스에서 compact editorial text CTA로 변경
- 2026-08-23 관리자 저장에서 비공개로 전환됐던 최신 Watch 항목을 다시 공개
- 최신 Google 강의는 기존대로 Google 목록 최상단에 유지
- Watch 외부 링크 검증식을 수정해 17개 카드가 실제 YouTube 주소를 유지하도록 복구
- 관련 디자인 계약과 회귀 테스트 갱신

## 검증

- 전체 Node 테스트 27/27 통과
- JavaScript 문법 검사와 `git diff --check` 통과
- 1280px HIGHLIGHTS: 목록·gallery 높이 646.45px 동일
- 1280px Google: 선택 행 Y=273.36px, gallery Y=273.36px; 3장 각각 212.98×119.80px
- 375px·768px·1280px 가로 넘침 0
- 모바일·태블릿 오른쪽 고정 gallery 숨김 및 기존 상세 gallery 경로 유지
- 375px 상세 gallery client/scroll 너비 375px 동일, 이전·다음 컨트롤 x=21–354px 내 포함
- 768px 상세 gallery·panel·stage 내부 가로 넘침 0, 원형 컨트롤 x=45–723px 내 포함
- CTA 143.97×48px, 투명 배경, 글자·화살표 이탈 없음
- Watch 17개 렌더링, 최신 `Gemini & NotebookLM으로 똑똑하게 해외여행 준비하기` 첫 항목 확인
- Watch 17개 링크 모두 절대 `https://` 주소이며 첫 항목의 실제 YouTube 목적지 확인
- 독립 시각 QA 2회 PASS: 1280/768/375 레이아웃·CJK·modal 내부 폭·Watch 링크 실동작 확인

## 다음 작업

- 사용자가 명시적으로 요청할 때만 commit·Preview/Production 배포
- 공개 저장 전 최신 원격 SHA와 관리자 데이터 충돌 여부 재확인

## 보안·기기 전환

- 다중 기기 기준: `MULTI_DEVICE_WORKFLOW.md`
- 운영 비밀 이름: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `GITHUB_ADMIN_TOKEN`
- 비밀값은 Git·문서에 기록하지 않으며 저장소 콘텐츠와 이미지는 공개 자료로 취급
- 운영 장애 시 Vercel 직전 Ready 배포 Instant Rollback 사용
