# HANDOFF — 이민재 프로필 사이트

- 마지막 갱신: 2026-11-05 KST
- 상태: 강의 3건 및 Gemini Notebook 4회 추가와 Watch 4강 방송 썸네일 교체 공개 검증 완료.
- 콘텐츠 릴리스: `a6e411bd2ae7f64f483b9a72e3e0d9bea7482e20`
- 콘텐츠 트리: `596036372e4a56ff0606081b13e72dc4e14ac1d3`
- 운영 URL: https://minjae-lee-profile.vercel.app/
- Vercel Root: `이민재 프로필/profile-site`
- 데이터 원본: `profile-site/data_v3.js`, JSON 동기화: `profile-site/data_v3.json`
- GitHub Production deployment `7568384885`: success, 2026-11-05 08:02 UTC.
- 동일 콘텐츠 커밋의 GitHub Vercel 상태 success 및 운영 별칭 응답 확인.

## 이번 반영 내용

- 10/28 둔천초: 실제 교실 디지털 루틴 및 AI 활용. 주제는 교사 업무·학급경영. 승인된 B안 비유 이미지 3장.
- 둔천초 표지의 대덕초등학교 이민재 표기 보존.
- 11/2 구글 공인 트레이너 인증 준비와 TSA: Google 주제, 주관 기관은 정확히 충남대학교 x GEG대전 x 오늘배움.
- 트레이너 원본의 1·2·3쪽(표지, 잘 쓰는 사람에서 잘 가르치는 사람으로, 인증 전체 과정)만 사용. 퀴즈와 지원서 양식 제외.
- 11/3 Gemini Notebook 4회: AI 강의 및 Watch 양쪽 추가. 표지, 마인드맵, 학습 코치 3장.
- Watch 4강은 강의 표지가 아닌 실제 공개 방송 썸네일로 교체. 원본: https://i.ytimg.com/vi/z8dgqCXs6TY/maxresdefault.jpg
- Watch 이미지 파일: `uploads/20261103-gemini-notebook-watch.jpg` (1280×720). AI 강의의 승인된 슬라이드 3장은 그대로 유지.
- 영상 주소: https://www.youtube.com/live/z8dgqCXs6TY. 제목은 YouTube oEmbed에서 확인.
- 기존 강의 69개와 Watch 21개는 필드·상대 순서 보존. 추가 후 총 강의 72개, Watch 22개.
- 사용자 최종 요청 순서: Watch Canva의 정석 → 4강 → 3강 → 2강 → 1강. 기존 대표 강의 5선 유지.
- 기존 초안의 콘텐츠와 순서에 한 번 보완 적용. 편집·숨김·명시적 저장 후 삭제·후속 재정렬 보존. 로드 시 저장소 원문을 쓰지 않음.
- 오래된 baseline 없는 강의 초안의 과거 삭제 구분 한계는 기존 동작이며 이번에 확대하지 않음.

## 검증

- Node 테스트 179/179 통과: `node --test --test-reporter=tap tests/*.test.js tests/*.test.mjs`
- 변경 JavaScript 구문 검사 및 `git diff --check` 통과.
- 기존 모든 프로필 필드와 강의·Watch 레코드 및 상대 순서 보존 대조 통과.
- 새 이미지 9개 실제 픽셀·디코딩·해시 검토 완료.
- 공개·관리자 HTML 4개에서 data_v3.js와 draft-content-store.js 캐시 키를 `20261105-live4-watch-thumbnail`로 동기화.
- 운영 HTML·JS·JSON·초안 스크립트 및 새 이미지 9개 총 13개 HTTP 200, 검증본과 바이트 일치.
- 썸네일 교체 후 운영 HTML·JS·JSON·초안 스크립트·방송 JPEG 5개 HTTP 200 및 로컬 바이트 일치.
- 실제 운영 Watch 화면에서 초록색 방송 썸네일 완전 로드(1280×720), 영상 링크와 Canva → 4강 → 3강 → 2강 → 1강 순서 재확인.
- 이전 초안의 정확히 일치하는 옛 강의 표지만 한 번 교정. 사용자 지정 이미지·삭제·숨김·후속 선택은 보존.
- 공개 브라우저(1212px)에서 Watch 첫 5개 순서, 강의 총계, 세 강의 주제·기관명 확인.
- 세 갤러리의 1→2→3장 이동, 이미지 완전 로드, 닫기, Live 4회 다시보기 링크 확인.
- 가로 넘침 없음. 확인한 경고/오류는 브라우저 확장의 메타데이터 전송 오류이며 사이트 파일 오류는 관찰하지 않음.
- 모바일 뷰포트 브라우저 검증은 이번에 별도로 수행하지 않음. 기존 모바일 CSS는 변경하지 않음.
- Preview 로그인 보호는 변경하지 않음. 사용자 공개 배포 승인 후 통상 main fast-forward 배포를 완료하고 운영에서 검증.
- Vercel 연결의 배포 목록 조회는 403 권한 오류로 중단. GitHub에 기록된 배포 결과와 공개 운영 응답으로 검증.

## 다음 작업·기기 전환

- 새 작업 세션 및 배포 직전 fetch로 원격 main과 사용자 변경을 확인.
- GitHub 기준으로 독립된 clone에서 이어서 작업. force push 및 hard reset 금지.
- 관리자 저장, 인증·환경변수·공유 설정은 이번 작업에서 사용하거나 변경하지 않음.
- 비밀값·개인 세션 기록을 읽거나 Git·로그에 추가하지 않음.
