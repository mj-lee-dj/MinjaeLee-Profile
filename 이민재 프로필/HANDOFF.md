# HANDOFF — 이민재 프로필 사이트

- 마지막 갱신: 2026-10-26 KST
- 상태: 10월 자료 후속 수정·운영 검증 완료 — 기존 방문자 Watch 누락 복구 및 Canva 순서 조정
- 작업 브랜치: `main` (GitHub 연결을 통해 정상 fast-forward 반영)
- 콘텐츠·재방문 수정 릴리스: `edd1775bde8ee19bc8142d55f6195eae2579cc3f`
- 콘텐츠 트리: `635d78f8c1f5e20b348a697f7ac012e8ac834877`
- Production: `dpl_B6wJsf7QmiBiv6oaBCagvQrPuM7X` — READY, GitHub Vercel success, 운영 별칭 확인
- 운영 URL: https://minjae-lee-profile.vercel.app/
- Vercel Root: `이민재 프로필/profile-site`
- 데이터 원본: `profile-site/data_v3.js`, JSON 동기화: `profile-site/data_v3.json`

## 반영 내용

- Gemini Notebook 1·2회 자료를 AI에 추가. 기존 Watch 두 항목은 그대로 보존.
- Gemini Notebook 3회 AI 자료와 Watch 추가. 공개 영상의 정확한 제목 및 사용자 방송 주소 사용.
- 3회 자료는 공개 `3강_SWISS_28장_PNG.zip` 단일 파일. Markdown 제작 index·발표자 노트·편집원본 폴더 제외.
- Canva Korea 10/7 기존 강의 카드에 t2c 시청 링크 보완, 같은 주소의 Watch 항목 추가.
- 10/26 충남대학교 건설공학교육과 생성AI 강의 자료 허브를 AI에 추가.
- 10/21 삼성전자 갤럭시 티처랩 기록을 Canva·에듀테크에 추가. 공개 참가자 요약 PDF만 연결.
- 강사 전용 Galaxy 덱, 미확인 후기·인원·실적, 3회 진행 전 배지 미사용.
- 새 강의 5개 / 새 Watch 2개. 최종 강의 69개, Watch 21개. 기존 다른 프로필·기록 보존.
- 실제 공개 교안 표지·장면과 방송 썸네일 9개 사용. Canva 기존 이미지 재사용.
- 상세 gallery에 외부 자료 링크 표시, Tab 포커스 순환에 링크 포함.
- 오래된 브라우저 초안에는 새 Watch와 빈 Canva 링크만 보완. 사용자 편집·삭제·공개 상태 보존.

## 10/26 재방문 오류·정렬 후속

- 이전 운영 배포는 정상(강의 69 / Watch 21)이었으나, `profileDraft.contentV1`의 version 없는 구형 사본이 Watch 19개를 덮어쓰는 증상을 재현.
- 기존 코드가 추가 없이 마이그레이션 완료 표시만 남긴 상태도 복구. 이번 두 Watch와 빈 Canva 링크만 보완하며 저장소 원문은 변경하지 않음.
- Watch 원본 ID 기준을 로컬 초안 메타데이터에 추적하여 이후 명시적 삭제·재정렬은 보존. 게시 payload에 메타데이터가 새지 않음.
- 사용자 추가 요청: Lecture 기본 대표 카드 GES 1번 유지, Canva 2번 큰 자리, AI 워크플로 3번. 주제별 아카이브 순서는 그대로 유지.
- Watch Canva를 맨 앞에 이동. 나머지 항목·자료 링크·이미지·수정·숨김은 보존.
- 기존 큐레이션 완료 표시가 있어도 이전 Canva 3번 선택을 2번으로 보완. 이후 명시적으로 저장한 선택은 유지.
- 공개 탭 pageshow/focus/visibility 및 보이는 탭의 60초 확인으로 새 HTML 자산 버전을 감지해 한 번 갱신. 오프라인/동일 버전에서 반복 새로고침하지 않음.
- 이미 구버전으로 열린 탭은 최초 한 번 정상 새로고침 필요. 캐시나 저장소 전체 삭제는 필요 없음.

## 검증

- Node 테스트 148/148 통과. `node --test --test-reporter=tap tests/*.test.js tests/*.test.mjs`
- JavaScript 구문 검사 및 `git diff --check` 통과. 정적 사이트로 별도 package/build/lint 명령 없음.
- 별도 headless Chrome에서 로컬·운영 1280px / 375px 확인.
- AI 신규 4개, Canva·Galaxy, Watch 21개, 각 자료 링크·갤러리·Tab 포커스 검증.
- 가로 넘침 0, 확인한 이미지 오류 0, 페이지 JS 오류 0.
- 운영 HTML/JS/CSS 및 새 이미지 18개 응답 HTTP 200, Git blob SHA 전부 일치.
- 후속 수정의 운영 HTML·데이터·스크립트 9개도 원격 `edd1775`의 Git blob SHA와 일치.
- 로컬·운영 1280px / 375px에서 신규 방문, 구형 초안, 잘못 남은 완료 표시, 수정·숨김 초안을 각각 검증. 저장 원문 보존 및 새로고침 후 정렬 유지.
- 열린 운영 탭의 새 HTML 버전 감지·1회 갱신·반복 갱신 없음 검증. 임의로 숨긴 2개는 숨김 상태를 유지하며 기본 공개 Watch는 21개.
- 기존 강의 64개와 Watch 19개 보존 대조, 기존 Canva의 빈 링크만 변경.
- 10/23 충남고 2025년 정정 유지.

## 자료 확인·주의

- 1·2회 덱, 3회 PNG ZIP, Galaxy 참가자 PDF, CNU 최신 덱: anyone reader / 검색 노출 false 확인.
- 3회 방송: `https://joo.is/민재쌤노트북3강` → YouTube `x88cs2TdrBY`; oEmbed의 정확 제목 확인.
- CNU 연결: `https://joo.is/261026충남대`; 최신 덱의 실제 표지만 사용, 발표 파일 미교체.
- Canva 시청 페이지 HTTP 200. 로그인 안내는 진도 저장용이며 익명 전체 재생을 보증하지 않음.
- 요청 외 활동은 공개 근거가 충분한 누락을 확인하지 못해 추가하지 않음. Instagram 개별 게시물 접근에는 제약이 있었음.

## 다음 작업·기기 전환

- `.agents/AGENTS.md`와 `MULTI_DEVICE_WORKFLOW.md`의 세션 게이트 준수.
- 다음 새 세션 및 배포 전 fetch 후 원격 main과 사용자 변경 확인.
- CLI Git 인증 대기는 종료했고 새 로그인·권한 변경 없이 기존 GitHub 연결로 반영.
- 원격 후속 트리는 로컬 검증 커밋 `3e85423`과 동일. 로컬 기준 커밋은 별도 codex 브랜치에 보존.
- 관리자 저장은 이번 작업에서 사용하지 않음. 기존 인증 설정과 다른 앱·ASide 작업 미변경.
- 비밀값·개인 세션 기록을 읽거나 Git·로그에 추가하지 않음.
