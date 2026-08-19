window.ProfileAdminCollections = Object.freeze([
  {
    key: 'publications', label: '저서', singular: '저서',
    description: '표지·구입 링크·출판 정보를 포함해 공개 순서대로 관리합니다.',
    fields: [
      ['title', '제목', 'text', true], ['publisher', '출판사', 'text'],
      ['year', '출간 연도', 'text'], ['link', '구입 링크', 'url'],
      ['images', '표지 경로', 'images'], ['previewDesc', '소개', 'textarea'],
    ],
  },
  {
    key: 'onlineCourses', label: '온라인 연수', singular: '온라인 연수',
    description: '연수원·학점·썸네일과 상세 링크를 관리합니다.',
    fields: [
      ['title', '연수명', 'text', true], ['platform', '연수원', 'text', true],
      ['credit', '학점·과정', 'text'], ['link', '상세 링크', 'url'],
      ['images', '썸네일', 'images', true],
    ],
  },
  {
    key: 'youtubeVideos', label: 'Watch', singular: '영상',
    description: '공개 캐러셀 순서와 YouTube 링크·썸네일을 관리합니다.',
    fields: [
      ['title', '영상 제목', 'text', true], ['link', '영상 링크', 'url', true],
      ['images', '썸네일 경로', 'images'],
    ],
  },
  {
    key: 'lectures', label: '강의 이력', singular: '강의',
    description: '주제·기관·연도와 대표 슬라이드를 관리합니다. 대표 5개 선정은 아래 큐레이션에서 따로 관리합니다.',
    fields: [
      ['title', '강의명', 'text', true], ['org', '연수기관·주최', 'text'],
      ['year', '연도', 'text'], ['topic', '주제', 'topic', true],
      ['link', '관련 링크', 'url'], ['images', '대표 슬라이드 (최대 3장)', 'images'],
    ],
  },
  {
    key: 'awards', label: '수상', singular: '수상 기록',
    description: 'Records의 Awards에 표시할 수상 이력을 관리합니다.',
    fields: [
      ['title', '수상명', 'text', true], ['org', '기관', 'text'],
      ['year', '연도', 'text'], ['link', '관련 링크', 'url'],
    ],
  },
  {
    key: 'activities', label: '활동', singular: '활동 기록',
    description: 'Records의 Activities에 표시할 주요 역할과 활동을 관리합니다.',
    fields: [
      ['title', '활동명', 'text', true], ['period', '기간', 'text'],
      ['link', '관련 링크', 'url'],
    ],
  },
  {
    key: 'press', label: '보도자료', singular: '보도자료',
    description: '기사·인터뷰의 매체, 날짜, 링크와 대표 이미지를 관리합니다.',
    fields: [
      ['title', '기사 제목', 'text', true], ['source', '매체', 'text'],
      ['date', '날짜', 'text'], ['link', '기사 링크', 'url'],
      ['images', '대표 이미지 경로', 'images'], ['previewDesc', '요약', 'textarea'],
    ],
  },
]);
