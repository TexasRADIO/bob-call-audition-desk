(function(root){
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function field(review){return `<label class="comment-field">Your comment<textarea data-review-comment rows="2" maxlength="2000" placeholder="What does Bob say? Trim, sound or timing notes…">${esc(review?.comment||'')}</textarea><small data-note-saved aria-live="polite">Comments save as you type and travel with your review download.</small></label>`}
function bind(container,attribute,read,write){container.addEventListener('input',event=>{if(!event.target.matches('[data-review-comment]'))return;const card=event.target.closest('['+attribute+']');if(!card)return;const id=card.getAttribute(attribute),review={...read(id),comment:event.target.value.slice(0,2000),reviewed_at:new Date().toISOString()};write(id,review);card.querySelector('[data-note-saved]').textContent='Comment saved in this browser.'})}
root.BobReviewNotes={field,bind};
})(globalThis);
