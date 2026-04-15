const cp = require('child_process');

function getCount(commit) {
    try {
        const js = cp.execSync(`git -C "c:/Users/MJ/Desktop/바이브코딩/이민재 프로필" show ${commit}:profile-site/data.js`).toString();
        // Remove const profileData = and final if/module blocks to eval safely
        const start = js.indexOf('{');
        const end = js.lastIndexOf('}') + 1;
        const jsonLike = js.slice(start, end);
        const data = eval('(' + jsonLike + ')');
        return { L: data.lectures.length, Y: data.youtubeVideos.length };
    } catch (e) {
        return null;
    }
}

const commits = cp.execSync('git -C "c:/Users/MJ/Desktop/바이브코딩/이민재 프로필" rev-list --all').toString().split('\n').filter(Boolean);

console.log('Commit\t\tLectures\tYouTube');
for (const c of commits.slice(0, 10)) { // Check last 10
    const res = getCount(c);
    if (res) {
        console.log(`${c.slice(0, 7)}\t\t${res.L}\t\t${res.Y}`);
    }
}
