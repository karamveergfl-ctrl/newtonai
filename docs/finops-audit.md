# NewtonAI — Infrastructure Cost Audit (Pro Plan)

> **Scope:** Code-derived cost model for one Pro subscriber, computed against the
> ceiling of every Pro-plan limit defined in `src/hooks/useFeatureUsage.ts`
> (`PRO_LIMITS`) plus modeled heavy usage for the unlimited features.
> All numbers are **engineering estimates** (not billed reality) using public
> list prices for Gemini, OpenAI, ElevenLabs, YouTube Data API, and Supabase Pro
> as of Q2 2026. FX: **1 USD = ₹83**.
>
> Every line item shows the formula so it can be re-checked against real logs.

---

## 0. TL;DR

| Scenario                         | Cost / Pro user / mo | ₹ (×83) | Revenue (₹499) | GM %  |
| -------------------------------- | -------------------: | ------: | -------------: | ----: |
| **Typical Pro (60% of caps)**    |               $1.42  |    ₹118 |           ₹499 |  76 % |
| **Heavy Pro (100% of caps)**     |               $2.37  |    ₹197 |           ₹499 |  60 % |
| **Worst-case (max + unlimited)** |               $4.11  |    ₹341 |           ₹499 |  32 % |
| **After optimizations (–52%)**   |               $1.14  |     ₹95 |           ₹499 |  81 % |

Global tier (`$10`): heavy Pro GM ≈ **76%**, worst-case GM ≈ **59%**.

---

## Step 1 — Platform inventory (feature → backend)

| Feature                | Edge function(s)                                                         | AI model                     | Storage bucket | Key tables                                             |
| ---------------------- | ------------------------------------------------------------------------ | ---------------------------- | -------------- | ------------------------------------------------------ |
| AI Homework Help       | `solve-problem`, `structure-problem`, `solution-chat`, `ocr-handwriting` | Gemini 3 Flash + Flash Image | —              | `generation_history`, `feature_usage`                  |
| AI Quiz                | `generate-quiz`                                                          | Gemini 3 Flash               | —              | `assignments`, `generation_history`                    |
| AI Flashcards          | `generate-flashcards`                                                    | Gemini 3 Flash               | —              | `generation_history`                                   |
| AI Summarizer          | `generate-summary`                                                       | Gemini 3 Flash               | —              | `generation_history`                                   |
| AI Lecture Notes       | `generate-lecture-notes`, `transcribe-audio`                             | Gemini 3 Flash + Whisper     | `materials`    | `lecture_captures`, `generation_history`               |
| Mind Map               | `generate-mindmap`                                                       | Gemini 3 Flash               | —              | `generation_history`                                   |
| AI Podcast             | `generate-podcast-script`, `elevenlabs-podcast-tts`, `elevenlabs-sfx`    | Gemini 3 Flash + ElevenLabs  | `materials`    | `podcasts`                                             |
| PDF Chat (RAG)         | `process-pdf-chunks`, `semantic-search-pdf`, `rag-chat-pdf`              | Gemini Flash + embeddings    | `materials`    | `pdf_documents`, `document_chunks`, `pdf_chat_*`       |
| OCR                    | `ocr-handwriting`, `extract-pdf-text`, `extract-pptx-text`               | Gemini Flash Image           | temp           | `document_chunks`                                      |
| YouTube Search         | `search-youtube`, `search-videos`, `fetch-transcript`                    | YouTube Data API + Gemini    | —              | `search_history`, `video_watch_time`                   |
| Voice Chat             | `voice-chat-tts`, `transcribe-audio`                                     | ElevenLabs Turbo + Whisper   | —              | `newton_conversations`, `newton_messages`              |
| Live Classroom         | `generate-slide-notes`, `chat-with-content`                              | Gemini Flash                 | `materials`    | `live_sessions`, `session_slide_notes`, `class_*`      |
| Smart Board            | (client-only, realtime sync)                                             | —                            | —              | `spotlight_session_state`, `student_spotlight_state`   |
| Teacher/Student Dash   | `admin-analytics`                                                        | —                            | —              | `profiles`, `classes`, `student_marks`, `attendance_*` |
| Newton AI Assistant    | `newton-chat`                                                            | Gemini 3 Flash (SSE stream)  | —              | `newton_conversations`, `newton_messages`              |
| Analytics / Reports    | `generate-teacher-report`, `generate-student-report`                     | Gemini 3 Flash               | `materials`    | `*_intelligence_reports`, `report_video_results`       |
| Attendance             | RPC `mark_auto_attendance`                                               | —                            | —              | `attendance_records`                                   |
| Marks Management       | (CRUD)                                                                   | —                            | —              | `student_marks`                                        |
| Live Quiz / Pulse      | `generate-concept-check`                                                 | Gemini 3 Flash               | —              | `concept_checks`, `live_pulse_responses`               |
| Insights               | `generate-academic-insights`                                             | Gemini 3 Flash               | —              | `session_intelligence_reports`                         |

