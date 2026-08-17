# 노트북·데스크탑 작업 전환

## 원칙

- GitHub 원격 저장소를 기기 간 코드 동기화의 기준으로 사용한다.
- 각 기기는 Google Drive, OneDrive, Dropbox 밖에 별도 clone을 둔다. 같은 `.git` 폴더를 클라우드 드라이브로 동기화하지 않는다.
- `main` push는 Vercel Production 배포이므로 배포 준비가 끝난 변경에만 사용한다.
- 진행 중 작업은 작업별 브랜치에서 관리한다. commit·push는 사용자가 명시적으로 동기화나 배포를 요청한 경우에만 한다.
- 비밀번호와 토큰은 Git, 문서, 채팅, 클라우드 파일에 넣지 않는다. 관리자 비밀값은 Vercel Production 환경변수에만 둔다.

## 각 기기 최초 설정

Git, PowerShell 7(`pwsh`), Node.js LTS 또는 Codex가 설치된 상태에서 클라우드 동기화 폴더 밖의 경로를 선택한다.

```powershell
New-Item -ItemType Directory -Force C:\workspace
Set-Location C:\workspace
git clone --branch codex/multi-device-workflow https://github.com/mj-lee-dj/MinjaeLee-Profile.git
Set-Location '.\MinjaeLee-Profile\이민재 프로필'
.\tools\setup-device.cmd
```

`setup-device.cmd`는 저장소 로컬 Git 설정만 안전하게 구성한다. Git 사용자 이름·이메일이나 비밀값은 자동으로 만들지 않는다.

## 작업 시작

```powershell
Set-Location 'C:\workspace\MinjaeLee-Profile\이민재 프로필'
.\tools\work-start.cmd
```

스크립트가 원격 변경을 fetch하고 현재 브랜치, ahead/behind, 이 프로젝트의 변경사항과 상위 저장소의 추적 변경을 출력한다. 자동 pull은 하지 않는다.

- 작업 트리가 깨끗하고 현재 브랜치가 원격보다 뒤처졌을 때만 `git pull --ff-only`를 검토한다.
- 변경이 있으면 pull하지 말고 먼저 변경의 소유자와 범위를 확인한다.
- 작업은 가능하면 `codex/<작업명>` 브랜치에서 진행한다.

Codex에는 다음처럼 요청한다.

> `HANDOFF.md`와 `MULTI_DEVICE_WORKFLOW.md`를 읽고 `tools/work-start.cmd` 결과를 확인한 뒤, 기존 변경을 보존하면서 다음 작업을 이어서 진행해줘.

## 기기 전환 전 종료

```powershell
.\tools\work-finish.cmd
```

스크립트는 관리자 API 테스트, JavaScript 구문, diff 공백 오류와 프로젝트 변경 목록을 검사한다. 자동 stage·commit·push는 하지 않는다.

그다음 Codex에 다음처럼 요청한다.

> 현재 작업을 기기 전환 가능한 상태로 정리해줘. 테스트하고 `HANDOFF.md`를 갱신한 뒤, 이 프로젝트의 정확한 파일만 검토해 작업 브랜치에 commit·push해줘. `main`에는 push하지 마.

원격 push 성공을 확인한 다음 다른 기기에서 `work-start.cmd`를 실행한다. 동시에 두 기기에서 같은 브랜치를 수정하지 않는다.

## Production 배포

`main` push는 단순 동기화가 아니라 Production 배포다. 명시적으로 배포를 요청하고 테스트·staged diff·비밀값·데이터 동기화를 확인한 뒤에만 수행한다.

## 현재 Google Drive 작업 폴더

현재 데스크탑의 `G:\내 드라이브\0. 바이브코딩` 저장소는 기존 작업 보존용으로 유지한다. 새 기기 전환 체계를 확인하기 전에는 이동하거나 삭제하지 않는다. 장기적으로는 각 기기의 로컬 clone을 사용하고 Google Drive에는 문서·이미지 원본만 별도로 보관한다.
