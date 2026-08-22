# HANDOFF — 이민재 프로필 사이트

- 마지막 갱신: 2026-08-23 KST
- 현재 목표: 웹 Watch·Lectures 미디어 Preview 배포 완료, 사용자 확인 대기
- 작업 브랜치: `codex/web-media-layout` (`origin/main` 기준 격리 worktree)
- 배포 상태: 구현 커밋 `03ba90f` Vercel Preview Ready; Production 미반영
- Preview URL: `https://minjae-lee-profile-git-cod-2a4a4c-minjae-lees-projects-af61ee98.vercel.app/`
- Preview 접근: Vercel Standard Protection 유지; Vercel 로그인 필요, 공유 토큰은 문서·Git에 기록하지 않음
- 운영 상태: PR #3 병합 커밋 `78b401e`가 Vercel Production Ready이며 운영 QA 완료

## 운영 기준선

- 운영 URL: `https://minjae-lee-profile.vercel.app/`
- 관리자 URL: `https://minjae-lee-profile.vercel.app/admin.html`
- Vercel Root: `이민재 프로필/profile-site`
- 운영 데이터: `profile-site/data_v3.js`, `profile-site/data_v3.json`
- 공개 진입점: `profile-site/index.html`
- 관리자 진입점: `profile-site/admin.html`
- 서버 경계: `profile-site/api/admin.mjs`, `api/_handler.js`, `api/_core.js`
- 디자인 계약: `profile-site/DESIGN.md`

## 반응형 미디어 구성

- 대표 강의 탭 기본 라벨을 `HIGHLIGHTS`로 변경; 관리자 큐레이션 5개 유지
- 하단 CTA는 개수 없이 `전체 강의 보기`; 클릭 시 공개 전체 강의 60개 표시
- 모바일 강의 행은 연도·제목/기관·16:9 대표 썸네일 1장 구조
- 복수 슬라이드는 원형 gallery indicator와 개수를 표시
- 모바일 행 클릭 시 전체 화면 dialog: 큰 이미지, 썸네일 strip, 이전·다음, swipe, Escape, focus 복귀
- 데스크톱·태블릿 선택 강의는 16:9 슬라이드 최대 3장을 오른쪽에 큰 1장 + 작은 2장으로 배치
- Watch 모바일 카드는 84% 폭으로 다음 카드가 보이며 32px 원형 control·44px 터치 영역·진행선을 사용
- Watch 데스크톱은 3장 뒤 다음 카드 28px, 태블릿은 2장 뒤 다음 카드 약 37px을 노출
- Watch 웹 control은 40px 원형·52px hit target이며 썸네일 세로 중앙에 정렬
- 관리자 데이터, CRUD, 저장·배포 API 스키마는 변경하지 않음
- 선택 강의 왼쪽 적색 선과 선택 탭 밑줄 제거; 선택 탭은 레드 활자로만 구분
- 375px 긴 `Gemini&NotebookLM...` 제목은 가운데 열 안에서 줄바꿈하고 썸네일과 12px 간격 유지
- 모바일 `전체 강의 보기`는 198×48px compact outline button; 768px 이상은 기존 420×58px 유지

## 검증 결과

- Node 전체 테스트 20/20 통과
- 변경 JavaScript 문법 검사와 `git diff --check` 통과
- Chrome 375/768/1280: 가로 넘침 0, page error 0
- 375px: 대표 5개·전체 60개 전환, Google 22개, 강의 썸네일 5개 확인
- 갤러리 1/3→2/3→3/3, 닫기 후 focus 복귀, body scroll lock 확인
- Watch 17개, 01/17→02/17, 다음 카드 peek, control 44×44 확인
- 배포 Preview 375px 재검증: 로그인 없는 Shareable Link 접근, 갤러리 2/3 전환, 전체 60개, Watch 02/17, 깨진 이미지 0, 콘솔 오류 0
- `39d3d10` Vercel 상태 success; 배포 Preview 375/768/1280 재검증
- 375px 문서 가로 넘침 0, 긴 제목·썸네일 겹침 0, 선택 행 box-shadow 없음, 모바일 CTA 198×48px 확인
- 768/1280 선택 탭 레드 활자·밑줄 없음, 데스크톱 CTA 420×58px 보존
- 운영 `78b401e`: Vercel Production success, 공개·관리자 페이지 200, 외부 직접 API 호출 403 확인
- 운영 375/768/1280: 전체 강의 60개, 긴 제목·썸네일 겹침 0, 가로 넘침 0, CTA 반응형 크기 확인
- 로컬 웹 미디어 QA: 375/768/1280 가로 넘침 0; Watch 다음 이동 상태 정상
- 768px Watch 2장 + 다음 36.8px, control 중심 오차 5.6px; 1280px 3장 + 다음 28.1px, 중심 오차 2.4px
- 768/1280 Lectures 큰 1장 + 같은 크기 작은 2장 배치 확인; 375px 기존 모바일 ledger·gallery 유지
- 독립 시각 QA 2개 lane 모두 PASS; 제품 결함 없음
- GitHub `03ba90f` Vercel commit status success 및 Preview Comments check success 확인
- 디자인 QA 캡처는 로컬 임시 폴더에만 두고 Git에는 포함하지 않음

## 다음 작업

- 사용자가 Preview를 확인한 뒤 별도 요청 시에만 운영 병합·배포
- 관리자 저장 전 공개 데이터와 최신 운영 SHA를 확인하고 한 번에 하나의 논리적 변경만 배포

## 기기 전환과 운영 주의

- 다중 기기 기준은 `MULTI_DEVICE_WORKFLOW.md`; 새 작업·기기 전환 후 첫 변경과 push/배포 직전에 원격 확인
- 다른 컴퓨터에서는 독립 clone과 `codex/` 브랜치를 사용하고 dirty tree에서 바로 pull/merge하지 않음
- 운영 비밀 이름: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `GITHUB_ADMIN_TOKEN`; 값은 Git·문서에 기록하지 않음
- 저장소는 PUBLIC이므로 Git 콘텐츠와 이미지는 공개 자료로 취급
- 운영 즉시 복구는 Vercel의 직전 Ready 배포 Instant Rollback 사용