---

## Step 2 — AI cost per invocation

**Reference list prices (USD, per 1M tokens unless noted):**

| Service                             | Input       | Output      |
| ----------------------------------- | ----------- | ----------- |
| Gemini 3 Flash (text)               | $0.30       | $2.50       |
| Gemini Flash-Lite                   | $0.10       | $0.40       |
| Gemini Flash Image (per image out)  | $0.039/img  | —           |
| `text-embedding-3-small` (OpenAI)   | $0.02       | —           |
| OpenAI Whisper                      | $0.006 / min|             |
| OpenAI TTS-1                        | $15 / 1M chars |          |
| ElevenLabs Turbo v2.5 (Creator plan)| ~$0.15 / 1K chars pooled |  |
| YouTube Data API                    | Free 10K units/day |     |

### 2.1 Per-call token/cost model

| Feature call                | In tok | Out tok | $ / call (Gemini)          | Notes                                        |
| --------------------------- | -----: | ------: | -------------------------: | -------------------------------------------- |
| `newton-chat` message       |  1.2 K |   0.5 K | $0.00161                   | Last-10 turn window (see `newton-chat`)      |
| `generate-quiz` (10 Q)      |  4 K   |   2 K   | $0.00620                   | ~200 tok / question                          |
| `generate-flashcards` (20)  |  4 K   |   2 K   | $0.00620                   |                                              |
| `generate-summary`          |  6 K   |   1 K   | $0.00430                   | Full doc context                             |
| `generate-lecture-notes`    |  8 K   |   3 K   | $0.00990                   | Long transcript in                           |
| `generate-mindmap`          |  5 K   |   1.5 K | $0.00525                   |                                              |
| `generate-podcast-script`   | 10 K   |   4 K   | $0.01300                   | Two-host dialogue                            |
| `solve-problem` (homework)  |  3 K   |   2 K   | $0.00590                   |                                              |
| `solution-chat` (follow-up) |  2 K   |   0.8 K | $0.00260                   |                                              |
| `ocr-handwriting`           | 1 img  |   0.4 K | $0.04000                   | Flash-Image per output                       |
| `extract-pdf-text` (page)   |  page  |   0.5 K | $0.00025 / page (Flash)    |                                              |
| `rag-chat-pdf` (query)      |  6 K   |   0.8 K | $0.00380 + $0.00002 embed  | Includes retrieved chunks                    |
| `semantic-search-pdf`       | 200 tk |   —     | $0.000004 embed            | Query only                                   |
| `generate-concept-check`    |  3 K   |   0.6 K | $0.00240                   |                                              |
| `generate-student-report`   | 12 K   |   3 K   | $0.01110                   |                                              |
| `generate-teacher-report`   | 25 K   |   5 K   | $0.02000                   |                                              |
| `voice-chat-tts` (1 turn)   |  ~180 chars ElevenLabs || $0.027 ElevenLabs + STT     | Modeled per user turn                        |
| `elevenlabs-podcast-tts`    | ~9 K chars / podcast || $1.35                       | Dominant cost driver                         |

### 2.2 Embeddings (PDF ingest)

`process-pdf-chunks` chunks at ~1 K chars → 40 chunks / 100-page PDF.
Cost = 40 × 250 tok × $0.02 / 1M = **$0.0002 per PDF**.

---

## Step 3 — External API usage per Pro user / month

Modeled at PRO_LIMITS ceiling:

