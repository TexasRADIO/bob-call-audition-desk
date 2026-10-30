'use strict';
const library=window.BOB_LIBRARY||{calls:[],steel:[]};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={signature_aah_haa:'Aah Haa',encouragement:'Encouragement',named_player_cue:'Player cue',uncertain_vocal:'Call candidate'};
const storageKey='bb-bob-call-review-v3';
let reviews={};try{reviews=JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{}
let active=null,epoch=0;
const audio=$('#audio');audio.volume=.7;
const pools=new Map(Object.keys(labels).map((category,i)=>[category,new BobCallPool((Date.now()+i*8191)>>>0)]));

function saveLocal(){try{localStorage.setItem(storageKey,JSON.stringify(reviews))}catch{}}
function effective(c){const r=reviews[c.id]||{};return {...c,category:r.category||c.category,available:r.status!=='skip',review:r};}
function allCalls(){return library.calls.map(effective);}
function poolFor(category){const p=pools.get(category);p.configure(allCalls(),category);return p;}
function refreshCounts(){
  const calls=allCalls(),occurrences=new Set(calls.map(c=>c.occurrence_id));
  const sig=poolFor('signature_aah_haa').bag.length,enc=poolFor('encouragement').bag.length,cue=poolFor('named_player_cue').bag.length;
  $('#libraryCount').textContent=`${occurrences.size} distinct candidate occurrences · ${new Set(calls.map(c=>c.source_id)).size} source recordings`;
  $('#progress').textContent='Library target: 100–200 distinct Bob calls';
  $('#signatureCount').textContent=`${sig} signature-call ${sig===1?'match':'matches'}`;
  $('#otherCount').textContent=`${calls.filter(c=>c.category!=='signature_aah_haa').length} other candidates`;
  $('#reviewedCount').textContent=`${calls.filter(c=>c.review.status==='keep').length} kept in your review`;
  $('#signature').disabled=!sig;$('#encouragement').disabled=!enc;$('#playerCue').disabled=!cue;
}
function filtered(){
  const query=$('#search').value.trim().toLowerCase(),category=$('#category').value;
  return allCalls().filter(c=>(category==='all'||c.category===category)&&(!$('#keptOnly').checked||c.review.status==='keep')&&(!query||`${c.label} ${c.source_title} ${c.source_album} ${c.id} ${c.phrase_asr_unverified||''}`.toLowerCase().includes(query)));
}
function render(){
  refreshCounts();
  $('#calls').innerHTML=filtered().map(c=>`<article class="card ${active===c.id?'active':''}" data-id="${esc(c.id)}"><span class="tag ${c.review.status==='keep'?'keep':''}">${esc(labels[c.category]||'Call candidate')}${c.review.status==='keep'?' · kept':c.review.status==='skip'?' · skipped':''}</span><h3>${esc(c.label||labels[c.category]||'Call candidate')}</h3><p>${esc(c.source_title)}<br><span class="muted">${esc(c.source_album||'')} · ${Number(c.start_seconds).toFixed(2)}–${Number(c.end_seconds).toFixed(2)}s</span></p><div class="actions"><button data-action="play">▶ Play</button><a href="${esc(c.file)}" download>WAV</a></div><div class="review"><button data-action="keep" class="${c.review.status==='keep'?'on':''}">Keep</button><button data-action="signature">Keep as Aah Haa</button><button data-action="skip" class="${c.review.status==='skip'?'on':''}">Skip</button><button data-action="reset">Reset</button></div><details style="margin-top:10px"><summary>Source details</summary><p>${esc(c.classification_status||'automatic candidate')}<br>${esc(c.speaker_confidence||'Speaker unverified')}</p><p>${esc(c.phrase_asr_unverified||'')}</p><small>${esc(c.id)}</small></details></article>`).join('')||'<div class="empty">No clips match these filters.</div>';
}
async function playClip(c){
  const token=++epoch;active=c.id;audio.pause();audio.src=c.file;audio.currentTime=0;
  $('#nowTitle').textContent=c.label||labels[c.category]||'Call candidate';
  $('#nowSource').textContent=`${c.source_title} · ${Number(c.start_seconds).toFixed(2)}–${Number(c.end_seconds).toFixed(2)}s`;
  $('#status').textContent='Loading…';render();
  try{await audio.play();if(token!==epoch)return;$('#status').textContent='Playing separated vocal clip.';}
  catch(e){if(token===epoch)$('#status').textContent='Playback unavailable: '+e.message;}
}
function stop(){epoch++;document.querySelectorAll('audio').forEach(a=>a.pause());$('#status').textContent='Stopped.';}
function random(category){const clip=poolFor(category).next();if(clip)playClip(clip);else $('#status').textContent='No clips in this call family yet.';return clip;}
$('#signature').onclick=()=>random('signature_aah_haa');$('#encouragement').onclick=()=>random('encouragement');$('#playerCue').onclick=()=>random('named_player_cue');$('#stop').onclick=stop;
$('#volume').oninput=()=>{audio.volume=Number($('#volume').value)};
audio.addEventListener('ended',()=>{$('#status').textContent='Ready for the next call.'});
$('#calls').addEventListener('click',e=>{
  const b=e.target.closest('button[data-action]');if(!b)return;
  const id=b.closest('[data-id]').dataset.id,c=library.calls.find(c=>c.id===id),action=b.dataset.action;
  if(action==='play'){playClip(effective(c));return;}
  if(action==='reset')delete reviews[id];
  else reviews[id]={...reviews[id],status:action==='skip'?'skip':'keep',...(action==='signature'?{category:'signature_aah_haa'}:{}),reviewed_at:new Date().toISOString(),reviewer:'user selection in local listening interface'};
  saveLocal();render();
});
for(const id of ['search','category','keptOnly'])$('#'+id).addEventListener(id==='search'?'input':'change',render);
$('#saveReview').onclick=()=>{
  const data={schema:'bb-bob-local-review/v1',exported_at:new Date().toISOString(),reviews:Object.entries(reviews).map(([id,review])=>({id,...review,occurrence_id:library.calls.find(c=>c.id===id)?.occurrence_id}))};
  const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Bob-call-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
const steel=Array.isArray(library.steel)?library.steel:library.steel?.clips||library.steel?.tests||[];
$('#steel').innerHTML=steel.map(s=>`<article class="card"><span class="tag">Steel estimate</span><h3>${esc(s.label||s.title||s.id)}</h3><p>${esc(s.performer||s.player||'Player attribution in manifest')}<br>${esc(s.source_title||'')}</p><audio controls preload="none" src="${esc(s.file)}"></audio><a href="${esc(s.file)}" download>Download test WAV</a></article>`).join('')||'<p class="muted">Steel test extracts are being prepared.</p>';
window.addEventListener('pagehide',stop);render();
window.bobLibraryDesk={poolFor,filtered,allCalls,playClip,stop,get active(){return active},get reviews(){return reviews}};
