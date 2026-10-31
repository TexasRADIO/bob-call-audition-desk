(function(){
'use strict';
const clips=window.BOB_LIBRARY?.phrases||[],$=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key='bb-bob-phrase-review-v1';let reviews={};try{reviews=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
let context,gain,source,looping=null,epoch=0;const buffers=new Map();
function review(c){return BobReviewPolicy.decision(c.id,window.BOB_LIBRARY?.phrase_review_defaults,reviews)}
function stopLoop(){epoch++;if(source){try{source.stop()}catch{}source.disconnect();source=null}looping=null;document.querySelectorAll('[data-phrase-id] [data-phrase-action=loop]').forEach(b=>b.setAttribute('aria-pressed','false'))}
async function loop(c){
 window.bobLibraryDesk.stop();const token=++epoch;$('#status').textContent='Loading '+c.source_title+'…';
 try{
  if(!context){context=new AudioContext();gain=context.createGain();gain.connect(context.destination)}
  await context.resume();gain.gain.value=Number($('#volume').value);
  const file=c.loop_asset?.file||c.file;let buffer=buffers.get(file);if(!buffer){const r=await fetch(file);if(!r.ok)throw Error('Audio download failed');buffer=await context.decodeAudioData(await r.arrayBuffer());buffers.set(file,buffer);if(buffers.size>6)buffers.delete(buffers.keys().next().value)}
  if(token!==epoch)return;
  const a=c.loop_asset?0:c.loop_start_frame/c.loop_sample_rate,b=c.loop_asset?c.loop_asset.frames/c.loop_asset.sample_rate:c.loop_end_frame/c.loop_sample_rate;
  if(!(a>=0&&b>a&&b<=buffer.duration+1/context.sampleRate))throw Error('Loop boundaries are outside the recording');
  source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.loopStart=a;source.loopEnd=b;source.connect(gain);source.start(0,a);looping={id:c.id,start:a,end:b,contextSampleRate:context.sampleRate};
  $('#status').textContent='Looping '+c.source_title+' · '+c.bars+'-bar candidate.';
  document.querySelector(`[data-phrase-id="${c.id}"] [data-phrase-action=loop]`)?.setAttribute('aria-pressed','true');
 }catch(e){if(token===epoch)$('#status').textContent='Loop unavailable: '+e.message}
}
function render(){
 const filter=$('#phraseKind').value;
 $('#phrases').innerHTML=clips.filter(c=>filter==='all'||(filter==='piano'?c.model_target.includes('piano'):!c.model_target.includes('piano'))).map(c=>{const r=review(c),state=r.status==='keep'?'kept full phrase':r.status==='skip'?'failed extraction':r.status==='adjust'?'boundaries need work':'awaiting phrase review';return `<article class="card" data-phrase-id="${esc(c.id)}"><span class="tag ${r.status==='keep'?'keep':''}">Backing · ${state}</span><h3>${esc(c.label||c.source_title)}</h3><p>${c.bars}-bar candidate · ${esc(c.written_meter?c.written_meter+' in score':c.meter_numerator_hypothesis+'/4 estimate')} · ${Number(c.pulse_bpm).toFixed(1)} BPM<br>${esc(c.model_target.includes('piano')?'Piano, bass & drums':'Bass & drums')} · ${Number(c.start_seconds).toFixed(2)}–${Number(c.end_seconds).toFixed(2)}s</p><audio controls preload="none" src="${esc(c.file)}"></audio><div class="actions"><button data-phrase-action="loop" aria-pressed="${looping?.id===c.id?'true':'false'}">Loop bars</button><button data-phrase-action="stop">Stop</button><a href="${esc(c.file)}" download>WAV preview</a>${c.loop_asset?`<a href="${esc(c.loop_asset.file)}" download>Loop WAV</a>`:''}</div><div class="review"><button data-phrase-action="keep">Keep full phrase</button><button data-phrase-action="adjust">Needs trim</button><button data-phrase-action="skip">Fail / Skip</button><button data-phrase-action="reset">Reset</button></div><details><summary>Phrase boundaries</summary><p>${esc(c.phrase_anchor||'Musical entrance')} · ${esc(c.boundary_status)}<br>Pickup ${Number(c.pickup_seconds||0).toFixed(2)}s · release ${Number(c.release_seconds||0).toFixed(2)}s</p><p>${esc(c.isolation_status)}</p></details></article>`}).join('')||'<p>Complete phrase candidates are being prepared.</p>';
 document.querySelectorAll('#phrases audio').forEach(a=>a.volume=Number($('#volume').value));
 $('#phraseCount').textContent=`${clips.length} backing previews · ${new Set(clips.map(c=>c.source_id)).size} recordings`;
}
$('#phrases').onclick=e=>{const b=e.target.closest('[data-phrase-action]');if(!b)return;const c=clips.find(c=>c.id===b.closest('[data-phrase-id]').dataset.phraseId),action=b.dataset.phraseAction;
 if(action==='loop'){loop(c);return}if(action==='stop'){window.bobLibraryDesk.stop();return}
 if(action==='reset')delete reviews[c.id];else reviews[c.id]={status:action,reviewed_at:new Date().toISOString(),review_scope:'backing sample usability and whole musical phrase',phrase_complete_verified:action==='keep'};
 try{localStorage.setItem(key,JSON.stringify(reviews))}catch{}render();
};
$('#phraseKind').onchange=render;
$('#volume').addEventListener('input',()=>{if(gain)gain.gain.setValueAtTime(Number($('#volume').value),context.currentTime)});
document.addEventListener('play',e=>{if(e.target.tagName==='AUDIO')stopLoop()},true);
window.addEventListener('bob-stop-all',stopLoop);window.addEventListener('pagehide',()=>{stopLoop();context?.close();context=null;gain=null});
window.BobPhraseDesk={clips,loop,stop:stopLoop,exportReviews:()=>clips.filter(c=>review(c).status).map(c=>({id:c.id,...review(c),source_id:c.source_id})),get looping(){return looping},get reviews(){return reviews}};
render();
})();
