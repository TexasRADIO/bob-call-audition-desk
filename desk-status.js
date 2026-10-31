(function(){
'use strict';
const $=s=>document.querySelector(s);
function totals(rows){return rows.reduce((a,r)=>{const status=['keep','skip','adjust'].includes(r?.status)?r.status:'pending';a[status]=(a[status]||0)+1;return a},{keep:0,skip:0,pending:0,adjust:0})}
function refresh(){
 const desk=window.bobLibraryDesk;if(!desk)return;
 const calls=totals(desk.allCalls().map(c=>c.review)),features=desk.featureClips||[],f=totals(features.map(c=>featureDecision(c)));
 const clips=window.BobPhraseDesk?.clips||[],reviewed=new Map((window.BobPhraseDesk?.exportReviews()||[]).map(r=>[r.id,r])),p=totals(clips.map(c=>reviewed.get(c.id)));
 const empty=[['uh_huh','UH-HUH!'],['swing_out','SWING OUT!']].filter(([id])=>!desk.poolFor(id).bag.length).map(([,label])=>label);
 $('#reviewProgress').innerHTML=`<ul><li><strong>Calls:</strong> ${calls.keep} kept · ${calls.skip} rejected · ${calls.pending} awaiting a decision.</li><li><strong>Steel &amp; fiddle:</strong> ${features.length} tests (${features.filter(c=>c.kind==='steel').length} steel, ${features.filter(c=>c.kind==='fiddle').length} fiddle) · ${f.keep} kept · ${f.skip} rejected · ${f.pending+f.adjust} outstanding.</li><li><strong>Backing phrases:</strong> ${clips.length} tests · ${p.keep} kept · ${p.skip} rejected · ${p.pending} awaiting review${p.adjust?' · '+p.adjust+' need trimming':''}.</li></ul><p class="reviewnote muted">${!calls.pending&&!calls.adjust&&!f.pending&&!f.adjust&&!p.pending&&!p.adjust?'All sample usability reviews are recorded. ':''}Vocal repair comparisons are withdrawn.${empty.length?' '+empty.join(' and ')+' have no assigned kept clips yet; use the matching Keep-as choices.':''}</p>`;
}
document.addEventListener('click',e=>{if(e.target.closest('[data-action],[data-feature-action],[data-phrase-action]'))refresh()});
window.addEventListener('storage',refresh);window.BobDeskProgress={refresh};refresh();
})();
