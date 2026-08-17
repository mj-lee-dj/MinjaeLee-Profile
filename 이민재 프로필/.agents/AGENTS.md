# 이민재 프로필 사이트 - 작업 규칙

## 배포 구조
- **GitHub 저장소**: https://github.com/mj-lee-dj/MinjaeLee-Profile.git (브랜치: main)
- **배포 플랫폼**: Vercel (자동 배포)
- **배포 URL**: https://minjae-lee-profile.vercel.app/
- **사이트 폴더**: `profile-site/`

## 배포 경로 (2가지)

### 경로 1: 관리자 페이지에서 수정 (사용자 직접)
1. https://minjae-lee-profile.vercel.app/admin.html 접속
2. 데이터 추가/수정
3. **"저장 & 배포" 버튼** 클릭 → GitHub API로 직접 커밋·푸시
4. Vercel 자동 재배포 (약 1~2분)

> ⚠️ 주의: 관리자 페이지 저장 시 데이터 손실 버그가 발생한 적 있음 (2026.08.09).
> 저장 후 반드시 https://minjae-lee-profile.vercel.app/ 에서 전체 데이터가 정상인지 확인할 것.
> 문제 발생 시 로컬 `data_v3.js`(정상 버전)로 복구 가능.

### 경로 2: 로컬 파일 직접 수정 (AI 또는 개발자)
1. `profile-site/data_v3.js` 및 `profile-site/data_v3.json` 수정
2. `git add` → `git commit` → `git push origin main`
3. Vercel 자동 재배포 (약 1~2분)
4. https://minjae-lee-profile.vercel.app/ 에서 반영 확인

## 데이터 동기화 주의사항
- 관리자 페이지 저장은 GitHub에 직접 커밋하므로, 로컬 파일과 GitHub이 불일치할 수 있음
- 로컬에서 수정 전 반드시 `git pull origin main`으로 최신 상태 동기화
- `data_v3.js`와 `data_v3.json` 두 파일을 항상 동기화할 것
- 로컬 수정 후 반드시 `git push` 실행 (로컬 수정만으로는 사이트 미반영)

## Git 커밋 규칙
- 커밋 메시지는 **영어**로 작성 (cmd 인코딩 이슈)
- Vercel CLI 로그인이 한글 컴퓨터명 때문에 안 되므로, Git push 기반 배포 사용

## 데이터 파일 구조
- `profile-site/data_v3.js`: 브라우저에서 로드하는 메인 데이터 (const profileData = {...})
- `profile-site/data_v3.json`: JSON 형식 백업 (data_v3.js와 동일 내용)
- `profile-site/uploads/`: 이미지 파일 저장 폴더
- `profile-site/admin.html`: 관리자 페이지 (GitHub API로 직접 커밋 기능 포함)

## 상세 인수인계 문서
- 캐시 버스팅, CSS 아키텍처, script.js 렌더링 로직, 작업 레시피, 트러블슈팅 등
  상세 내용은 프로젝트 루트의 `CODEX_HANDOFF.md` 참조
