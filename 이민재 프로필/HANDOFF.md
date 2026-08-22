# HANDOFF — 이민재 프로필 사이트

- 마지막 갱신: 2026-08-22 KST
- 현재 목표: 다중 기기 Git 운영과 관리자 보안 보강을 비배포 브랜치에서 검증
- 앱 배포 커밋: `5d37a84` (`fix: protect profile photo uploads`)
- 배포 상태: GitHub `main` 반영·Vercel Production 완료

## 운영 기준선

- 운영 URL: `https://minjae-lee-profile.vercel.app/`
- 관리자 URL: `https://minjae-lee-profile.vercel.app/admin.html`
- Vercel Root: `이민재 프로필/profile-site`
- 운영 데이터: `profile-site/data_v3.js`, `profile-site/data_v3.json`
- 공개 진입점: `profile-site/index.html`
- 관리자 진입점: `profile-site/admin.html`
- 서버 경계: `profile-site/api/admin.mjs`, `api/_handler.js`, `api/_core.js`
- 디자인 계약: `profile-site/DESIGN.md`

## 이번 배포의 정확한 범위

- 프로필 사진 경로 텍스트 입력을 PNG/JPEG/WebP/GIF 파일 선택 UI로 교체
- 선택 이미지는 기존 이미지 도구로 최대 1600px·900KB 이하 WebP로 최적화
- 미리보기와 `현재 사진으로 복원` 제공
- 새 파일을 선택하고 핵심 프로필을 저장했을 때만 `photoDirty=true`
- 오래된 브라우저 초안의 `assets/profile.jpg`는 배포 사진을 덮어쓰지 못함
- 운영 저장 성공 뒤 새 업로드 경로로 동기화하고 `photoDirty=false`
- 공개 초안·PROOF·대표 강의·storage 갱신 로직은 변경하지 않음
- 최신 2026-08-22 강의·큐레이션 데이터 커밋 `a9cd3ca`, `9954f93` 보존

## 배포 및 검증 결과

- GitHub `main`: `9954f93..5d37a84` 비강제 push 완료
- GitHub Vercel 상태: `success`, `Deployment has completed`
- 배포 완료 시각: 2026-08-22 12:59 KST
- Node 전체 테스트: 19/19 통과
- 변경 JavaScript 문법 검사 및 diff 검사 통과
- 운영 Chrome 375/768/1280 공개 화면: `assets/profile-2026.png` 유지
- 오래된 `assets/profile.jpg` localStorage 초안을 넣은 뒤에도 2026 사진 유지
- 운영 PROOF 6개, 대표 강의 5개, 최신 Gemini & NotebookLM 강의 확인
- 운영 관리자: 사진 경로 텍스트 입력 0, 파일 선택→54KB WebP 변환 확인
- 준비 상태·미리보기·현재 사진 복원 확인
- 세 화면 폭 모두 가로 넘침 0, page error 0
- 독립 기능·디자인 검수 PASS, 독립 시각·CJK 검수 PASS, 차단 문제 없음
- Vercel 런타임 오류 API는 연결 계정 권한 403으로 조회 불가; 실제 브라우저 오류는 0

## 기존 V13 운영 동작

- 공개 흐름: Hero → PROOF → Books → Online Courses → Watch → Lectures → Records → Instagram/Contact
- 관리자 범위: 프로필, PROOF, 저서, 온라인 연수, Watch, 강의, 수상, 활동, 보도자료, 대표 강의 5개
- 항목별 저장은 로컬 초안을 갱신하고 같은 브라우저 공개 초안에 반영
- 상단 `운영 사이트 저장 및 배포`는 전체 초안을 검증·업로드·저장·배포 확인
- 배포 HTTPS 관리자는 HttpOnly 세션·CSRF·동일 출처 검사를 통과해야 함
- 이미지와 데이터는 서버 검증 뒤 한 Git 커밋으로 저장
- 최신 운영 커밋 충돌과 삭제를 확인해 다른 기기 변경 덮어쓰기를 방지

## 기기 전환과 로컬 상태

- 다중 기기 운영 기준은 `MULTI_DEVICE_WORKFLOW.md`에 정리함
- 매 프롬프트가 아니라 새 작업·앱 재실행·기기 전환 후 첫 파일 변경과 commit/push/배포 직전에만 원격 확인
- 날짜 변경만으로는 새 세션으로 보지 않으며, 단순 질문·기획에는 fetch하지 않음
- 다른 컴퓨터에서는 독립된 로컬 clone을 사용하고 GitHub 브랜치로 작업을 전달
- dirty tree에서 바로 pull/merge하지 말고 `AGENTS.md`, 이 파일, `MULTI_DEVICE_WORKFLOW.md`를 먼저 읽기
- 현재 이 컴퓨터의 원래 작업 브랜치는 `codex/profile-v13-production`; 사진 수정 원본 커밋은 `f3d0ac5`
- 원래 작업 폴더의 unrelated dirty/untracked 파일은 보존했으며 배포에 포함하지 않음
- 이후 작업은 최신 `main`에서 새 `codex/` 브랜치를 만들어 시작

## 운영 비밀과 롤백

- 비밀값 이름: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `GITHUB_ADMIN_TOKEN`
- 값 자체는 Git·브라우저·문서에 기록하지 않음
- 안전 마감 브랜치: `codex/multi-device-security`, 코드 `63d5d4f`, 문서 `9d12455`, GitHub PR `#1` (`main` 미반영·운영 미배포)
- CodeQL 지적 3건 수정; 로컬 20/20·Chrome 1280/390·PR CodeQL 통과, PR 기준 CodeQL·비밀·의존성 경고 0건
- GitHub vulnerability alerts·Dependabot security updates·CodeQL default setup 활성화
- 저장소는 PUBLIC이므로 Git에 저장한 콘텐츠와 이미지는 공개 자료로 취급
- 즉시 복구: Vercel에서 직전 Ready 배포로 Instant Rollback
- Git 복구: `5d37a84`를 revert하여 `main`에 push
- 배포 전 앱 기준선: `9954f93`
