# HANDOFF — 이민재 프로필 사이트

- 마지막 갱신: 2026-08-20 KST
- 현재 목표: Editorial Noir V13 관리자 저장·배포 경계를 실제 배포 직전 상태로 검증
- 배포 상태: 비배포. 이번 작업에서 commit·push·Vercel 운영 배포 없음

## 운영 기준선

- 프로젝트: `profile-site`; Vercel Root: `이민재 프로필/profile-site`
- 운영 URL: `https://minjae-lee-profile.vercel.app/`
- 운영 데이터: `profile-site/data_v3.js`, `profile-site/data_v3.json`
- 보호 운영 파일: `index.html`, `style.css`, `script.js`, `admin.html`, `data_v3.js`, `data_v3.json`
- 위 6개 파일은 V13 작업에서 수정하지 않음

## V13 초안 진입점

- 공개: `profile-site/draft-v2.html`
- 통합 관리자: `profile-site/admin-profile-final.html`
- 콘텐츠 원장: `draft-content-store.js`, `admin-content-schema.js`, `admin-content-local.js`
- 이미지 붙여넣기: `admin-image-paste.js`
- 전체 저장·배포 콘솔: `admin-publish.js`, `admin-content-v13.css`
- 서버 경계: `api/admin.mjs`, `api/_handler.js`, `api/_core.js`
- 디자인 계약: `profile-site/DESIGN.md`

## 확정 동작

- 공개 흐름: Hero → PROOF → Books → Online Courses → Watch → Lectures → Records → Instagram/Contact
- 관리자 범위: 프로필, PROOF, 저서, 온라인 연수, Watch, 강의, 수상, 활동, 보도자료, 대표 강의 5개
- 온라인 연수는 연수명·연수원·썸네일 필수, Watch는 제목·링크 필수, 강의는 제목·주제 필수
- 온라인 연수 소개와 강의 설명은 입력하지 않음
- 온라인 연수·Watch·강의 이미지는 `Ctrl+V` 또는 파일 선택 가능
- 붙여넣은 이미지는 SVG 제외, 최대 1600px·900KB WebP로 축소; 강의는 최대 3장
- 항목별 저장은 로컬 초안을 갱신하고 같은 브라우저 공개 초안에 즉시 반영
- 상단 `운영 사이트 저장 및 배포`는 전체 초안을 한 번에 검증·업로드·저장·배포 확인
- `file:`/localhost에서는 운영 API를 호출하지 않고 안전 안내만 표시
- 배포된 HTTPS 관리자는 HttpOnly 세션·CSRF·동일 출처 검사를 통과해야 함
- 이미지는 서버에서 형식·매직바이트를 검증하고 GitHub blob으로 만든 뒤 데이터와 한 커밋에 저장
- 최신 운영 커밋·개인정보·컬렉션·PROOF·강의 큐레이션 충돌을 검사해 다른 기기 변경을 덮어쓰지 않음
- 삭제가 있으면 명시적 확인을 요구하며, 운영 JSON 일치 전에는 완료로 표시하지 않음

## 서버 비밀값 이름

- `ADMIN_PASSWORD`: 관리자 로그인 비밀번호
- `ADMIN_SESSION_SECRET`: 서명 세션·CSRF 비밀
- `GITHUB_ADMIN_TOKEN`: 저장소 내용·커밋 갱신 토큰
- 값 자체는 Git·브라우저·문서에 기록하지 않음

## 검증

- Node API/핸들러 테스트 15/15 통과, 변경 JS 문법 검사 통과
- 브라우저 QA: 이미지 붙여넣기 WebP 변환, 강의 3장, 공개 미리보기 렌더링 통과
- 로컬 배포 버튼 API 호출 0회 및 안전 안내 확인
- 호스팅 모의 E2E: session → data → upload-image → save → 운영 JSON 확인 통과
- 다중 기기 개인정보 변경은 session → data 뒤 저장 전에 차단
- 375/768/1280 관리자 가로 넘침 0, 배포 버튼 52px, 모바일 dialog 행동 영역 노출
- 콘솔 오류·경고 0
- 증거: `.omo/evidence/profile-v13/`

## 다음 작업

1. 사용자가 로컬 V13 공개·관리자 초안을 최종 확인
2. 사용자 승인 후 운영 진입 파일 통합·commit·push
3. Vercel 환경변수 3개 확인 후 실제 관리자 로그인→저장→GitHub→Vercel→도메인 E2E
4. 실패 시 Git revert 또는 Vercel Instant Rollback/Promote

## 주의

- 관리자 페이지 HOLD: 실제 운영 E2E 통과 전 운영 관리자 저장 사용 금지
- 브라우저에 GitHub PAT 등 비밀값 입력 금지
- main push는 Vercel Production 배포이므로 명시적 승인 전 금지
- 기기 전환은 `MULTI_DEVICE_WORKFLOW.md`를 따르고 동시에 같은 브랜치를 수정하지 않음
- unrelated dirty/untracked 파일은 건드리지 않음
