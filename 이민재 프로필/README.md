# 이민재 프로필 (Minjae Lee Profile)

이 프로젝트는 이민재 선생님의 프로필 웹사이트입니다.

## 프로젝트 구조
- `profile-site/`: 웹사이트 소스 코드 (HTML, CSS, JS)
- `admin_guide.md`: 관리자 페이지 가이드

## 배포
이 저장소의 `main` 브랜치에 푸시하면 Vercel을 통해 자동으로 배포됩니다.

## 여러 기기에서 작업

노트북과 데스크탑 전환 절차는 `MULTI_DEVICE_WORKFLOW.md`를 따릅니다.

```powershell
.\tools\setup-device.cmd  # 기기별 최초 1회
.\tools\work-start.cmd    # 작업 시작
.\tools\work-finish.cmd   # 기기 전환 전
```

각 기기는 클라우드 동기화 폴더 밖에 별도 clone을 사용합니다. 진행 중 동기화는 작업 브랜치, Production 배포는 `main`을 사용하며 비밀값은 Vercel 환경변수에만 둡니다.

`main` push는 Production 배포이므로 단순 기기 동기화에 사용하지 않습니다.
