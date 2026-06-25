## Known Issues from Prior Testing

Based on the deep-test session and earlier conversations, here's the consolidated list of confirmed and suspected problems.

### Confirmed bugs
1. **Pricing inconsistency** — UI advertises ₹250/week (Pro), but `razorpay-create-order` only supports monthly/yearly cycles. Weekly checkout silently falls back, misleading users.
2. **Live Quiz broadcast not end-to-end verified** — Teacher publishes quiz → students should see it instantly. Polling-based `useConceptCheck` / `useLivePulse` may add up to 5s lag; the path from `assignment.is_published=true` → student `StudentClassView` quiz card has never been validated with a real student account.
3. **Live session document view** — PDF uploads now persist via `document_url`, but no test confirms `SmartBoardPanel` actually renders it for the student side (only teacher view tested).
4. **Realtime classroom sync** — Transport confirmed working, but feature-level sync (annotations, live notes, spotlight) not validated under two-user load.
5. **Voice chat full-duplex** — TTS endpoint returns valid MP3, but the mic→STT→LLM→TTS round-trip latency target (700ms) is unverified, and `playLock` serialization under interruption is untested.

### Suspected / not-yet-tested
6. **Razorpay weekly billing path** — either remove the ₹250/week UI or add a weekly plan to the edge function.
7. **Concept Check / Live Pulse** — after removing Realtime, polling cadence may feel slow to teachers; needs perceived-latency check.
8. **Live session "End" → Intelligence Report** — `trigger-all-student-reports` is fire-and-forget; failures are swallowed (only `console.error`).
9. **PDF upload @ 50 MB** — limit raised in UI but `extract-pdf-text` edge function memory/timeout limits at full 50 MB are unverified.
10. **Apple Sign-In** — button added but the provider configuration in Lovable Cloud auth has not been smoke-tested end-to-end.

## Fix Plan (sequential, one at a time)

### Phase 1 — Pricing correctness (highest user-impact)
- **Step 1**: Decide direction with user — either (a) remove ₹250/week teaser from Pricing UI, or (b) add a weekly plan_id to `razorpay-create-order`, `razorpay-verify-payment`, and `razorpay-webhook` with proper subscription cycle. Implement chosen option, then verify checkout opens with correct amount.

### Phase 2 — Live classroom flow (core teacher product)
- **Step 2**: Validate live quiz broadcast end-to-end with a throwaway student account. Measure publish → student-card-render latency. If >3s, add a lightweight Realtime ping channel (broadcast-only, no PII) to nudge students to refetch via the existing secure RPC.
- **Step 3**: Verify `SmartBoardPanel` PDF rendering on the student `StudentClassView` side. Fix any signed-URL expiry / view-switcher missing for students.
- **Step 4**: Harden `trigger-all-student-reports` invocation — surface failures via toast and a retry button on the teacher report page.

### Phase 3 — Realtime & voice polish
- **Step 5**: Two-tab regression test for annotations, live notes, spotlight sync. Fix any channel leaks or stale state.
- **Step 6**: Voice chat round-trip — instrument latency, confirm `playLock` cancels cleanly on user interruption, add a fallback when `voice-chat-tts` exceeds 3s.

### Phase 4 — Edge cases & auth
- **Step 7**: PDF upload stress test at 45–50 MB. If `extract-pdf-text` times out, chunk the upload server-side or raise the function timeout.
- **Step 8**: Apple Sign-In end-to-end smoke test. Verify redirect, session creation, profile row insert.

### Phase 5 — Cleanup
- **Step 9**: Re-run the security scan and SEO scan after all fixes land; mark stale findings resolved.

## Suggested first step
Start with **Step 1 (pricing)** — it's the most user-visible and lowest-risk. Want me to proceed by **removing the ₹250/week teaser** (fastest) or **adding a real weekly billing cycle** (more work, more revenue flexibility)?
