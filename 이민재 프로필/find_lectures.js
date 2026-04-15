const cp = require('child_process');

function getLectures(commit) {
    try {
        const js = cp.execSync(`git -C "c:/Users/MJ/Desktop/바이브코딩/이민재 프로필" show ${commit}:profile-site/data.js`).toString();
        const data = eval(js + '; profileData;');
        return data.lectures;
    } catch (e) {
        return null;
    }
}

const mainL = getLectures('main'); // Now data_v3.js is on main, but in 4fe17ed it was data.js
const e43L = getLectures('e4320da');

console.log('Main lectures:', mainL ? mainL.length : 'NULL');
console.log('e4320da lectures:', e43L ? e43L.length : 'NULL');

if (e43L && mainL) {
    const mainTitles = new Set(mainL.map(l => l.title));
    const uniqueToE43 = e43L.filter(l => !mainTitles.has(l.title));
    console.log('\nLectures in e4320da but NOT in current main:');
    uniqueToE43.forEach(l => console.log(' -', l.title));
}
