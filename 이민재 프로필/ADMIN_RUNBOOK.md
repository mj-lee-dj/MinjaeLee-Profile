# 관리자 페이지 운영 런북

## 현재 상태 — HOLD

관리자 화면은 안전한 로그인 화면으로 교체됐지만 Vercel 프로젝트에서 최소 Function도 빌드 실패하여 서버 진입점을 비활성화했다. 현재 `/api/admin`은 404이며 로그인·저장을 시도하지 않는다. 배포 `FjkT2NEG89Z2nHJa16cFgVVrP86o`의 Build Logs 원인을 해결하고 전체 E2E 검증을 마친 뒤에만 아래 절차를 사용한다.

## 구조

- 관리자 주소: `https://minjae-lee-profile.vercel.app/admin.html`
- 인증: Vercel 서버에 설정한 비밀번호로 4시간 보안 세션 발급
- 저장: 브라우저가 데이터만 서버로 전달하며 GitHub 토큰은 브라우저에 노출되지 않음
- 운영 원본: `이민재 프로필/profile-site/data_v3.js`
- 동기 본: `이민재 프로필/profile-site/data_v3.json`
- 배포: 관리자 저장 → GitHub `main` 커밋 → Vercel 자동 배포 → 관리자 화면이 운영 JSON 일치를 최대 2분간 확인

## 필수 Vercel 환경변수

실제 값은 Vercel Project Settings → Environment Variables의 **Production**에만 설정한다.

- `ADMIN_PASSWORD`: 관리자 로그인 비밀번호. 코드나 Git에 저장하지 않는다.
- `ADMIN_SESSION_SECRET`: 세션 서명용 무작위 비밀값. 최소 32바이트를 권장한다.
- `GITHUB_ADMIN_TOKEN`: `mj-lee-dj/MinjaeLee-Profile` 하나의 Contents 읽기/쓰기만 허용한 fine-grained token을 권장한다.

환경변수를 추가하거나 교체하면 새 Production 배포가 필요하다. 키 값은 `.env.example`, `HANDOFF.md`, 커밋, 채팅에 남기지 않는다.

## 정상 수정 절차

1. 관리자 페이지에 로그인한다.
2. 최신 항목 수가 강의 60, 보도 12 이상인지 확인한다.
3. 한 번에 하나의 논리적 변경만 수정한다.
4. `전체 저장 & 배포`를 누른다. 항목 수가 줄면 삭제 확인이 한 번 더 표시된다.
5. `운영 사이트 반영 완료` 알림을 받을 때까지 탭을 닫거나 추가 저장하지 않는다.
6. 공개 사이트에서 수정한 항목과 이미지를 확인한다.
7. 공용 PC나 작업 종료 시 `로그아웃`한다.

## 저장 중단 조건

아래 메시지가 보이면 추가 저장하지 말고 Codex에게 점검을 요청한다.

- `다른 변경이 먼저 저장되었습니다`
- `GitHub 저장은 완료됐지만 ... 배포를 확인하지 못했습니다`
- `관리자 환경 설정이 완료되지 않았습니다`
- 데이터 검증, 이미지 업로드, GitHub 권한 오류

## 롤백

- 운영 변경을 즉시 취소할 때: Vercel에서 직전 정상 배포로 Instant Rollback/Promote.
- 영구 복구: 문제가 된 관리자 커밋을 Git 이력에서 확인한 뒤 revert 커밋을 `main`에 push.
- `reset --hard`, force push는 사용하지 않는다.
