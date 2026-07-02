# NewtonAI Infrastructure Cost Audit — Plan

## Deliverable
A single markdown file: `docs/finops-audit.md`. No UI, no runtime code changes.

## Methodology
- **Basis:** code-derived estimates (as requested). Numbers modeled from feature implementations in `supabase/functions/*`, `src/hooks/*`, storage buckets, and current Pro-plan limits pulled from `src/hooks/useFeatureUsage.ts`.
- **Pro usage profile:** the ceiling of `PRO_LIMITS` (worst-realistic monthly cap), plus unlimited-tier features (homework help, AI chat, educational videos) modeled at heavy but bounded daily rates.
- **Pricing sources cited inline:** Google Gemini (Vertex/OpenRouter) public rates, ElevenLabs Turbo v2.5, OpenAI Whisper/TTS-1, YouTube Data API (free quota), Supabase Pro (DB, storage, egress, edge invocations), Lovable hosting.
- Every line item labeled as **estimate** with the formula shown so numbers stay auditable.

## Pro user monthly volume baseline (from PRO_LIMITS + code)
- Flashcards, Quiz, Mind Map: 90/mo each
- Summary, Lecture Notes: 20/mo each
- AI Podcast: 15/mo
- Lecture transcription: 900 min/mo
- Homework Help, AI Chat, Educational Videos: unlimited → modeled at 300, 500, 200 /mo
- PDF Chat (RAG), OCR, Voice Chat, Live Classroom: derived from typical Pro heavy usage
- Storage growth: modeled from PDF/PPT/audio/report artifacts kept per user

## Report structure (matches your 13 steps)
1. **Platform inventory** — every feature → backend services it calls (edge fn, Gemini model, ElevenLabs, storage bucket, DB tables).
2. **Per-edge-function AI cost model** — input/output tokens, avg context, embedding calls, per-invocation $ using Gemini 3 Flash + Flash-Image + `text-embedding-3-small` pricing.
3. **External APIs** — Lovable AI Gateway (Gemini Flash/Pro/Image), OpenAI (Whisper, TTS-1), ElevenLabs Turbo v2.5, YouTube Data API, Razorpay.
4. **Database** — reads/writes/realtime channel-hours from hooks (`useLiveNotes`, `useSpotlightSync`, `useConceptCheck`, etc.), pgvector storage.
5. **Storage** — buckets (`materials`, `pitch-videos`, `avatars`, generated podcasts/reports), MB/user/mo + egress.
6. **Edge Functions** — invocation counts, avg duration, monthly execution cost on Supabase Pro.
7. **Classroom usage** — Pro-cap simulation (numbers above) rolled into a single monthly bill.
8. **Cost breakdown per Pro user** — table with $ for Gemini, ElevenLabs, OpenAI, Supabase DB, Storage, Egress, Edge Fn, Hosting, YouTube, Others, **Total in $ and ₹**.
9. **Gross margin** — at ₹499 (India) and $10 (Global), showing revenue − cost, GM%, net contribution.
10. **Worst case** — every Pro feature at max cap + heavy unlimited usage → ceiling $/user.
11. **Waste audit** — repeated OCR/embeddings, duplicate prompts, oversized context (points to exact files: `chat-with-content`, `rag-chat-pdf`, `generate-podcast-script`, `voice-chat-tts`, etc.).
12. **Optimizations to hit 40–60% reduction** — response caching (24h `mem://performance/ai-response-caching` already exists — extend), embedding dedup via `document_chunks` hash, prompt compression, Flash-Lite routing for classification tasks, chunk-size tuning, streaming TTS reuse, CDN cache-control on materials bucket, DB indexes on hot queries, realtime channel consolidation.
13. **Final financial dashboard (tables)**:
    - Cost per API, per feature, per student/mo, per teacher/mo, per classroom, per institution, per live session
    - Cost per AI chat / PDF / quiz / podcast / report / OCR
    - Recommended price, minimum profitable price, break-even users
    - GM at 1K / 10K / 100K users (with infra step-costs: Supabase compute upgrades, egress tiers)

## Out of scope
No code, config, or DB changes. No dashboard UI. If you later want an in-app FinOps dashboard, we can plan that separately.
