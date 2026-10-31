# Swing out follow-up - 31 October 2026

Added SWING OUT!, its call-family filter and Keep as Swing out! using category `swing_out`, at the user's request. No automatic reclassification; existing reviews, comments, storage and source audio remain unchanged. Branch `loudoun-hq/call-audition-20261030`, parent `f21eaebb4a3bc4d50bf35c48aa498e41e675e82c`. Checks, resulting commit and bundle are recorded in the adjacent external handover. Next: keep suitable calls in this category to enable the pad. Firmware import remains separate.

# Uh-huh follow-up - 31 October 2026

Branch `loudoun-hq/call-audition-20261030`, parent `7ed0d334c2bdf51a49be2378e03754ec86278aa8`. User requested a separate Uh-huh button. Added pad, filter, Keep-as choice, count and export category `uh_huh`. No source audio or baseline decisions changed. Existing review storage keys/schema are unchanged. Checks and resulting commit are recorded in the adjacent external handover. Next: reviewer can classify Uh-huh calls; the pad remains disabled until a kept selection exists. Firmware import remains separate.

# Listening desk handover - 31 October 2026

Local checkout outside iCloud, branch `loudoun-hq/call-audition-20261030`, parent `edb805249fb747074486be5b968931523b8d442c`. This repository owns the existing GitHub Pages listening desk; BB-BOB firmware development stays in its separate worktree.

The user requested Ah!, Alright!, a Band/solo call pad and comments while sorting. Uploaded review SHA-256 `af41bd3fdb930f44e3b6978eb29d21877d1a623c9fe56b6e43f37582eabec990` contains226decisions:181keep/45skip; all IDs and occurrence identities match. All181kept WAV hashes verified; no audio is changed.96calls remain pending. Roly Poly/CD07at84.30-85.52s (`call-d90473ad64cbb135`) is explicitly labelled Ah! from user feedback; no usability Keep was inferred.

Ah!/Alright! pads and Keep-as choices are added. Band/solo broadens the existing player-cue presentation while preserving its `named_player_cue` category key. Pending/failed calls remain out of pad pools. The earlier103-call ZIP is labelled historical rather than implied to contain all181current keeps.

Comments on calls, feature tests, backing phrases and repair comparisons save locally as typed, survive decision/relabel/reset-choice changes, and export even before a Keep/Fail choice. Existing browser storage keys and additive v1export schema are preserved. New baseline label-only corrections retain non-conflicting local-only status/comment fields; newest conflicting values win. Comments are escaped and are data, never executable instructions. No comments are sent to a server as typed. Uploaded historical decisions are in the catalogue baseline; new in-browser decisions take precedence by timestamp.

Checks: allJavaScript syntax passes;7meaningful Node tests pass (merge precedence, label-only status retention, pending-comment export without approval, reset/comment preservation,181/45baseline, escaping and distinct kept pools). Actual independent Chrome verifies Ah/Alright/Band-solo classification/pool changes, comment preservation through Keep/Fail/reset/refresh and actual Save-review Blob contents for all four review types. All181keeps/45failures remain after reset; comment-only rows do not become approved.390pxiframe has390pxscroll width and all270visible textareas fit. No audio played during this QA. User's active live desk/storage was not operated by these tests.

The private working receipt retains the original uploaded JSON, pre-edit source ZIP/hashes, import audit and browser proof. Source-only changes are committed and published to the existing default branch without force. Exact commit/deployment/unique bundle are recorded in the adjacent external handover after publication.

Next: Joe can keep sorting and export review notes. Any firmware import of the enlarged reviewed call library is a separate measured storage/verification step; this desk update does not claim the firmware now contains181calls. Audio/separation/corpus batches remain paused. Resume the27/50Classics goal and Cherokee source validation independently.