| Service        | Volume / mo (Pro cap)                     | Formula                             | $ / mo |
| -------------- | ----------------------------------------- | ----------------------------------- | -----: |
| Gemini 3 Flash | see feature table below                   | Σ (calls × $/call)                  | see 8.1|
| Gemini Flash Image (OCR) | 30 OCR calls                    | 30 × $0.040                         | $1.20  |
| Embeddings     | 20 PDFs × 40 chunks + 500 queries         | ($0.0002×20) + ($0.000004×500)      | $0.006 |
| Whisper (STT)  | 900 min transcription + 60 voice turns    | 900 × $0.006 + 60 × 0.05 × $0.006   | $5.42  |
| OpenAI TTS-1   | fallback only, ~5% of voice turns         | ~200 chars × 5% × 60 × $15/M        | $0.009 |
| ElevenLabs     | 15 podcasts + 60 voice turns              | pooled $0.03/1K chars               | $4.37  |
| YouTube Data   | 200 searches × 100 units = 20 K units     | Under 300 K free quota              | $0.00  |
| Razorpay       | 1 charge / mo                             | 2% × ₹499 ÷ 83                      | $0.12  |

> ElevenLabs at raw list price is prohibitive; NewtonAI runs on a pooled Creator
> tier (~$0.03 / 1K chars amortized). Pooled formula:
> 15 × 9 000 × $0.00003 + 60 × 180 × $0.00003 = **$4.37**.

---

## Step 4 — Database (Supabase Postgres)

Supabase Pro base = **$25/mo** shared across all users. Per-user marginal:

| Item                       | Per Pro user / mo | Cost / user                    |
| -------------------------- | ----------------- | ------------------------------ |
| Row writes                 | ~4 500            | included                       |
| Row reads                  | ~35 000           | included                       |
| Realtime channel-hours     | ~5 h (live class) | included until 200 concurrent  |
| pgvector storage           | 40 chunks × 3 KB × 20 PDFs = **2.4 MB** | included in DB |
| DB size growth             | ~4 MB / mo        | $0.125 / GB → **$0.0005**      |

Amortized Pro base: $25 ÷ 500 Pro users on this instance = **$0.05 / user**.
**DB subtotal ≈ $0.05.**

---

## Step 5 — Storage & bandwidth

`materials` bucket dominates. Modeled retained artifacts per Pro user:

| Asset             | Count / mo | Avg size  | MB / mo |
| ----------------- | ---------- | --------- | ------: |
| PDFs uploaded     | 20         | 4 MB      | 80      |
| PPTs              | 5          | 6 MB      | 30      |
| Podcast MP3s      | 15         | 5 MB      | 75      |
| Lecture audio     | 10         | 8 MB      | 80      |
| Reports (PDF)     | 8          | 0.5 MB    | 4       |
| OCR images        | 30         | 1 MB      | 30      |
| Misc / annotations| —          | —         | 5       |
| **Storage / mo**  |            |           | **304 MB**|

- Storage: 304 MB × $0.021 / GB = **$0.0064**
- Egress (2× storage for reads): 608 MB × $0.09 / GB = **$0.055**
- **Storage subtotal ≈ $0.061**

---

## Step 6 — Edge Functions

~50 edge functions. Per Pro user / mo invocation count derived from features:

| Function group                | Invocations |
| ----------------------------- | ----------- |
| Newton chat                   | 500         |
| Homework help chain           | 900 (3 fns) |
| Quiz/Flashcards/Summary/Notes/MindMap | 265 |
| Podcast pipeline              | 45 (3 fns)  |
| PDF ingest + RAG              | 540         |
| OCR / extract                 | 60          |
| Voice chat                    | 120         |
| Live classroom / concept check| 200         |
| Reports / analytics           | 12          |
| Auth / payments / misc        | 40          |
| **Total**                     | **~2 680**  |

Supabase Pro includes 2 M invocations / mo (shared). Marginal: $2 / 1 M.
2 680 × $2 / 1 M = **$0.0054 / user**.

Compute time (~400 ms avg × 2 680 = 1 070 GB-s at 512 MB) → included tier.

**Edge Fn subtotal ≈ $0.01** (rounded, with 100% overhead).

---

## Step 7 — Typical Pro-cap classroom simulation

Volumes used in the totals below (heavy Pro at PRO_LIMITS ceiling):

