(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BobReviewPolicy=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function decision(id,baseline,local){const a=baseline?.[id]||{},b=local?.[id]||{};return (Date.parse(b.reviewed_at)||0)>(Date.parse(a.reviewed_at)||0)?{...a,...b}:{...b,...a}}
function hasReview(r){return !!(r?.status||r?.category||Object.prototype.hasOwnProperty.call(r||{},'comment'))}
function resetChoice(id,baseline,local){const current=decision(id,baseline,local);delete local[id];if(Object.prototype.hasOwnProperty.call(current,'comment'))local[id]={...decision(id,baseline,{}),comment:current.comment,reviewed_at:new Date().toISOString()}}
function effective(c,library,local){const r=decision(c.id,library.review_defaults,local),category=r.category||c.category;return {...c,source_label:c.label,label:r.label||c.label,category:category==='uncertain_vocal'&&r.status==='keep'?'other_call':category,available:library.reviewed_library?r.status==='keep':r.status!=='skip',review:r}}
return {decision,effective,hasReview,resetChoice};
});
