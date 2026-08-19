const featuredProofDefaults = [
  {
    id: 'proof_geg_daejeon',
    type: 'Community leadership',
    title: 'Google Educator Group 대전 리더',
    meta: 'Google for Education community',
    link: '',
    visible: true,
  },
  {
    id: 'proof_google_certified',
    type: 'Global certification',
    title: 'Google Certified Innovator & Trainer',
    meta: 'Innovator #SEO24',
    link: '',
    visible: true,
  },
  {
    id: 'proof_minister_award_2025',
    type: 'National recognition',
    title: '2025 정보(SW·AI)교육 유공 교육부장관 표창',
    meta: '교육부 · 2025',
    link: '',
    visible: true,
  },
  {
    id: 'proof_g_creator',
    type: 'Creator network',
    title: '교사크리에이터협회\nG-Creator',
    meta: '교육 콘텐츠·국제교류',
    link: '',
    visible: true,
  },
  {
    id: 'proof_aiedap',
    type: 'Teacher development',
    title: 'AIEDAP 마스터 교원',
    meta: 'AI·디지털 교육',
    link: '',
    visible: true,
  },
  {
    id: 'proof_touch',
    type: 'Teacher network',
    title: 'T.O.U.C.H. 교사단',
    meta: '교육 실천 공동체',
    link: '',
    visible: true,
  },
];

const deployedProofSource = Array.isArray(profileData.featuredProofs) ? structuredClone(profileData.featuredProofs) : null;
window.ProfileProofSource = deployedProofSource;
let featuredProofDraft = deployedProofSource || featuredProofDefaults;
try {
  const storedProofs = JSON.parse(localStorage.getItem('profileDraft.featuredProofs') || 'null');
  if (Array.isArray(storedProofs)) {
    featuredProofDraft = storedProofs.map((proof) => proof.id === 'proof_g_creator' && proof.title === '교사크리에이터협회 G-Creator'
      ? { ...proof, title: '교사크리에이터협회\nG-Creator' }
      : proof);
  }
} catch (_) {}

profileData.featuredProofs = featuredProofDraft;
