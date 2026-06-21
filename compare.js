var fs = require('fs');

var newFiles = new Set(fs.readFileSync('new_uploads.txt', 'utf8').split('\r\n').map(f => f.trim()).filter(Boolean));
var oldFiles = new Set(fs.readFileSync('old_uploads.txt', 'utf8').split('\r\n').map(f => f.trim()).filter(Boolean));

// 구폴더에만 있고 신폴더에 없는 파일 (신폴더로 복사해야 할 수 있음)
var onlyInOld = [...oldFiles].filter(f => !newFiles.has(f));
// 신폴더에만 있는 파일
var onlyInNew = [...newFiles].filter(f => !oldFiles.has(f));

console.log('바이브코딩/profile-site/uploads 총:', newFiles.size, '개');
console.log('이민재 프로필/profile-site/uploads 총:', oldFiles.size, '개');
console.log('\n구폴더에만 있고 신폴더에 없는 파일 (삭제 시 손실될 것):', onlyInOld.length, '개');
if (onlyInOld.length > 0) onlyInOld.forEach(f => console.log('  MISSING:', f));
console.log('\n신폴더에만 있는 파일 (최신 추가분):', onlyInNew.length, '개');