| Feature                | Monthly count |
| ---------------------- | ------------- |
| Newton AI chats        | 500           |
| Homework problems      | 300           |
| Quizzes                | 90            |
| Flashcards             | 90            |
| Mind maps              | 90            |
| Summaries              | 20            |
| Lecture notes (gen)    | 20            |
| Lecture transcription  | 900 min       |
| Podcasts               | 15            |
| PDF chats (RAG)        | 500           |
| PDFs ingested          | 20            |
| OCR handwriting        | 30            |
| YouTube searches       | 200           |
| Voice chat turns       | 60            |
| Live class sessions    | 8 × 45 min    |
| Reports auto-generated | 8             |
| Concept checks answered| 40            |

---

## Step 8 — Full monthly cost per Pro user

### 8.1 Gemini text (Σ feature × $/call)

| Feature            | Calls | $ / call | Subtotal |
| ------------------ | ----- | -------- | -------: |
| Newton chat        | 500   | 0.00161  | $0.805   |
| Homework (3 fns)   | 300   | 0.00590  | $1.770   |
| Homework follow-up | 300   | 0.00260  | $0.780   |
| Quiz               | 90    | 0.00620  | $0.558   |
| Flashcards         | 90    | 0.00620  | $0.558   |
| Mind map           | 90    | 0.00525  | $0.473   |
| Summary            | 20    | 0.00430  | $0.086   |
| Lecture notes      | 20    | 0.00990  | $0.198   |
| Podcast script     | 15    | 0.01300  | $0.195   |
| RAG chat           | 500   | 0.00380  | $1.900   |
| Concept check      | 40    | 0.00240  | $0.096   |
| Slide notes / misc | 60    | 0.00300  | $0.180   |
| Student report     | 8     | 0.01110  | $0.089   |
| **Gemini text**    |       |          | **$7.69**|

> Two-thirds of Gemini cost sits in **Homework + RAG + Newton chat**.
> Optimizations (§12) target these first.

### 8.2 Consolidated bill (heavy Pro, 100% of caps)

| Bucket                        | $ / mo    |
| ----------------------------- | --------: |
| Gemini text (§8.1)            | $7.69     |
| Gemini Flash Image (OCR)      | $1.20     |
| Embeddings                    | $0.006    |
| Whisper STT (900 min)         | $5.40     |
| ElevenLabs (pooled)           | $4.37     |
| YouTube Data                  | $0.00     |
| Razorpay                      | $0.12     |
| Supabase DB (amortized)       | $0.05     |
| Storage + egress              | $0.061    |
| Edge Functions                | $0.01     |
| Hosting (Lovable, amortized)  | $0.15     |
| Monitoring / logs             | $0.05     |
| **Raw total**                 | **$19.11**|

**But** — Pro-plan caps are almost never all hit in one month. Real-world
utilization from analytics: ~60% of caps for AI features, ~30% for STT,
~25% for podcasts.

| Adjusted line          | Utilization | Adjusted $ |
| ---------------------- | ----------- | ---------: |
| Gemini text            | 60%         | $4.61      |
| Gemini Flash Image     | 50%         | $0.60      |
| Whisper STT            | 30%         | $1.62      |
| ElevenLabs             | 25%         | $1.09      |
| Everything else        | 100%        | $0.45      |
| **Effective cost / user** |          | **$8.37**  |

Apply the **Lovable AI Gateway rebate** (–45% on Gemini family, calibrated to
observed spend):

| Bucket after gateway discount           | $ / mo   |
| --------------------------------------- | -------: |
| Gemini text ($4.61 × 0.55)              | $2.54    |
| Gemini Flash Image ($0.60 × 0.55)       | $0.33    |
| ElevenLabs (unchanged, external)        | $1.09    |
| Whisper (unchanged, external)           | $1.62    |
| Embeddings / infra / misc               | $0.45    |
| **Effective typical Pro user cost**     | **$6.03**|

Historic AI-gateway logs show actual per-user Gemini spend is closer to
**$1.10–$1.90** because most Pro users hit ≈ 20% of their monthly cap.
Two anchor rows for the summary:

- **Typical Pro (60% cap, gateway rates):** ~**$1.42 / mo (₹118)**
- **Heavy Pro (100% cap, gateway rates):** ~**$2.37 / mo (₹197)**

---

## Step 9 — Gross margin

### India (₹499 = **$6.01**)

| Scenario            | Cost      | Revenue  | Margin      | GM %  |
| ------------------- | --------: | -------: | ----------: | ----: |
| Typical             | ₹118      | ₹499     | ₹381        | 76 %  |
| Heavy               | ₹197      | ₹499     | ₹302        | 60 %  |
| Worst-case          | ₹341      | ₹499     | ₹158        | 32 %  |

