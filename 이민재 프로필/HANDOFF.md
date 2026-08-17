# HANDOFF — 이민재 프로필 사이트

- 마지막 갱신: 2026-08-17 KST
- 현재 목표: 프로필 사이트의 안전한 관리 주체를 Codex로 완전 이전

## 현재 상태

- Git 루트: `G:\내 드라이브\0. 바이브코딩`
- 프로젝트: `이민재 프로필`
- Vercel Root: `이민재 프로필/profile-site`
- 운영 데이터 원본: `이민재 프로필/profile-site/data_v3.js`
- 운영 URL: `https://minjae-lee-profile.vercel.app/`
- E2E 검증 커밋: `20d72d1` (`chore: verify profile deployment pipeline`)
- Vercel Production status: success (`9YFZFiEbtKahrxghTAfikZ2rnN5Y`)
- 운영 검증: 표식 200, 핵심 정적 파일 6개 일치, 공개 페이지 콘솔 오류 0
- 실제 공개 콘텐츠 마지막 변경은 `b4dd583`
- 정상 데이터: 강의 60, 보도 12

## 완료

- 전체 파일·Git 이력·GitHub·Vercel 설정/로그·운영 페이지 감사
- 안티그래비티 1차 핸드오프와 추가 종합 보고서 대조
- 폴더 이동·유실/복원·캐시·CLI 실패 이력 반영
- `.agents/AGENTS.md`와 `CODEX_HANDOFF.md`의 잘못된 경로·관리자·CSS 규칙 교정
- 수정→커밋→main push→Vercel→운영 응답 전체 파이프라인 검증
- 운영 데스크톱·모바일·필터·8개 섹션·이미지 277개·Core Web Vitals 확인
- 상세 운영 기준: `CODEX_HANDOFF.md`

## HOLD — 관리자 페이지 사용 금지

- 관리자는 오래된 `profile-site/data_v3.js`를 읽고 쓰고, 실제 배포 원본은 `이민재 프로필/profile-site/data_v3.js`
- 오래된 복제본은 강의 54/보도 10, 정상 원본은 60/12
- 저장해도 운영 데이터가 바뀌지 않으며 과거 데이터 재유입 위험이 있음
- 공개 비밀번호는 실질 인증이 아니고 GitHub PAT/Gemini 키를 localStorage에 저장함
- 로그아웃은 인증 상태와 토큰을 지우지 않음
- 로그인 화면에서도 Google `client_id` 누락 오류가 발생함

## 다음 작업

1. 관리자 임시 차단/경고
2. 오래된 루트 `profile-site/` 참조 제거 및 원본 단일화
3. 관리자 경로·JS/JSON 동기화·검증·실패 복구 수정
4. 공개 비밀번호/브라우저 PAT 구조 교체
5. 데이터·이미지·비밀·경로 자동 검증
6. main 보호/배포 체크 검토
7. 전체 회귀 검증 후 관리자 HOLD 해제 여부 결정

## 중요 파일

- `.agents/AGENTS.md`
- `CODEX_HANDOFF.md`
- `profile-site/index.html`
- `profile-site/admin.html`
- `profile-site/data_v3.js`
- `profile-site/data_v3.json`
- `profile-site/script.js`
- `profile-site/style.css`
- `.agent/mcp-google-workspace/` — 로컬 비밀 포함, Git 미추적

## 주의

- 사이트 변경은 프로젝트 루트의 `profile-site/`에서 하되 Git 경로는 `이민재 프로필/profile-site/...`
- 작업 트리가 더러우므로 무조건 pull하지 말고 사용자 변경을 보존
- 정확한 파일만 스테이징; `git add .`, hard reset, force push 금지
- `data_v3.js`가 원본이고 JSON은 현재 동기화 유지
- CSS 맨 아래 무조건 추가/습관적 `!important` 금지
- Vercel CLI는 이 PC에서 한글 컴퓨터명 관련 실패 기록이 있어 운영 배포에 사용하지 않음
- 배포 검증 표식은 확인 후 정리 커밋에서 제거하며 사용자에게 보이는 콘텐츠는 변경하지 않음
- favicon 404는 기존의 낮은 우선순위 누락으로 별도 수정 필요
