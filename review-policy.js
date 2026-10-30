(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BobReviewPolicy=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function decision(id,baseline,local){const a=baseline?.[id]||{},b=local?.[id]||{};return (Date.parse(b.reviewed_at)||0)>(Date.parse(a.reviewed_at)||0)?{...a,...b}:a}
function effective(c,library,local){const r=decision(c.id,library.review_defaults,local),category=r.category||c.category;return {...c,category:category==='uncertain_vocal'&&r.status==='keep'?'other_call':category,available:library.reviewed_library?r.status==='keep':r.status!=='skip',review:r}}
return {decision,effective};
});
