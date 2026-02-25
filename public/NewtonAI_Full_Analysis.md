# NewtonAI — Complete Platform Analysis Document

**Version**: Current Production Build  
**Date**: February 25, 2026  
**Platform URL**: https://newtonai.lovable.app  
**Stack**: React 18 + TypeScript + Tailwind CSS + Supabase (Lovable Cloud)

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [User Roles & Onboarding](#5-user-roles--onboarding)
6. [Core AI Study Tools (10 Tools)](#6-core-ai-study-tools)
7. [Classroom Management System](#7-classroom-management-system)
8. [Live Session Interaction System](#8-live-session-interaction-system)
9. [Post-Class Intelligence Reports](#9-post-class-intelligence-reports)
10. [Newton AI Assistant](#10-newton-ai-assistant)
11. [Monetization & Credits System](#11-monetization--credits-system)
12. [Admin Dashboard](#12-admin-dashboard)
13. [Database Schema (27+ Tables)](#13-database-schema)
14. [Edge Functions (54 Functions)](#14-edge-functions)
15. [Frontend Architecture](#15-frontend-architecture)
16. [SEO & Marketing Pages](#16-seo--marketing-pages)
17. [Security Implementation](#17-security-implementation)
18. [Performance Optimizations](#18-performance-optimizations)
19. [Complete Route Map](#19-complete-route-map)
20. [Hooks & State Management](#20-hooks--state-management)

---

## 1. EXECUTIVE SUMMARY

NewtonAI is a comprehensive AI-powered edtech platform designed for both individual students and classroom environments. It combines 10 AI-powered study tools with a full classroom management system featuring real-time live sessions, concept checks, automated notes, and post-session intelligence reports.

**Key Value Propositions:**
- Upload any document (PDF, DOCX, PPTX, images, YouTube URLs, audio) → AI generates study materials
- Teachers can manage classes, run live interactive sessions, and get data-driven analytics
- Students get personalized AI tutoring, automated notes, and post-session understanding reports
- Newton AI assistant serves as a persistent, context-aware tutor

**Scale Indicators:**
- 27+ database tables with comprehensive RLS policies
- 54 Edge Functions handling backend logic
- 56+ custom React hooks
- 150+ React components
- Role-based access (Student, Teacher, Admin)

---

## 2. TECHNOLOGY STACK

### Frontend
| Technology | Purpose |
|---|---|
| React 18.3.1 | UI framework with lazy loading |
| TypeScript | Full type safety |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling with custom design tokens |
| shadcn/ui (Radix) | Accessible UI component library |
| Framer Motion | Page transitions & animations |
| React Router DOM 7 | Client-side routing |
| TanStack React Query 5 | Server state management |
| Recharts | Data visualization (charts) |
| react-pdf / pdfjs-dist | PDF rendering in-browser |
| jsPDF | Client-side PDF generation |
| docx | DOCX file generation |
| KaTeX | LaTeX math rendering |
| react-markdown + remark-gfm + remark-math | Markdown rendering with math support |
| react-syntax-highlighter | Code block highlighting |
| DOMPurify | XSS sanitization |
| Lottie React | Animated mascot illustrations |
| html2canvas | Screenshot/export features |
| react-dropzone | File upload drag-and-drop |
| react-resizable-panels | Split-pane layouts |
| Zod | Runtime schema validation |
| react-hook-form | Form management |

### Backend (Supabase / Lovable Cloud)
| Technology | Purpose |
|---|---|
| PostgreSQL | Primary database |
| Supabase Auth | Authentication (email + Google OAuth) |
| Supabase Edge Functions (Deno) | 54 serverless functions |
| Supabase Storage | File storage (PDFs, class materials) |
| Supabase Realtime | WebSocket subscriptions for live sessions |
| Row Level Security (RLS) | Data access control |
| Database Functions (RPCs) | Server-side business logic |

### External Services
| Service | Purpose |
|---|---|
| Lovable AI Gateway (Gemini 2.5 Flash/Pro) | AI text generation (topic extraction, quiz generation, notes, reports) |
| YouTube Data API v3 | Educational video search |
| ElevenLabs | Text-to-speech for AI Podcasts |
| Razorpay | Payment processing (Indian market) |

---

## 3. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                  │
│                                                         │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐ │
│  │ Landing  │ │Dashboard │ │  Tools    │ │ Classroom │ │
│  │ Pages    │ │ & Profile│ │ (10 AI)   │ │ System    │ │
│  └─────────┘ └──────────┘ └───────────┘ └───────────┘ │
│                        │                                │
│  ┌─────────────────────┴─────────────────────────────┐ │
│  │           React Query + Custom Hooks (56+)         │ │
│  │           Contexts (Podcast, Study, Guest, etc.)   │ │
│  └─────────────────────┬─────────────────────────────┘ │
└────────────────────────┼────────────────────────────────┘
                         │ HTTPS / WebSocket
┌────────────────────────┼────────────────────────────────┐
│              SUPABASE BACKEND (Lovable Cloud)           │
│                        │                                │
│  ┌─────────────────────┴──────────────┐                │
│  │        54 Edge Functions           │                │
│  │  (AI, Content Processing, Auth,    │                │
│  │   Payments, Analytics)             │                │
│  └─────────────────────┬──────────────┘                │
│                        │                                │
│  ┌──────────┐ ┌────────┴───┐ ┌──────────┐ ┌────────┐ │
│  │   Auth   │ │ PostgreSQL │ │ Storage  │ │Realtime│ │
│  │  System  │ │  27+ Tables│ │ Buckets  │ │ Pub/Sub│ │
│  └──────────┘ └────────────┘ └──────────┘ └────────┘ │
└─────────────────────────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────┐
│              EXTERNAL SERVICES                          │
│  ┌──────────┐ ┌────────┴───┐ ┌───────────┐            │
│  │ Lovable  │ │  YouTube   │ │ElevenLabs │            │
│  │ AI (Gemini)│ │  Data API  │ │   TTS     │            │
│  └──────────┘ └────────────┘ └───────────┘            │
└─────────────────────────────────────────────────────────┘
```

### Data Flow Pattern
1. User uploads content (PDF/DOCX/PPTX/Image/YouTube URL/Audio)
2. Frontend sends to Edge Function for text extraction
3. Extracted text → AI Edge Function (Gemini) for processing
4. Results stored in PostgreSQL / returned to client
5. Realtime subscriptions push live updates (classroom features)

---

## 4. AUTHENTICATION & AUTHORIZATION

### Auth Methods
- **Email + Password** (with email verification required by default)
- **Google OAuth** (via Supabase Social Auth)

### Auth Flow
1. User signs up → email verification sent (NOT auto-confirmed)
2. `onAuthStateChange` listener in `Auth.tsx` is the single source of truth for post-login routing
3. Database queries within listener are deferred using `setTimeout` to prevent client deadlocks
4. Profile creation trigger fires on `auth.users` insert → creates `profiles` row
5. Retry mechanism (2 attempts, 1.5s delay) in `checkOnboardingAndRedirect` and `OnboardingGate`

### Route Protection Layers
| Guard Component | Purpose |
|---|---|
| `ProtectedRoute` | Requires authenticated session |
| `OnboardingGate` | Ensures onboarding is completed |
| `RoleRoute` | Restricts to specific role (teacher/student) |
| `AdminRoute` | Requires admin role via `has_role` RPC |
| `ToolAuthGate` | Tool-level auth check with guest trial support |
| `FeatureGate` | Subscription tier gating |

### Session Management
- Supabase session tokens with automatic refresh
- `useUserRole` hook fetches and caches role array (`['teacher']`, `['student']`, etc.)
- Multi-role support (user can be both teacher and admin)

---

## 5. USER ROLES & ONBOARDING

### Roles
| Role | Capabilities |
|---|---|
| **Student** | Use AI tools, join classes, participate in live sessions, view reports |
| **Teacher** | All student capabilities + create/manage classes, run live sessions, view analytics |
| **Admin** | Platform-wide analytics, user management, redeem code management |

### Onboarding Flow ("Step 0")
1. After first login → `/onboarding` page
2. User selects role: Teacher or Student
3. Collects: full name, education level, subjects, study goals
4. Role inserted into `user_roles` table
5. Profile updated with `onboarding_completed = true`
6. Redirected to appropriate dashboard

---

## 6. CORE AI STUDY TOOLS (10 Tools)

All tools support multi-format input: PDF, DOCX, PPTX, Images (OCR), YouTube URLs, Audio, and direct text paste.

### 6.1 Homework Help (`/tools/homework-help`)
- **Input**: Photo of problem, typed question, or document upload
- **Process**: `solve-problem` → `structure-problem` → `detailed-solution` Edge Functions
- **Output**: Step-by-step solution with LaTeX math rendering
- **Features**: Solution chat follow-up, screenshot capture, inline solution panel

### 6.2 AI Flashcards (`/tools/flashcards`)
- **Input**: Any document or text
- **Process**: `generate-flashcards` Edge Function → Gemini AI
- **Output**: Interactive flashcard deck with flip animations
- **Features**: Spaced repetition hints, completion screen, assign to class

### 6.3 AI Quiz (`/tools/quiz`)
- **Input**: Any document or text
- **Process**: `generate-quiz` Edge Function → Gemini AI
- **Output**: Multiple-choice quiz with auto-grading
- **Features**: Quiz mode, review mode, score breakdown, assign to class as assignment

### 6.4 AI Summarizer (`/tools/summarizer`)
- **Input**: Any document or text
- **Process**: `generate-summary` Edge Function → Gemini AI
- **Output**: Structured summary with key points
- **Features**: Different summary lengths, export options

### 6.5 AI Lecture Notes (`/tools/lecture-notes`)
- **Input**: Any document, audio recording, or text
- **Process**: `generate-lecture-notes` Edge Function → Gemini AI
- **Output**: Structured lecture notes with headings, key points, examples
- **Features**: Audio recording with transcription, live recording indicator

### 6.6 Mind Map (`/tools/mind-map`)
- **Input**: Any document or text
- **Process**: `generate-mindmap` Edge Function → Gemini AI
- **Output**: Visual mind map with nodes and connections
- **Features**: Interactive zoom/pan, node expansion, visual layout

### 6.7 AI Podcast (`/tools/ai-podcast`)
- **Input**: Any document or text
- **Process**: `generate-podcast-script` → `elevenlabs-podcast-tts` Edge Functions
- **Output**: Audio podcast with two AI hosts discussing the content
- **Features**: Voice settings, style presets, speaking avatars, waveform visualization, mini player, raise hand interaction, ambient sounds

### 6.8 PDF Chat (`/pdf-chat`)
- **Input**: PDF, DOCX, PPTX, Image, YouTube URL, Audio
- **Process**: `process-pdf-chunks` (chunking + embeddings) → `chat-with-content` (RAG)
- **Output**: Conversational AI grounded in document content
- **Features**: Citation references, context mode selection, semantic search, persistent chat history

### 6.9 OCR / Handwriting Recognition
- **Input**: Image of handwritten or printed text
- **Process**: `ocr-handwriting` Edge Function → Gemini vision
- **Output**: Extracted text with split view (image + text side by side)
- **Features**: Handwriting + printed text support, overlay view

### 6.10 YouTube Video Discovery
- **Input**: Any document or direct search
- **Process**: `search-youtube` Edge Function → YouTube Data API
- **Output**: Curated educational videos from top channels
- **Features**: Channel filtering (Khan Academy, 3Blue1Brown, etc.), find more videos, video player

### Shared Tool Infrastructure
- `ContentInputTabs` — Unified input component supporting all formats
- `UniversalStudySettingsDialog` — Settings modal with "Assign to Class" option
- `StudyToolsBar` — Persistent toolbar on document reader pages
- `ToolAuthGate` — Authentication check with guest trial fallback
- `FeatureGate` — Subscription tier check
- `GenerationSettingsDialog` / `VideoGenerationSettingsDialog` — AI generation parameters
- `useFeatureUsage` / `useFeatureLimitGate` — Usage tracking and limits
- `generation_history` table — Logs all AI generations per user

---

## 7. CLASSROOM MANAGEMENT SYSTEM

### 7.1 Teacher Dashboard (`/teacher`)
- Class list with stats (students enrolled, assignments count)
- Create new class (name, subject, description, academic year)
- Quick actions: start live session, create assignment

### 7.2 Class Detail (`/teacher/classes/:id`)
- **Tabs**: Overview | Students | Materials | Assignments | Announcements | Analytics
- **Overview**: Class info, invite code display, quick stats
- **Students**: Enrolled student list with status management
- **Materials**: Upload PDF/DOCX/PPTX → stored in `class-materials` bucket (private, signed URLs)
- **Assignments**: Create Quiz/Flashcard/Worksheet/Poll assignments with due dates
- **Announcements**: Pin-able class announcements
- **Analytics**: 4 sub-tabs:
  - Overview: Summary stats + Recharts trends
  - Students: Per-student metrics table (avg score, last active)
  - Results: Per-assignment score distribution
  - Attendance: Grid view of session attendance

### 7.3 Student Class View (`/student/class/:id`)
- View class materials (with signed URL access)
- View assignments and submit answers
- View announcements
- Join live sessions

### 7.4 Class Joining
- Teacher shares 6-character invite code
- Student enters code at `/join-class`
- `join_class_by_code` RPC validates and creates enrollment
- Logged in `class_join_codes` table

### 7.5 Assignment System
| Type | Description |
|---|---|
| Quiz | AI-generated MCQ, auto-graded via `auto_grade_quiz_submission` RPC |
| Flashcard | Study-only, completion tracked |
| Worksheet | Free-form, manually graded |
| Poll | Class polls |

- Teachers can bridge lecture → assessment by assigning AI-generated quizzes directly from the document reader
- `CreateAssignmentDialog` with class selector
- Submissions tracked in `assignment_submissions` table

---

## 8. LIVE SESSION INTERACTION SYSTEM

The live session is a 5-phase real-time classroom interaction framework:

### Phase 1: Live Pulse (Real-time Understanding Meter)
- **Student**: Selects understanding status: "Got It" 🟢 | "Slightly Lost" 🟡 | "Lost" 🔴
- **Teacher**: Sees real-time aggregate bar (PulseMeter) with percentages
- **Confusion Alert**: Triggers when confusion_percentage >= threshold (default 40%) with minimum 3 responses
- **Implementation**: 
  - `useLivePulse` hook with 500ms debounce
  - `upsert_pulse_response` RPC (SECURITY DEFINER)
  - `get_pulse_summary` RPC for aggregation
  - Realtime subscription on `live_pulse_responses` table
  - `live_pulse_summary` database VIEW (with `security_invoker = on`)

### Phase 2: Anonymous Question Wall
- **Student**: Submit anonymous questions
- **Teacher**: View, pin, mark as answered, see upvotes
- **Newton AI**: Auto-answers questions in background via `newton-chat` Edge Function
- **Implementation**:
  - `useQuestionWall` hook
  - Sorting: Pinned > Upvotes > Created At
  - `live_questions` + `live_question_upvotes` tables
  - Realtime subscription for new questions

### Phase 3: Instant Concept Checks
- **Teacher**: One-click AI-generated MCQ quiz during session
- **Student**: Full-screen overlay with timer, selects A/B/C/D
- **Teacher**: Live results panel showing answer distribution
- **Implementation**:
  - `generate-concept-check` Edge Function (AI generates from slide context)
  - `concept_checks` + `concept_check_responses` tables
  - `submit_concept_check_response` RPC (also mirrors to `assignment_submissions`)
  - `close_concept_check` + `get_concept_check_results` RPCs
  - Difficulty selection: Easy / Medium / Hard
  - Duration: configurable (default 30 seconds)

### Phase 4: Live Notes Co-Pilot
- **Auto-generates**: Structured notes per slide as teacher advances
- **Note Types**: heading, key_point, detail, remember, example
- **Student Annotations**: Star items, add text notes
- **Export**: PDF/DOCX/Markdown via `useNotesExport` hook
- **Implementation**:
  - `generate-slide-notes` Edge Function
  - `session_slide_notes` table (AI content)
  - `student_note_annotations` table (personal annotations)
  - `session_notes_export` table (export records)
  - `useLiveNotes` + `useStudentAnnotations` hooks

### Phase 5: Smart Board Spotlight
- **Teacher**: Broadcasts current slide content to all students
- **Student**: Can toggle sync on/off, view formatted slide content
- **Term Definitions**: AI extracts and defines key terms per slide
- **Implementation**:
  - `spotlight_session_state` table (teacher's broadcast state)
  - `student_spotlight_state` table (per-student sync status)
  - `slide_term_definitions` table
  - `generate-term-definitions` Edge Function
  - `useSpotlightSync` + `useTermDefinitions` hooks
  - `SpotlightSyncIndicator` shows sync percentage

### Session Lifecycle
1. **Start**: Teacher selects content source (PDF/PPTX/YouTube), creates session
2. **Active**: Real-time interaction via all 5 phases
3. **Teaching → Assessment**: Teacher can trigger timed quiz mid-session
4. **End**: Session closes, intelligence reports generated
5. **Post-Session**: Notes review page, teacher/student reports

### Shared Context
- `LiveSessionContext` — Central state for session ID, role, settings, slide info
- `LiveSessionProvider` wraps all session components
- Settings: `pulse_enabled`, `questions_enabled`, `confusion_threshold`, `notes_enabled`, `spotlight_enabled`

---

## 9. POST-CLASS INTELLIGENCE REPORTS

### 9.1 Teacher Report (`/report/teacher/:sessionId`)

Generated via `generate-teacher-report` Edge Function.

**Contents:**
| Section | Data |
|---|---|
| Session Summary | Duration, total students, active students, engagement rate |
| Confusion Slides | Slides with highest confusion %, pulse response counts |
| Concept Check Analysis | Per-question accuracy, most common wrong answer, needs review flag |
| Top Unanswered Questions | Student questions not addressed, with AI-suggested answers |
| Topics to Revisit | AI-identified topics needing re-teaching (high/medium/low priority) |
| Engagement Heatmap | Per-slide scores: `pulse*0.4 + annotations*0.4 + questions*0.2` |

**Storage**: `session_intelligence_reports` table

### 9.2 Student Report (`/report/student/:sessionId`)

Generated via `generate-student-report` Edge Function (batch triggered by `trigger-all-student-reports`).

**Contents:**
| Section | Data |
|---|---|
| Understanding Score | Base 50 ± adjustments from pulse, concept checks, annotations |
| Topic Scores | Per-slide understanding with indicator breakdown |
| Knowledge Gaps | AI-identified weak areas with severity levels |
| Revision Flashcards | AI-generated flashcards for weak topics |
| Video Suggestions | YouTube video recommendations per knowledge gap |

**Video Results**: Fetched via `search-videos` Edge Function → stored in `report_video_results` table

**Storage**: `student_intelligence_reports` table

### 9.3 Class Report Overview
Aggregated view for teachers:
- Total students, reports generated, class average score
- Score distribution: excellent (80+), good (60-79), needs work (40-59), struggling (<40)
- Weakest and strongest topics

---

## 10. NEWTON AI ASSISTANT

### Overview
Global AI tutor accessible from any page. Persistent conversation history stored in database.

### Implementation
- **Desktop**: Full-screen layout via `GlobalNewtonAssistant`
- **Mobile**: Full-screen drawer (100dvh) with safe-area padding
- **Mobile Access**: Dedicated tab in `MobileBottomNav` (floating trigger removed on mobile)

### Components
- `newton-chat` Edge Function — Main AI chat endpoint
- `newton_conversations` + `newton_messages` tables
- `useNewtonChat` hook — Message handling
- `useNewtonConversations` hook — Conversation management
- `useNewtonPoses` hook — Mascot pose generation
- `useNewtonSounds` hook — Audio feedback
- `generate-newton-pose` Edge Function — Dynamic mascot poses

### Features
- Context-aware responses
- LaTeX math rendering in responses
- Attachments support
- Conversation history persistence
- Animated mascot with dynamic poses

---

## 11. MONETIZATION & CREDITS SYSTEM

### Subscription Tiers
| Tier | Features |
|---|---|
| **Free** | Limited daily usage per tool |
| **Pro** | Higher limits, priority processing |
| **Ultra** | Unlimited usage, all features |

### Credits System
- Users earn credits by watching ads
- Credits can be spent on AI tool usage
- `user_credits` table tracks: credits, ads_watched_today, lifetime_earned, lifetime_spent
- `credit_transactions` table logs all credit movements
- `earn_credits` / `earn_credits_v2` RPCs handle credit earning
- `feature_costs` table defines per-feature credit costs

### Payment Integration (Razorpay)
- `razorpay-create-order` → Creates payment order
- `razorpay-verify-payment` → Verifies payment signature
- `razorpay-webhook` → Handles async payment events
- `payments` table stores transaction records
- `subscriptions` table manages active subscriptions
- `redeem_codes` / `redeemed_codes` tables for discount codes

### Ad System
- `ads-request` / `ads-complete` Edge Functions
- `ad_sessions` table tracks ad views
- Daily limits on ad-earned credits
- `AdBanner` + `PrimaryAdBanner` components

---

## 12. ADMIN DASHBOARD

### Access Control
- Role: `admin` in `user_roles` table
- `AdminRoute` component + `useAdminAccess` hook
- `has_role` RPC for server-side checks

### Admin Pages
| Page | Features |
|---|---|
| `/admin/analytics` | User growth, revenue/MRR, feature usage charts, activity trends |
| `/admin/users` | User list, tier management, role assignment, search |
| `/admin/inquiries` | Enterprise inquiry management (from contact form) |
| `/admin/redeem-codes` | Create/manage discount codes, usage tracking |

### Admin Infrastructure
- `admin-analytics` Edge Function — Aggregated platform stats
- `admin-users` Edge Function — User management operations
- `admin-redeem-codes` Edge Function — Code CRUD
- `admin_notifications` table — Real-time admin alerts (code redemptions, etc.)
- `enterprise_inquiries` table — Lead management

---

## 13. DATABASE SCHEMA (27+ Tables)

### Core User Tables
| Table | Purpose |
|---|---|
| `profiles` | User profile data (name, avatar, tier, preferences) |
| `user_roles` | Role assignments (student, teacher, admin) |
| `user_credits` | Credit balance and earning history |
| `credit_transactions` | Credit movement log |
| `user_notifications` | In-app notifications |
| `generation_history` | AI tool usage log |

### Classroom Tables
| Table | Purpose |
|---|---|
| `classes` | Class definitions with invite codes |
| `class_enrollments` | Student-class relationships |
| `class_materials` | Uploaded teaching materials |
| `class_announcements` | Teacher announcements |
| `class_join_codes` | Join attempt log |
| `assignments` | Assignment definitions |
| `assignment_submissions` | Student submissions with scores |

### Live Session Tables
| Table | Purpose |
|---|---|
| `live_sessions` | Session state (status, slides, settings) |
| `live_pulse_responses` | Student understanding votes |
| `live_questions` | Anonymous student questions |
| `live_question_upvotes` | Question upvote tracking |
| `concept_checks` | AI-generated quiz questions |
| `concept_check_responses` | Student quiz answers |
| `session_slide_notes` | AI-generated slide notes |
| `student_note_annotations` | Student personal annotations |
| `session_notes_export` | Export history |
| `spotlight_session_state` | Teacher broadcast state |
| `student_spotlight_state` | Student sync state |
| `slide_term_definitions` | AI-extracted term glossaries |

### Report Tables
| Table | Purpose |
|---|---|
| `session_intelligence_reports` | Teacher post-session reports |
| `student_intelligence_reports` | Student understanding reports |
| `report_video_results` | YouTube recommendations for reports |

### Content & AI Tables
| Table | Purpose |
|---|---|
| `pdf_documents` | Uploaded document metadata |
| `document_chunks` | Document text chunks with embeddings |
| `document_file_paths` | Storage references |
| `pdf_chat_sessions` | Chat session metadata |
| `pdf_chat_messages` | Chat message history |
| `newton_conversations` | Newton AI conversation threads |
| `newton_messages` | Newton AI messages |
| `podcasts` | Generated podcast metadata + scripts |
| `search_history` | User search queries |

### Payment Tables
| Table | Purpose |
|---|---|
| `payments` | Razorpay payment records |
| `subscriptions` | Active subscription management |
| `ad_sessions` | Ad viewing sessions |
| `redeem_codes` | Discount code definitions |
| `redeemed_codes` | Code redemption log |

### System Tables
| Table | Purpose |
|---|---|
| `feature_usage` | Per-user, per-feature monthly usage |
| `feature_costs` | Credit cost per feature |
| `rate_limits` | API rate limiting |
| `rate_limit_config` | Rate limit configuration |
| `webhook_events` | Payment webhook deduplication |
| `admin_notifications` | Admin alert queue |
| `enterprise_inquiries` | Enterprise contact submissions |
| `study_sessions` | Study time tracking |
| `video_watch_time` | Video engagement tracking |

### Database Views
| View | Purpose |
|---|---|
| `live_pulse_summary` | Aggregated pulse data per session (security_invoker=on) |

---

## 14. EDGE FUNCTIONS (54 Functions)

### Content Extraction (6)
| Function | Purpose |
|---|---|
| `extract-pdf-text` | PDF binary → text |
| `extract-docx-text` | DOCX XML → text |
| `extract-pptx-text` | PPTX slides → structured text with slide headers |
| `extract-text` | Unified extraction router |
| `process-pdf` | Legacy PDF processing |
| `process-pdf-chunks` | Chunk + embed for RAG |

### AI Generation (12)
| Function | Purpose |
|---|---|
| `generate-flashcards` | Document → flashcard pairs |
| `generate-quiz` | Document → MCQ quiz |
| `generate-summary` | Document → structured summary |
| `generate-lecture-notes` | Document/audio → lecture notes |
| `generate-mindmap` | Document → mind map structure |
| `generate-podcast-script` | Document → two-host podcast script |
| `generate-slide-notes` | Slide content → structured notes |
| `generate-concept-check` | Slide context → MCQ question |
| `generate-term-definitions` | Slide content → glossary |
| `generate-teacher-report` | Session data → teacher analytics |
| `generate-student-report` | Session data → student report |
| `trigger-all-student-reports` | Batch-trigger all student reports |

### Chat & AI Assistant (6)
| Function | Purpose |
|---|---|
| `newton-chat` | Newton AI tutor conversations |
| `chat-with-content` | RAG-based document chat |
| `chat-with-pdf` | Legacy PDF chat |
| `rag-chat-pdf` | Semantic search + chat |
| `solution-chat` | Homework solution follow-up |
| `voice-chat-tts` | Voice-based chat with TTS |

### Problem Solving (3)
| Function | Purpose |
|---|---|
| `solve-problem` | Problem → solution |
| `structure-problem` | Problem classification |
| `detailed-solution` | Step-by-step solution generation |

### Media & Content (7)
| Function | Purpose |
|---|---|
| `search-youtube` | YouTube video search |
| `search-videos` | Report video recommendations |
| `fetch-transcript` | YouTube transcript extraction |
| `elevenlabs-podcast-tts` | Podcast audio generation |
| `elevenlabs-ambient` | Ambient sound effects |
| `elevenlabs-sfx` | Sound effects |
| `text-to-speech` | General TTS |

### Other (7)
| Function | Purpose |
|---|---|
| `ocr-handwriting` | Image → text (OCR) |
| `transcribe-audio` | Audio → text |
| `find-similar` | Similar content search |
| `analyze-text` | Text analysis |
| `semantic-search-pdf` | Vector similarity search |
| `generate-newton-pose` | Mascot pose generation |
| `podcast-raise-hand` | Interactive podcast feature |

### Payment & Admin (8)
| Function | Purpose |
|---|---|
| `razorpay-create-order` | Create payment order |
| `razorpay-verify-payment` | Verify payment |
| `razorpay-webhook` | Payment webhooks |
| `ads-request` / `ads-complete` | Ad system |
| `get-banner-ad` | Banner ad serving |
| `admin-analytics` | Platform analytics |
| `admin-users` | User management |
| `admin-redeem-codes` | Code management |

### Lifecycle (5)
| Function | Purpose |
|---|---|
| `activate-free-subscription` | Free tier activation |
| `delete-account` | Account deletion |
| `send-welcome-email` | Welcome email |
| `send-enterprise-inquiry` | Enterprise form submission |

---

## 15. FRONTEND ARCHITECTURE

### Component Organization (150+)
```
src/components/
├── ui/                    # shadcn/ui base components (40+)
├── admin/                 # Admin dashboard components
├── concept-check/         # Concept check overlay, triggers, panels
├── intelligence-report/   # Teacher & student report components
├── live-notes/            # Notes co-pilot components
├── live-session/          # Pulse, questions, session controls
├── newton-assistant/      # Newton AI chat interface
├── newton/                # Newton mascot & animations
├── pdf-chat/              # PDF chat interface
├── pricing/               # Pricing page components
├── profile/               # Profile page components
├── spotlight/             # Smart board spotlight components
├── student/               # Student-specific components
├── teacher/               # Teacher-specific components
├── tool-sections/         # Landing page tool showcase
├── compare/               # Competitor comparison pages
├── [root components]      # Shared components (Header, Footer, etc.)
```

### State Management
- **Server State**: TanStack React Query (caching, background refetch)
- **Local State**: React useState + useReducer
- **Shared Contexts**:
  - `PodcastContext` — Podcast playback state
  - `ProcessingOverlayContext` — Global loading overlay
  - `StudyContext` — Study session tracking
  - `GuestTrialContext` — Guest usage limits
  - `LiveSessionContext` — Live session state

### Custom Hooks (56+)
| Category | Hooks |
|---|---|
| **Auth & Roles** | `useUserRole`, `useAdminAccess` |
| **AI Tools** | `usePDFStudyTools`, `useProcessingState`, `useSSEProgress` |
| **Chat** | `useNewtonChat`, `useNewtonConversations`, `usePDFChat`, `useVoiceChat` |
| **Classroom** | `useClasses`, `useAssignments` |
| **Live Session** | `useLivePulse`, `useQuestionWall`, `useConceptCheck`, `useLiveNotes`, `useSpotlightSync`, `useTermDefinitions`, `useSlideContent`, `useSessionSummary`, `useStudentAnnotations`, `useNotesExport` |
| **Reports** | `useTeacherReport`, `useStudentReport`, `useReportFlashcards` |
| **Credits & Usage** | `useCredits`, `useFeatureUsage`, `useFeatureLimitGate`, `useGuestUsage` |
| **Monetization** | `useRazorpay`, `useRedeemCode` |
| **Media** | `useAmbientAudio`, `useAudioWaveform`, `usePodcastAudioQueue`, `usePodcastPreferences`, `useWebSpeechTTS`, `useSpeechRecognition` |
| **UX** | `useMobile`, `usePullToRefresh`, `useLongPress`, `useIdleTimeout`, `useScrollProgress`, `usePageHeight`, `useDeferredLoad` |
| **Data** | `useGenerationHistory`, `useRealtimeActivity`, `useRealtimeProcessing`, `useCurrency`, `useTemplatePreferences`, `useUserNotifications`, `useUsageLimitNotifications` |

---

## 16. SEO & MARKETING PAGES

### Landing Page (`/`)
- Hero section with animated blobs
- Feature showcase with tool cards
- Testimonials section
- CTA sections
- Floating tools showcase

### Content Pages
| Route | Purpose |
|---|---|
| `/about` | About NewtonAI |
| `/features` | Feature overview |
| `/how-it-works` | Step-by-step guide |
| `/pricing` | Subscription plans |
| `/enterprise` | Enterprise contact form |
| `/blog` + `/blog/:slug` | Blog with SEO content |
| `/faq` | Frequently asked questions |
| `/contact` | Contact form |
| `/guides/*` | Educational guides (3 guides) |
| `/ai-for-students` | Student-focused marketing |

### SEO Pages
| Route | Purpose |
|---|---|
| `/ai-study-assistant` | SEO landing for "AI study assistant" |
| `/ai-notes-generator` | SEO landing for "AI notes generator" |
| `/pdf-study-tool` | SEO landing for "PDF study tool" |
| `/ai-quiz-generator` | SEO landing for "AI quiz generator" |
| `/exam-preparation-ai` | SEO landing for "exam preparation AI" |
| `/about-newtonai-for-ai` | LLM-readable about page |

### Competitor Comparison Pages
| Route | Competitor |
|---|---|
| `/compare/chegg` | Chegg |
| `/compare/quizlet` | Quizlet |
| `/compare/studocu` | Studocu |
| `/compare/course-hero` | Course Hero |
| `/compare/chatgpt` | ChatGPT |
| `/compare/studyx` | StudyX |
| `/compare/studyfetch` | StudyFetch |

### SEO Implementation
- `SEOHead` component using `react-helmet-async`
- Title tags < 60 chars
- Meta descriptions < 160 chars
- Semantic HTML (`<header>`, `<main>`, `<section>`)
- JSON-LD structured data where applicable
- Lazy-loaded images with alt attributes

---

## 17. SECURITY IMPLEMENTATION

### Row Level Security (RLS)
Every table has RLS enabled with granular policies:

- **User data**: `auth.uid() = user_id` for personal data
- **Class data**: `is_class_teacher()` and `is_enrolled_in_class()` SECURITY DEFINER functions (prevents infinite recursion)
- **Admin data**: `has_role(auth.uid(), 'admin')` checks
- **Write-restricted tables**: Many tables block direct INSERT/UPDATE/DELETE, requiring RPC calls instead
- **Views**: `live_pulse_summary` uses `security_invoker = on`

### Storage Security
- `class-materials` bucket: **Private**, accessed via signed URLs (1-hour expiry)
- RLS policy restricts to class teacher + enrolled students
- `resolveMaterialUrl()` utility generates signed URLs

### Rate Limiting
- `check_rate_limit` RPC with configurable windows
- `rate_limits` + `rate_limit_config` tables
- Per-user, per-function rate limiting

### Input Sanitization
- DOMPurify for HTML content
- Zod schemas for form validation
- Edge Functions validate all inputs server-side

---

## 18. PERFORMANCE OPTIMIZATIONS

### Code Splitting
- All pages lazy-loaded via `React.lazy()`
- Route prefetching via `requestIdleCallback` after initial load
- Deferred non-critical components (8-second delay): VideoPreloader, PodcastMiniPlayer, CookieConsent, GlobalNewtonAssistant

### Rendering
- `PageTransition` component with Framer Motion for smooth route transitions
- `OptimizedBackgroundBlobs` — CSS-only animated blobs (no JS animation overhead)
- Skeleton loading states for content
- `useDeferredLoad` hook for progressive loading

### Data
- React Query with smart caching and background refetch
- Debounced RPC calls in live session (500ms for pulse)
- Supabase Realtime for push updates (no polling)

### Mobile
- `MobileBottomNav` for touch-friendly navigation
- `usePullToRefresh` for native-like refresh
- `useLongPress` for context actions
- Safe-area padding for notched devices
- `use-mobile` hook for responsive behavior

---

## 19. COMPLETE ROUTE MAP

### Public Routes
```
/                           → Landing Page
/auth                       → Login / Sign Up
/pricing                    → Pricing Plans
/about                      → About
/contact                    → Contact
/faq                        → FAQ
/terms                      → Terms of Service
/privacy                    → Privacy Policy
/refund                     → Refund Policy
/enterprise                 → Enterprise Inquiry
/blog                       → Blog Index
/blog/:slug                 → Blog Post
/features                   → Features Overview
/how-it-works               → How It Works
/ai-for-students            → AI for Students
/guides                     → Guides Index
/guides/how-ai-learning-works
/guides/spaced-repetition-guide
/guides/responsible-ai-use
/compare                    → Comparison Index
/compare/chegg|quizlet|studocu|course-hero|chatgpt|studyx|studyfetch
/ai-study-assistant         → SEO Page
/ai-notes-generator         → SEO Page
/pdf-study-tool             → SEO Page
/ai-quiz-generator          → SEO Page
/exam-preparation-ai        → SEO Page
/about-newtonai-for-ai      → LLM-readable About
```

### Authenticated Routes (tool pages check auth inside component)
```
/tools                      → Tools Index
/tools/homework-help        → Homework Help
/tools/flashcards           → AI Flashcards
/tools/quiz                 → AI Quiz
/tools/summarizer           → AI Summarizer
/tools/lecture-notes         → AI Lecture Notes
/tools/mind-map             → Mind Map
/tools/ai-podcast           → AI Podcast
/pdf-chat                   → PDF Chat
```

### Protected Routes (require auth + onboarding)
```
/dashboard                  → Main Dashboard
/profile                    → User Profile
/onboarding                 → Onboarding Flow
/payment/success            → Payment Success
/payment/failure            → Payment Failure
/join-class                 → Join Class by Code
/student/classes            → Student Class List
/student/class/:id          → Student Class View
/session-notes/:sessionId   → Post-Session Notes Review
/report/student/:sessionId  → Student Intelligence Report
```

### Teacher Routes (require auth + onboarding + teacher role)
```
/teacher                    → Teacher Dashboard
/teacher/classes/:id        → Class Management
/report/teacher/:sessionId  → Teacher Intelligence Report
```

### Admin Routes (require admin role)
```
/admin/analytics            → Platform Analytics
/admin/users                → User Management
/admin/inquiries            → Enterprise Inquiries
/admin/redeem-codes         → Redeem Code Management
```

---

## 20. HOOKS & STATE MANAGEMENT

### Context Providers (Wrapping Order)
```
HelmetProvider
  └── QueryClientProvider
       └── ProcessingOverlayProvider
            └── StudyProvider
                 └── TooltipProvider
                      └── BrowserRouter
                           └── GuestTrialProvider
                                └── PodcastProvider
                                     └── [Routes]
                                          └── LiveSessionProvider (per-session)
```

### Key Data Flows

**Document Upload → AI Tool Output:**
```
User uploads file
  → ContentInputTabs component
  → Edge Function (extract-*-text)
  → Extracted text returned to client
  → Edge Function (generate-*)
  → AI processes with Gemini
  → Results rendered in UI
  → Logged to generation_history
```

**Live Session Flow:**
```
Teacher starts session
  → live_sessions row created
  → Students join via class enrollment
  → LiveSessionProvider wraps UI
  → Realtime subscriptions established
  → Pulse/Questions/ConceptChecks flow via RPCs
  → AI notes generated per slide advance
  → Session ends → Reports triggered
```

**Payment Flow:**
```
User selects plan
  → razorpay-create-order Edge Function
  → Razorpay checkout opens
  → razorpay-verify-payment validates
  → razorpay-webhook confirms
  → subscriptions table updated
  → Profile tier updated
```

---

## SUMMARY STATISTICS

| Metric | Count |
|---|---|
| Database Tables | 27+ |
| Edge Functions | 54 |
| React Components | 150+ |
| Custom Hooks | 56+ |
| Routes | 55+ |
| AI Models Used | Gemini 2.5 Flash/Pro (via Lovable AI Gateway) |
| Auth Methods | Email + Google OAuth |
| User Roles | 3 (Student, Teacher, Admin) |
| AI Study Tools | 10 |
| Live Session Phases | 5 |
| Subscription Tiers | 3 (Free, Pro, Ultra) |
| Payment Gateway | Razorpay |
| External APIs | YouTube Data API, ElevenLabs |

---

*This document represents the complete state of NewtonAI as of February 25, 2026. All systems described are implemented and operational.*
