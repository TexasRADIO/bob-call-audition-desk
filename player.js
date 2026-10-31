'use strict';
const library=window.BOB_LIBRARY||{calls:[],steel:[]};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={signature_aah_haa:'Aah Haa',encouragement:'Encouragement',named_player_cue:'Band / solo cue',uncertain_vocal:'Call candidate',ah:'Ah!',uh_huh:'Uh-huh!',swing_out:'Swing out!',alright:'Alright!',yeah:'Yeah!',other_call:'Other call'};
const storageKey='bb-bob-call-review-v3';
let reviews={};try{reviews=JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{}
let active=null,epoch=0;
const audio=$('#audio');audio.volume=.7;
const pools=new Map(Object.keys(labels).map((category,i)=>[category,new BobCallPool((Date.now()+i*8191)>>>0)]));

function saveLocal(){try{localStorage.setItem(storageKey,JSON.stringify(reviews))}catch{}}
function effective(c){return BobReviewPolicy.effective(c,library,reviews)}
$('#keptOnly').checked=!!library.reviewed_library;
function allCalls(){return library.calls.map(effective);}
function poolFor(category){const p=pools.get(category);p.configure(allCalls(),category);return p;}
function refreshCounts(){
  const calls=allCalls(),occurrences=new Set(calls.map(c=>c.occurrence_id));
  const sig=poolFor('signature_aah_haa').bag.length,enc=poolFor('encouragement').bag.length,cue=poolFor('named_player_cue').bag.length;
  const kept=calls.filter(c=>c.review.status==='keep').length,failed=calls.filter(c=>c.review.status==='skip').length,pending=calls.length-kept-failed;
  $('#libraryCount').textContent=`${kept} kept calls · ${new Set(calls.map(c=>c.source_id)).size} source recordings`;
  $('#progress').textContent=`${failed} failed extractions · ${pending} awaiting review`;
  $('#signatureCount').textContent=`${poolFor('ah').bag.length} Ah! · ${poolFor('uh_huh').bag.length} Uh-huh! · ${poolFor('swing_out').bag.length} Swing out! · ${sig} Aah Haa · ${poolFor('yeah').bag.length} Yeah! · ${poolFor('alright').bag.length} Alright!`;
  $('#otherCount').textContent=`${enc+cue} encouragement / band-solo cues`;
  $('#reviewedCount').textContent=`${kept} kept in your review`;
  $('#reviewNew').textContent=`Review ${calls.filter(c=>c.new_candidate&&!c.review.status).length} new call tests`;
  $('#ah').disabled=!poolFor('ah').bag.length;$('#uhHuh').disabled=!poolFor('uh_huh').bag.length;$('#swingOut').disabled=!poolFor('swing_out').bag.length;$('#alright').disabled=!poolFor('alright').bag.length;$('#signature').disabled=!sig;$('#yeah').disabled=!poolFor('yeah').bag.length;$('#encouragement').disabled=!enc;$('#playerCue').disabled=!cue;
}
function filtered(){
  const query=$('#search').value.trim().toLowerCase(),category=$('#category').value,state=$('#reviewState').value;
  return allCalls().filter(c=>(state==='all'||(state==='new'?c.new_candidate&& !c.review.status:state==='pending'?!c.review.status:c.review.status==='skip'))&&(category==='all'||c.category===category)&&(!$('#keptOnly').checked||c.review.status==='keep')&&(!query||`${c.label} ${c.source_title} ${c.source_album} ${c.id} ${c.phrase_asr_unverified||''} ${c.source_label||''} ${c.review.comment||''}`.toLowerCase().includes(query)));
}
function render(){
  refreshCounts();
  $('#calls').innerHTML=filtered().map(c=>`<article class="card ${active===c.id?'active':''}" data-id="${esc(c.id)}"><span class="tag ${c.review.status==='keep'?'keep':''}">${esc(labels[c.category]||'Call candidate')}${c.review.status==='keep'?' · kept':c.review.status==='skip'?' · failed extraction':''}</span><h3>${esc(c.label||labels[c.category]||'Call candidate')}</h3><p>${esc(c.source_title)}<br><span class="muted">${esc(c.source_album||'')} · ${Number(c.start_seconds).toFixed(2)}–${Number(c.end_seconds).toFixed(2)}s</span></p><div class="actions"><button data-action="play">▶ Play</button><a href="${esc(c.file)}" download>WAV</a></div><div class="review"><button data-action="keep" class="${c.review.status==='keep'?'on':''}">Keep</button><button data-action="ah" class="${c.category==='ah'&&c.review.status==='keep'?'on':''}">Keep as Ah!</button><button data-action="uh_huh" class="${c.category==='uh_huh'&&c.review.status==='keep'?'on':''}">Keep as Uh-huh!</button><button data-action="swing_out" class="${c.category==='swing_out'&&c.review.status==='keep'?'on':''}">Keep as Swing out!</button><button data-action="signature">Keep as Aah Haa</button><button data-action="alright" class="${c.category==='alright'&&c.review.status==='keep'?'on':''}">Keep as Alright!</button><button data-action="solo" class="${c.category==='named_player_cue'&&c.review.status==='keep'?'on':''}">Keep as Band / solo</button><button data-action="yeah">Keep as Yeah!</button><button data-action="skip" class="${c.review.status==='skip'?'on':''}">Fail / Skip</button><button data-action="reset">Reset choice</button></div>${BobReviewNotes.field(c.review)}<details style="margin-top:10px"><summary>Source details</summary><p>${esc(c.classification_status||'automatic candidate')}<br>${esc(c.speaker_confidence||'Speaker unverified')}</p><p>${esc(c.phrase_asr_unverified||'')}</p><p>Original label: ${esc(c.source_label||'')}</p><small>${esc(c.id)}</small></details></article>`).join('')||'<div class="empty">No clips match these filters.</div>';
}
async function playClip(c){
  const token=++epoch;active=c.id;audio.pause();audio.src=c.file;audio.currentTime=0;
  $('#nowTitle').textContent=c.label||labels[c.category]||'Call candidate';
  $('#nowSource').textContent=`${c.source_title} · ${Number(c.start_seconds).toFixed(2)}–${Number(c.end_seconds).toFixed(2)}s`;
  $('#status').textContent='Loading…';render();
  try{await audio.play();if(token!==epoch)return;$('#status').textContent='Playing separated vocal clip.';}
  catch(e){if(token===epoch)$('#status').textContent='Playback unavailable: '+e.message;}
}
function stop(){epoch++;window.dispatchEvent(new Event('bob-stop-all'));document.querySelectorAll('audio').forEach(a=>a.pause());$('#status').textContent='Stopped.';}
function random(category){const clip=poolFor(category).next();if(clip)playClip(clip);else $('#status').textContent='No clips in this call family yet.';return clip;}
$('#ah').onclick=()=>random('ah');$('#uhHuh').onclick=()=>random('uh_huh');$('#swingOut').onclick=()=>random('swing_out');$('#alright').onclick=()=>random('alright');$('#yeah').onclick=()=>random('yeah');$('#signature').onclick=()=>random('signature_aah_haa');$('#encouragement').onclick=()=>random('encouragement');$('#playerCue').onclick=()=>random('named_player_cue');$('#stop').onclick=stop;
$('#volume').oninput=()=>{document.querySelectorAll('audio').forEach(a=>a.volume=Number($('#volume').value))};
audio.addEventListener('ended',()=>{$('#status').textContent='Ready for the next call.'});
$('#calls').addEventListener('click',e=>{
  const b=e.target.closest('button[data-action]');if(!b)return;
  const id=b.closest('[data-id]').dataset.id,c=library.calls.find(c=>c.id===id),action=b.dataset.action;
  if(action==='play'){playClip(effective(c));return;}
  if(action==='reset')BobReviewPolicy.resetChoice(id,library.review_defaults,reviews);
  else reviews[id]={...effective(c).review,status:action==='skip'?'skip':'keep',...(action==='ah'?{category:'ah',label:'Ah!'}:action==='uh_huh'?{category:'uh_huh',label:'Uh-huh!'}:action==='swing_out'?{category:'swing_out',label:'Swing out!'}:action==='alright'?{category:'alright',label:'Alright!'}:action==='solo'?{category:'named_player_cue',label:''}:action==='signature'?{category:'signature_aah_haa',label:'Ah-ha!'}:action==='yeah'?{category:'yeah',label:'Yeah!'}:{}),reviewed_at:new Date().toISOString(),reviewer:'user selection in local listening interface'};
  saveLocal();render();
});
BobReviewNotes.bind($('#calls'),'data-id',id=>effective(library.calls.find(c=>c.id===id)).review,(id,r)=>{reviews[id]=r;saveLocal()});
for(const id of ['search','category','keptOnly'])$('#'+id).addEventListener(id==='search'?'input':'change',render);
$('#saveReview').onclick=()=>{
  const data={repair_reviews:[],phrase_reviews:window.BobPhraseDesk?.exportReviews()||[],feature_reviews:featureClips.filter(c=>BobReviewPolicy.hasReview(featureDecision(c))).map(c=>({id:c.id,...featureDecision(c)})),schema:'bb-bob-local-review/v1',exported_at:new Date().toISOString(),reviews:allCalls().filter(c=>BobReviewPolicy.hasReview(c.review)).map(c=>({id:c.id,...c.review,occurrence_id:c.occurrence_id}))};
  const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Bob-call-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
const featureStorageKey='bb-bob-feature-review-v1';
let featureReviews={};try{featureReviews=JSON.parse(localStorage.getItem(featureStorageKey)||'{}')}catch{}
const steel=(Array.isArray(library.steel)?library.steel:library.steel?.clips||library.steel?.tests||[]).map(s=>({...s,kind:'steel'}));
const featureClips=[...steel,...(library.features||[])];
function featureDecision(s){return BobReviewPolicy.decision(s.id,library.feature_review_defaults,featureReviews)}
function renderFeatures(){
 const kind=$('#featureKind').value;
 $('#steel').innerHTML=featureClips.filter(s=>kind==='all'||s.kind===kind).map(s=>`<article class="card" data-feature-id="${esc(s.id)}"><span class="tag ${featureDecision(s).status==='keep'?'keep':''}">${esc(s.kind)} estimate · ${featureDecision(s).status==='keep'?'kept':featureDecision(s).status==='skip'?'failed extraction':'awaiting review'}</span><h3>${esc(s.label||s.title||s.id)}</h3><p>${esc(s.performer||s.performer_hypothesis||'Player unconfirmed')}<br>${esc(s.source_title||'')} · ${Number(s.start_seconds).toFixed(2)}–${Number(s.end_seconds).toFixed(2)}s</p><audio controls preload="none" src="${esc(s.file)}"></audio><a href="${esc(s.file)}" download>Download test WAV</a><div class="review"><button data-feature-action="keep">Keep</button><button data-feature-action="skip">Fail / Skip</button><button data-feature-action="reset">Reset choice</button></div>${BobReviewNotes.field(featureDecision(s))}<details><summary>Separation details</summary><p>${esc(s.isolation_status||'Instrument feature estimate; leakage may remain.')}</p><p>${esc(s.boundary_status||s.source_window_reason||'Selected feature window; full solo boundary unverified.')}</p></details></article>`).join('')||'<p>No matching feature tests yet.</p>';
 document.querySelectorAll('audio').forEach(a=>a.volume=Number($('#volume').value));
}
$('#featureKind').onchange=renderFeatures;
$('#steel').onclick=e=>{const b=e.target.closest('[data-feature-action]');if(!b)return;const id=b.closest('[data-feature-id]').dataset.featureId;if(b.dataset.featureAction==='reset')BobReviewPolicy.resetChoice(id,library.feature_review_defaults,featureReviews);else featureReviews[id]={...featureDecision(featureClips.find(c=>c.id===id)),status:b.dataset.featureAction,reviewed_at:new Date().toISOString(),review_scope:'sample usability; skip means failed extraction'};try{localStorage.setItem(featureStorageKey,JSON.stringify(featureReviews))}catch{}renderFeatures()};
BobReviewNotes.bind($('#steel'),'data-feature-id',id=>featureDecision(featureClips.find(c=>c.id===id)),(id,r)=>{featureReviews[id]=r;try{localStorage.setItem(featureStorageKey,JSON.stringify(featureReviews))}catch{}});
$('#reviewNew').onclick=()=>{$('#reviewState').value='new';$('#keptOnly').checked=false;$('#category').value='all';$('#search').value='';render();$('#calls').scrollIntoView({behavior:'smooth'})};
$('#reviewState').onchange=()=>{if($('#reviewState').value!=='all')$('#keptOnly').checked=false;render()};
$('#keptOnly').addEventListener('change',()=>{if($('#keptOnly').checked)$('#reviewState').value='all';render()});
const sections=library.sections||[],songs=[...new Map(sections.map(s=>[s.source_id,s])).values()];
$('#sectionSong').innerHTML=songs.map(s=>`<option value="${esc(s.source_id)}">${esc(s.source_title)} · ${esc(s.source_album)}</option>`).join('');
function sectionTable(){const sid=$('#sectionSong').value;$('#sections').innerHTML=sections.length?`<table class="section-list"><thead><tr><th>Passage</th><th>Time</th><th>Call / feature leads</th></tr></thead><tbody>${sections.filter(s=>s.source_id===sid).map(s=>`<tr><td>${esc(s.label)}</td><td>${Number(s.start_seconds).toFixed(1)}–${Number(s.end_seconds).toFixed(1)}s</td><td>${(s.cues||[]).map(c=>esc(c.text_unverified)+' <small>(automatic)</small>').join('<br>')||'—'}${featureClips.filter(f=>f.source_id===sid&&f.start_seconds<s.end_seconds&&f.end_seconds>s.start_seconds).map(f=>`<p><a href="${esc(f.file)}" download>${esc(f.kind)} test WAV</a></p>`).join('')}</td></tr>`).join('')}</tbody></table>`:'<p>Section mapping is in progress.</p>'}
$('#sectionSong').onchange=sectionTable;renderFeatures();sectionTable();
document.addEventListener('play',e=>{if(e.target.tagName==='AUDIO')document.querySelectorAll('audio').forEach(a=>{if(a!==e.target)a.pause()})},true);
window.addEventListener('pagehide',stop);render();
window.bobLibraryDesk={poolFor,filtered,allCalls,playClip,stop,get active(){return active},get reviews(){return reviews},featureClips,sections};
