

# Backend Foundation: Live Pulse & Anonymous Question Wall

## Overview

Set up the complete database schema, RLS policies, RPC functions, and realtime subscriptions for two new classroom interaction features -- without touching any frontend code.

## Database Changes

### 1. New Tables

**live_pulse_responses**
- Stores one understanding-status per student per session (got_it / slightly_lost / lost)
- UNIQUE on (session_id, student_id) for upsert behavior
- Foreign keys to live_sessions (cascade delete) and profiles (cascade delete)
- Validation trigger to enforce status values (avoiding immutable CHECK constraint issues)

**live_questions**
- Fully anonymous -- no student_id column
- Stores question text, upvote count, answered/pinned flags, and optional AI answer
- Foreign key to live_sessions (cascade delete)

**live_question_upvotes**
- Tracks which student upvoted which question (for toggle behavior)
- UNIQUE on (question_id, student_id)
- Foreign keys to live_questions (cascade delete) and profiles (cascade delete)

### 2. Existing Table Update: live_sessions

Add three new columns (no existing columns modified):
- `pulse_enabled` boolean DEFAULT true
- `questions_enabled` boolean DEFAULT true
- `confusion_threshold` integer DEFAULT 40

### 3. Aggregate View

**live_pulse_summary** -- A view that returns per-session aggregate counts (got_it, slightly_lost, lost) so students can SELECT aggregates without seeing individual responses.

## RLS Policies

### live_pulse_responses
- **INSERT**: Students can insert their own row (`auth.uid() = student_id`), validated that they are enrolled in the session's class
- **UPDATE**: Students can update their own row (`auth.uid() = student_id`)
- **SELECT (teachers)**: Teachers can read all rows for sessions they own (`is_class_teacher`)
- **SELECT (students)**: Students cannot SELECT individual rows directly -- they use the `live_pulse_summary` view or RPC
- **DELETE**: Blocked (false)

### live_questions
- **INSERT**: Any enrolled student can insert (no student_id column; enrollment validated via RPC)
- **SELECT**: Enrolled students and session teachers can read
- **UPDATE**: Only the session teacher can update (mark answered, pin)
- **DELETE**: Only the session teacher can delete
- No direct INSERT from client -- use `submit_anonymous_question` RPC instead to validate enrollment

### live_question_upvotes
- **INSERT**: Students can insert their own upvote (`auth.uid() = student_id`)
- **DELETE**: Students can delete their own upvote (`auth.uid() = student_id`)
- **SELECT**: Anyone enrolled or the teacher can read
- **UPDATE**: Blocked

## RPC Functions (SECURITY DEFINER)

### 1. `get_pulse_summary(p_session_id uuid)`
Returns JSON: `{ got_it, slightly_lost, lost, total, confusion_percentage }`
- Validates caller is teacher of the session OR enrolled student
- COUNTs grouped by status
- `confusion_percentage = (slightly_lost + lost) / total * 100`

### 2. `upsert_pulse_response(p_session_id uuid, p_status text)`
- Validates student is enrolled in the session's class
- Validates status is one of the three allowed values
- INSERT ON CONFLICT (session_id, student_id) DO UPDATE SET status, updated_at

### 3. `toggle_question_upvote(p_question_id uuid)`
- If upvote exists for auth.uid() -> DELETE it, decrement live_questions.upvotes
- If not -> INSERT it, increment live_questions.upvotes
- Returns new upvote count and whether user now has_upvoted

### 4. `submit_anonymous_question(p_session_id uuid, p_content text)`
- Validates student is enrolled in the session's class
- Validates content is non-empty and <= 500 chars
- INSERT into live_questions (no student_id)
- Returns the new question row

### 5. `get_session_questions(p_session_id uuid)`
- Validates caller is enrolled or is the teacher
- Returns all questions ordered by upvotes DESC, created_at ASC
- Includes `has_upvoted` boolean by checking live_question_upvotes for auth.uid()

## Realtime

Enable Supabase Realtime on:
- `live_pulse_responses` -- teachers see live pulse updates
- `live_questions` -- everyone sees new questions
- `live_question_upvotes` -- live upvote count sync

## Technical Details

### Migration SQL (single migration)

The migration will execute in this order:
1. ALTER TABLE live_sessions ADD COLUMN (3 new columns)
2. CREATE TABLE live_pulse_responses with unique constraint and validation trigger
3. CREATE TABLE live_questions
4. CREATE TABLE live_question_upvotes with unique constraint
5. CREATE VIEW live_pulse_summary
6. Enable RLS on all 3 new tables
7. Create all RLS policies
8. Create all 5 RPC functions
9. ALTER PUBLICATION supabase_realtime ADD TABLE for all 3 tables

### Validation Approach
- Use a validation trigger on `live_pulse_responses` to enforce status values instead of a CHECK constraint (per project guidelines)
- Use RPC functions for all write operations that need enrollment validation

### No Frontend Changes
This plan only covers backend/database setup. Frontend implementation will follow in the next prompt.

