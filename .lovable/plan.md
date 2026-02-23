
# Teacher Quiz-to-Class Assignment Integration

## What Changes
When a teacher uploads a document on the dashboard and clicks "Quiz" in the study tools bar, the quiz generation dialog will now include a "Choose Class" dropdown. If a class is selected, the generated quiz is automatically saved as a published assignment in that class, visible to students.

## Flow
1. Teacher uploads PDF/PPT on the main dashboard (existing upload zone -- no changes needed)
2. Document opens in the PDF viewer with the study tools bar (existing -- no changes needed)
3. Teacher clicks "Quiz" in the tools bar -- the settings dialog opens
4. The settings dialog now shows a "Assign to Class" dropdown at the bottom (only visible for teachers)
5. Teacher selects a class, configures question count/difficulty, and clicks "Generate"
6. Quiz is generated normally AND automatically created as a published assignment in the selected class
7. Students see it in their class assignments

## Technical Changes

### 1. `src/components/GenerationSettingsDialog.tsx`
- Add optional `classId` prop and `onClassSelected` callback
- Add a "Assign to Class" `Select` dropdown at the bottom of the dialog (only shown for teachers)
- Fetch teacher's classes using `supabase.from("classes").select("id, name")`
- Pass the selected `classId` through in the `GenerationSettings` interface
- Add `classId?: string` to the `GenerationSettings` interface

### 2. `src/components/StudyToolsBar.tsx`
- Pass the selected class ID through to the `onGenerateQuiz` callback (already passes `GenerationSettings`)
- No structural changes needed -- the settings already flow through

### 3. `src/pages/Index.tsx`
- In `handleGenerateQuizFromContent`, after successful quiz generation, check if `settings.classId` is set
- If so, call `supabase.from("assignments").insert(...)` to create a published assignment with:
  - `class_id`: the selected class
  - `title`: document name + " Quiz"
  - `assignment_type`: "quiz"
  - `content`: `{ questions: generatedQuestions }` with `correct_answer` field added for grading
  - `is_published`: true
  - `due_date`: 5 minutes from now (for live quiz) or null (for homework)
- Show a toast: "Quiz assigned to [Class Name]!"

### 4. `src/components/UniversalStudySettingsDialog.tsx`
- Add the same "Assign to Class" dropdown for when quiz generation is triggered from the standalone AI Quiz tool
- Same logic: fetch teacher's classes, show dropdown, pass classId in settings
- Add `classId?: string` to `UniversalGenerationSettings`

### Files Modified
| File | Change |
|------|--------|
| `src/components/GenerationSettingsDialog.tsx` | Add class selector dropdown + extend GenerationSettings type |
| `src/components/UniversalStudySettingsDialog.tsx` | Add class selector dropdown + extend settings type |
| `src/pages/Index.tsx` | After quiz generation, create assignment if classId is set |

### No Database Changes Needed
- The `assignments` table already exists with the right schema
- The `classes` table already has RLS policies for teacher access
- Auto-grading RPC (`auto_grade_quiz_submission`) already works with the existing assignment format