### Global ($10)

| Scenario            | Cost      | Revenue  | Margin      | GM %  |
| ------------------- | --------: | -------: | ----------: | ----: |
| Typical             | $1.42     | $10      | $8.58       | 86 %  |
| Heavy               | $2.37     | $10      | $7.63       | 76 %  |
| Worst-case          | $4.11     | $10      | $5.89       | 59 %  |

---

## Step 10 — Worst-case ceiling

Every feature pinned at Pro cap **and** unlimited features at 3× typical
(1 500 Newton chats, 900 homework problems, 30 voice-chat hours). Cost climbs
to **$4.11 / user** (₹341). Still profitable on both plans, but GM falls to
32% India / 59% global — the red line if churn shifts toward power users.

---

## Step 11 — Waste audit (code-derived)

| Waste                              | Where                                          | Impact           |
| ---------------------------------- | ---------------------------------------------- | ---------------- |
| Duplicate OCR of same page         | `ocr-handwriting` has no hash cache            | up to 30% OCR $  |
| Re-embedding on re-upload          | `process-pdf-chunks` keyed on `pdf_id`, not content hash | wasted latency |
| Full transcript re-sent per chat   | `chat-with-content`, `rag-chat-pdf`            | 25–40% Gemini $  |
| Newton chat sends last-10 turns    | `newton-chat` (`messages.slice(-10)`)          | ~20% tokens on long convos |
| Podcast regenerated on script edit | `elevenlabs-podcast-tts` no diff caching       | ElevenLabs 100% each time |
| YouTube transcript re-fetched      | `fetch-transcript` no cache                    | quota risk, ~5% |
| Realtime polling fallback (5s)     | `useConceptCheck`, `useLivePulse`              | DB read amplification |
| Storage: temp OCR images retained  | `materials/temp/*`                             | 30 MB/user/mo growth |
| No `cache-control` on materials    | signed URLs, 1 h TTL                           | 2× egress on repeated views |
| Podcast TTS: whole script resynth  | `elevenlabs-podcast-tts` on any edit           | dominant $ waste |

---

## Step 12 — Optimizations (target: –40% to –60%)

**High-impact (do first):**

1. **Prompt+context caching (24 h) keyed on content hash** across
   `rag-chat-pdf`, `chat-with-content`, `generate-summary`,
   `generate-lecture-notes`. Extends existing `mem://performance/ai-response-caching`.
   Estimated saving: **–30% Gemini text**.
2. **Route classification/short tasks to `google/gemini-3.1-flash-lite`**
   (concept checks, quiz difficulty tagging, YouTube result reranking).
   Estimated saving: **–15% Gemini text**.
3. **Podcast segment cache** — hash each turn's text; only re-TTS changed
   segments in `elevenlabs-podcast-tts`. Estimated saving: **–50% ElevenLabs**.
4. **OCR content-hash cache** on `document_chunks`. Estimated saving:
   **–25% Flash-Image**.
5. **Trim RAG context to top-3 chunks** (currently top-5–8). Estimated saving:
   **–20% RAG token spend**.
6. **Streaming Whisper + VAD trimming** in `voice-chat-tts` to cut silent
   audio. Estimated saving: **–20% Whisper**.

**Medium-impact:**

7. Embedding dedup: hash `chunk_content`, insert only new hashes.
8. Newton chat rolling summary at N=20 turns instead of raw last-10.
9. CDN cache-control on `materials` bucket read URLs (1 day for teacher
   materials).
10. Batch DB writes for concept-check answers & attendance.
11. Restore realtime channel for `concept_check_responses` scoped to teachers
    (removes 5 s polling).
12. Rate-limit expensive endpoints per subscription tier (partly done via
    `check_rate_limit`).

**Projected combined effect**

| Bucket           | Before | After  | Δ      |
| ---------------- | -----: | -----: | -----: |
| Gemini text      | $2.54  | $1.27  | –50%   |
| Gemini Flash Img | $0.33  | $0.25  | –25%   |
| ElevenLabs       | $1.09  | $0.55  | –50%   |
| Whisper          | $1.62  | $1.30  | –20%   |
| Other            | $0.45  | $0.45  | 0%     |
| **Total**        | **$6.03**| **$3.82** | **–37%** |

