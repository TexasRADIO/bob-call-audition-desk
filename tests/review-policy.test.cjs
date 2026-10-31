const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const policy=require('../review-policy.js');
test('newer baseline decision wins while retaining older local-only comment',()=>{
 const r=policy.decision('c',{c:{status:'skip',reviewed_at:'2026-10-31T12:00:00Z'}},{c:{status:'keep',comment:'starts late',reviewed_at:'2026-10-31T11:00:00Z'}});
 assert.equal(r.status,'skip');assert.equal(r.comment,'starts late');
});
test('a label-only correction cannot discard a local usability choice',()=>{
 const r=policy.decision('c',{c:{category:'ah',label:'Ah!',reviewed_at:'2026-10-31T12:00:00Z'}},{c:{status:'keep',reviewed_at:'2026-10-31T11:00:00Z'}});
 assert.equal(r.status,'keep');assert.equal(r.category,'ah');
});
test('comments and labels export without granting sample approval',()=>{
 for(const r of [{comment:'Ah, not Ah-ha'},{comment:''},{category:'ah'}]){
  const c=policy.effective({id:'c',category:'uncertain_vocal'},{reviewed_library:true,review_defaults:{c:r}},{});
  assert.equal(policy.hasReview(c.review),true);assert.equal(c.available,false);assert.equal(c.review.status,undefined);
 }
 assert.equal(policy.hasReview({}),false);
});
test('choice changes and reset preserve comments and original baseline choices',()=>{
 const local={c:{status:'skip',category:'alright',comment:'tail clipped',reviewed_at:'2026-10-31T12:00:00Z'}};
 const base={c:{status:'keep',category:'signature_aah_haa',reviewed_at:'2026-10-31T11:00:00Z'}};
 policy.resetChoice('c',base,local);const r=policy.decision('c',base,local);
 assert.equal(r.status,'keep');assert.equal(r.category,'signature_aah_haa');assert.equal(r.comment,'tail clipped');
});
test('second review retains all268keeps,54failures and12comments',()=>{
 const library=JSON.parse(fs.readFileSync('manifest.json'));const calls=library.calls.map(c=>policy.effective(c,library,{}));
 assert.equal(calls.filter(c=>c.available).length,268);assert.equal(calls.filter(c=>c.review.status==='skip').length,54);assert.equal(calls.filter(c=>c.review.comment).length,12);
 const ah=calls.find(c=>c.id==='call-d90473ad64cbb135');assert.equal(ah.category,'ah');assert.equal(ah.label,'Ah!');assert.equal(ah.available,true);assert.equal(calls.find(c=>c.id==='call-42e5612afc2c7a33').review.comment,'Look out Leon\n');
});
test('comment HTML is escaped, including attempted textarea/script breakout',()=>{
 const context={};vm.runInNewContext(fs.readFileSync('review-notes.js','utf8'),context);const html=context.BobReviewNotes.field({comment:'</textarea><script>alert(1)</script>" &'});
 assert.ok(html.includes('&lt;/textarea&gt;'));assert.equal(html.includes('<script>'),false);
});
test('all families shuffle only kept distinct occurrences',()=>{
 const context={};vm.runInNewContext(fs.readFileSync('picker.js','utf8'),context);
 for(const category of ['ah','uh_huh','swing_out','alright','named_player_cue']){
  const pool=new context.BobCallPool(1);pool.configure([{id:'a',category,available:true,file:'a.wav',occurrence_id:'a'},{id:'copy',category,available:true,file:'b.wav',occurrence_id:'a'},{id:'pending',category,available:false,file:'c.wav',occurrence_id:'b'}],category);
  assert.equal(pool.bag.length,1);assert.equal(pool.next().id,'a');
 }
});
