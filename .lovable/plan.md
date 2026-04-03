

# Part 3 — Class Creation and Class Management Enhancement

## Current State

| Feature | Status |
|---------|--------|
| Basic class creation (name, subject, description, year) | Done — single-step dialog |
| 6-char invite code generation | Done — DB function `generate_invite_code()` |
| Invite code copy pill | Done — `InviteCodePill` component |
| Class detail page with tabs (Students, Assignments, Materials, Marks, Attendance, Analytics) | Done — 849-line `ClassDetail.tsx` |
| QR code generation | Missing |
| Multi-step creation wizard | Missing — currently single form |
| Grade level, section/batch fields | Missing — not in DB schema |
| Class thumbnail selector | Missing |
| Schedule grid (weekly time slots) | Missing |
| Class settings (max students, pulse frequency, Newton Chat toggle, etc.) | Missing |
| Success screen with QR + share buttons | Missing |
| Class page tabs: Sessions, Quizzes, Newton Chat | Missing from tab bar |
| Class header with "Enter Classroom" + "Show QR" buttons | Partial — has Live Session button but no Enter Classroom |

## Plan — 5 Changes

### 1. Database Migration — Add class settings columns

Add to `classes` table:
- `grade_level text` — e.g. "Grade 9-10"
- `section text` — e.g. "Batch A"
- `thumbnail text` — preset icon name or custom image URL
- `max_students integer DEFAULT 0` — 0 = unlimited
- `settings jsonb DEFAULT '{}'` — stores: pulse_frequency, newton_chat_enabled, auto_notes, speech_transcription, allow_student_ocr, anonymous_questions, visibility

No schedule table needed yet — store schedule as JSON inside settings.

### 2. Multi-Step Create Class Dialog

Replace current `CreateClassDialog` with a 3-step wizard inside a wider modal (`sm:max-w-xl`):

**Step 1 — Basic Info:** Class name (required), subject (dropdown from teacher's registered subjects + suggestions), grade level (dropdown), academic year, section/batch (optional), description (textarea), thumbnail picker (grid of 12 preset icons — math formula, atom, flask, cell, book, globe, laptop, palette, music, trophy, lightbulb, rocket).

**Step 2 — Schedule:** 7-day row with time slot buttons. Each day: toggle active, pick start time + duration. "No fixed schedule" toggle skips this step. Store as JSON in `settings.schedule`.

**Step 3 — Settings:** Toggles for visibility (Private/Searchable), max students input, Newton Chat enabled, pulse frequency selector (5/10/15min/manual), auto notes, speech transcription, student OCR visibility, anonymous questions. All stored in `settings` JSONB.

**On Create → Success Screen (Step 4):** Large invite code, QR code (using `qrcode.react` library — install it), "Copy Invite Link" button, "Share via WhatsApp" button (`https://wa.me/?text=...`), "Go to Class" button.

### 3. Enhanced Class Detail Header

Update the header section in `ClassDetail.tsx`:
- Add class thumbnail icon (left of class name)
- Add enrolled students count badge
- Add "Show QR" button → opens modal with large QR code
- Add "Enter Classroom" button (navigates to `/teacher/class/:id/classroom`)
- Show last session date + next scheduled session from settings
- Add "Copy Code" button next to invite code

### 4. Expanded Class Tabs

Add 3 missing tabs to the `ClassDetail.tsx` tab bar:
- **Sessions** tab: query `live_sessions` for this class, show list with date, duration, status, student count, link to report
- **Quizzes** tab: query `assignments` where `assignment_type = 'quiz'`, show with scores and run counts
- **Newton Chat** tab: show conversation stats from `newton_conversations` + `newton_messages` for this class, most asked topics

### 5. Install QR Code Library

Add `qrcode.react` package for generating QR codes in the success screen and the "Show QR" modal.

## Files Changed

| File | Action |
|------|--------|
| `src/components/teacher/CreateClassDialog.tsx` | Rewrite — multi-step wizard with success screen |
| `src/pages/teacher/ClassDetail.tsx` | Modify — enhanced header + 3 new tabs |
| `src/components/teacher/ClassQRModal.tsx` | Create — reusable QR code modal |
| Migration SQL | Add columns to classes table |
| `package.json` | Add `qrcode.react` |