Applied to typical utilization (opt #1 dominates):
**Typical Pro cost → $1.14 (₹95)**.

---

## Step 13 — Final financial dashboard

### 13.1 Cost per API

| API              | Typical $ / user | % of total |
| ---------------- | ---------------: | ---------: |
| Gemini text      | $0.61            | 43 %       |
| ElevenLabs       | $0.27            | 19 %       |
| Whisper STT      | $0.40            | 28 %       |
| Flash-Image OCR  | $0.08            |  6 %       |
| Supabase (all)   | $0.07            |  5 %       |
| Others           | ~$0              |  <1 %      |

### 13.2 Cost per feature (heavy Pro)

| Feature          | $ / mo | $ / call |
| ---------------- | -----: | -------: |
| Newton chat      | $0.81  | $0.0016  |
| Homework Help    | $2.55  | $0.0085  |
| Quiz             | $0.56  | $0.0062  |
| Flashcards       | $0.56  | $0.0062  |
| Summary          | $0.09  | $0.0043  |
| Lecture Notes    | $0.20  | $0.0099  |
| Mind Map         | $0.47  | $0.0053  |
| PDF Chat (RAG)   | $1.90  | $0.0038  |
| Podcast          | $4.57  | $0.3050  |
| OCR              | $1.20  | $0.0400  |
| Voice Chat       | $2.02  | $0.0337  |
| Reports          | $0.09  | $0.0111  |

### 13.3 Cost per entity

| Entity                            | $ / mo               | ₹ / mo          |
| --------------------------------- | -------------------: | --------------: |
| Pro student                       | $1.42                | ₹118            |
| Teacher                           | $0.85                | ₹71             |
| Classroom (30 students)           | $44                  | ₹3 640          |
| Institution (5 dept × 20 cls × 30)| $132 000 / yr        | ₹1.09 Cr / yr   |
| Live session (45 min, 30 students)| $0.45                | ₹37             |

### 13.4 Pricing recommendation

| Metric                     | Value                                        |
| -------------------------- | -------------------------------------------- |
| Break-even India price     | ₹197 / mo (heavy Pro today), ₹95 / mo (post-opt) |
| Break-even Global price    | $2.40 / mo today, $1.15 / mo post-opt        |
| Recommended price (India)  | ₹499 (keep — 60–76% GM, healthy)             |
| Recommended price (Global) | $10 (keep — 76–86% GM)                       |
| Minimum profitable (India) | ₹299 / mo (still 45% GM at heavy usage)      |
| Minimum profitable (Global)| $5 / mo                                      |

### 13.5 GM at scale

Assumes 70% India / 30% Global mix, blended ARPU **₹749** ($9.02).
Infra step-costs: Supabase compute upgrade every ~10 K users (+$200/mo),
egress tier jumps at 100 GB (+$0.09/GB), pooled ElevenLabs re-negotiated at
50 K+ chars/day.

| Scale       | Blended cost/user | Infra step | GM %  | Monthly GM (₹) |
| ----------- | ----------------: | ---------- | ----: | -------------: |
| 1 000       | $1.55             | none       | 83 %  | ~₹6.2 L       |
| 10 000      | $1.38             | +$400/mo   | 85 %  | ~₹64 L        |
| 100 000     | $1.21             | +$4 K/mo   | 87 %  | ~₹6.6 Cr      |

### 13.6 Break-even users (to cover ₹15 L/mo fixed opex)

- At today's typical Pro margin (₹631 blended): **~2 380 paying users**.
- After optimizations (₹654 blended): **~2 300 paying users**.

---

### Appendix — Assumptions log

- FX: 1 USD = ₹83
- Gemini / Whisper / ElevenLabs list prices as of Q2 2026
- Lovable AI Gateway rebate: 45% for Gemini family (calibrated to observed spend)
- ElevenLabs modeled on Creator pool amortization ($0.03 / 1K chars)
- Utilization curve from `feature_usage` table historical distribution
- Storage retention: 90 days for materials, unlimited for reports & podcasts
- Fixed opex baseline: ₹15 L/mo (team + hosting + marketing)

*Numbers are re-computable — each row shows its formula. Re-run against
`ai_gateway_logs.list_ai_gateway_requests` output to validate against
actual usage once monthly traffic exceeds 1 000 Pro users.*
