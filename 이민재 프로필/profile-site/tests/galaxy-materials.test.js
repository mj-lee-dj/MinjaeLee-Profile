const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const published=JSON.parse(fs.readFileSync(path.join(root,'data_v3.json'),'utf8'));
const id='lectures_20261021_galaxy_teacher_lab',key='profileDraft.contentV1',migration='2026-10-26-galaxy-title-image';
const target=data=>data.lectures.find(x=>x.id===id);
const plain=value=>JSON.parse(JSON.stringify(value));
function start(data=published,storage=new Map()){
 const writes=[];
 const context={profileData:structuredClone(data),structuredClone,console,CustomEvent:class {},window:{dispatchEvent(){}},
 localStorage:{getItem:k=>storage.get(k)||'',setItem:(k,v)=>{writes.push(k);storage.set(k,v);},removeItem:k=>storage.delete(k)}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'draft-content-store.js'),'utf8'),context);
 return {data:context.profileData,store:context.window.ProfileContentStore,storage,writes};
}
function oldData(){const data=structuredClone(published);Object.assign(target(data),{title:'교사가 편해지는 갤럭시 수업 루틴',images:[],image:''});return data;}
test('Galaxy title and gallery use cover first, Watch second, and the approved document third',()=>{
 const item=target(published);
 assert.equal(item.title,'삼성전자 갤럭시 티처랩 | 교사가 편해지는 갤럭시 수업 루틴');
 assert.equal(item.images.length,3);
 assert.deepEqual(item.images.slice(0,2),['uploads/20261021-galaxy-cover.webp','uploads/20261021-galaxy-watch.webp']);
 assert.equal(item.image,item.images[0]);
 item.images.forEach(image=>assert.ok(fs.existsSync(path.join(root,image))));
 assert.equal(item.link,'https://drive.google.com/file/d/1gf0wXR6AEzhoAPPzn5RRAisBasJhj2hC/view');
 assert.equal(item.linkLabel,'참가자 한 장 요약 · PDF');
 assert.equal(published.youtubeVideos[0].id,'youtubeVideos_20261007_canva_korea');
 assert.equal(published.lectureCuration.highlights[1],'lectures_20261007_canva_korea');
});

for(const versioned of [false,true])test(`previous summary-only Galaxy image is corrected even after its earlier migration (versioned: ${versioned})`,()=>{
 const previous=structuredClone(published);
 Object.assign(target(previous),{images:['uploads/20261021-galaxy-participant-summary.webp'],image:'uploads/20261021-galaxy-participant-summary.webp'});
 const candidate=versioned?plain(start(previous).store.state):previous;
 candidate.contentMigrationIds=[migration];
 target(candidate).visible=false;
 candidate.lectures[0].title='보존할 사용자 편집';
 const raw=JSON.stringify(candidate),first=start(published,new Map([[key,raw]]));
 assert.deepEqual(plain(target(first.data).images),target(published).images);
 assert.equal(target(first.data).image,target(published).images[0]);
 assert.equal(target(first.data).visible,false);
 assert.equal(first.data.lectures[0].title,'보존할 사용자 편집');
 assert.equal(first.storage.get(key),raw);assert.deepEqual(first.writes,[]);
 assert.equal(first.store.state.contentMigrationIds.filter(x=>x==='2026-10-26-galaxy-selected-images').length,1);
 assert.deepEqual(plain(first.store.load()),plain(first.store.load()));
});

test('a later explicit choice of the old summary image survives save, merge and reload',()=>{
 const first=start(),candidate=plain(first.store.state);
 Object.assign(target(candidate),{images:['uploads/20261021-galaxy-participant-summary.webp'],image:'uploads/20261021-galaxy-participant-summary.webp'});
 first.store.save(candidate);
 const payload=first.store.merge(published,first.store.load());first.store.save(payload);
 const again=start(payload,first.storage);
 assert.deepEqual(plain(target(again.data).images),target(candidate).images);
 assert.equal(target(again.data).image,target(candidate).image);
});
for(const versioned of [false,true])test(`old Galaxy drafts gain title and image without storage writes (versioned: ${versioned})`,()=>{
 const candidate=versioned?plain(start(oldData()).store.state):oldData();
 candidate.lectures[0].title='무관한 로컬 수정';
 target(candidate).visible=false;
 const raw=JSON.stringify(candidate),first=start(published,new Map([[key,raw]]));
 assert.equal(target(first.data).title,target(published).title);
 assert.deepEqual(plain(target(first.data).images),target(published).images);
 assert.equal(target(first.data).visible,false);
 assert.equal(first.data.lectures[0].title,'무관한 로컬 수정');
 assert.equal(first.storage.get(key),raw);assert.deepEqual(first.writes,[]);
 assert.equal(first.store.state.contentMigrationIds.filter(x=>x===migration).length,1);
 assert.deepEqual(plain(first.store.load()),plain(first.store.load()));
});
test('custom Galaxy titles, images and links survive the correction',()=>{
 const candidate=oldData();Object.assign(target(candidate),{title:'직접 수정한 제목',images:['uploads/custom.webp'],image:'uploads/custom.webp',link:'https://example.com/custom'});
 const {data}=start(published,new Map([[key,JSON.stringify(candidate)]]));
 assert.deepEqual(target(data),target(candidate));
});
test('later explicit clearing or deletion survives the admin save-merge-save lifecycle',()=>{
 for(const remove of [false,true]){
  const first=start();const candidate=plain(first.store.state);
  if(remove)candidate.lectures=candidate.lectures.filter(x=>x.id!==id);
  else Object.assign(target(candidate),{title:'교사가 편해지는 갤럭시 수업 루틴',images:[],image:''});
  first.store.save(candidate);
  const payload=first.store.merge(published,first.store.load());first.store.save(payload);
  const again=start(payload,first.storage);
  assert.deepEqual(plain(again.data.lectures),payload.lectures);
  assert.ok(!Object.hasOwn(payload,'contentMigrationIds'));
 }
});
