---
description: Deploy changes to GitHub (triggers Vercel deployment)
projectRoot: "G:\\내 드라이브\\0. 바이브코딩\\profile-site"
---
// turbo-all

## 주의사항
- admin 페이지가 GitHub API로 직접 커밋하므로, 로컬보다 origin/main이 앞서 있을 수 있음
- 반드시 pull 먼저 수행 후 push할 것 (uploads 폴더 삭제 방지)

## 배포 단계

1. 원격 변경사항 먼저 가져오기 (admin 페이지 커밋과 충돌 방지)
   작업 디렉토리: G:\내 드라이브\0. 바이브코딩\profile-site
   `git fetch origin`
   `git merge origin/main --no-edit -X ours`

2. 변경된 파일만 스테이징 (uploads 폴더 제외 - GitHub에서 직접 관리됨)
   `git add data_v3.js data_v3.json index.html admin.html script.js style.css`
   (또는 변경된 파일만 선택적으로 추가)

3. 커밋
   `git commit -m "Update-YYYY-MM-DD"`

4. Push (GitHub → Vercel 자동 배포 트리거)
   `git push origin main`

## 이미지 저장 구조
- 이미지는 로컬이 아닌 **GitHub API를 통해 GitHub 저장소에 직접 저장**됨
- 경로: profile-site/uploads/{sha}.{ext}
- URL: https://raw.githubusercontent.com/mj-lee-dj/MinjaeLee-Profile/main/profile-site/uploads/...
- admin.html 내 save() 함수가 base64 이미지를 자동으로 GitHub에 업로드함
- 로컬 uploads 폴더는 참조용이며, git으로 추적할 필요 없음
