

# Update All Pages with Classroom Feature Awareness

## Summary
Add teacher/classroom feature mentions across all Legal, Company, and Resources pages shown in the footer. Each page gets targeted additions that fit naturally into its existing content.

---

## Legal Pages

### 1. Terms of Service (`src/pages/Terms.tsx`)
- **Section 2 (Definitions)**: Add definition for "Class" and "Classroom Features" -- features that allow teachers to create classes, invite students, and assign AI-generated work.
- **Section 3 (Description of Services)**: Add bullet: "Classroom Management: Tools for teachers to create classes, generate invite codes, assign quizzes/flashcards, and track student progress."
- **Section 4 (User Accounts)**: Add sub-section "4.5 Teacher Accounts" -- teachers are responsible for managing their classrooms and student data appropriately. Teachers must be 18+ or authorized educators.
- **Section 6 (Acceptable Use)**: Add clause about classroom misuse -- teachers must not use classroom tools for non-educational purposes; students must not share invite codes publicly.

### 2. Privacy Policy (`src/pages/Privacy.tsx`)
- **Section 3 (Information We Collect)**: Add bullet under 3.1: "Classroom Activity: Class enrollment data, assignment submissions, grades, and teacher-student relationships within the platform."
- **Section 5 (How We Use)**: Add bullet under 5.1: "Facilitate classroom features including class management, assignment distribution, and student progress tracking."
- **Section 6 (Data Sharing)**: Add note: "Teachers in your class can see your assignment submissions and performance data within the classroom context."

### 3. Refund Policy (`src/pages/Refund.tsx`)
- No major changes needed -- classroom features are part of the existing subscription tiers. Minor update to overview text to mention "classroom management tools" alongside study tools.

---

## Company Pages

### 4. About (`src/pages/About.tsx`)
- **Hero subtitle**: Update to mention "students and teachers" instead of just students.
- **Our Story section**: Add paragraph about expanding from student tools to classroom management, enabling teachers to create AI-powered assignments.
- **Mission section**: Update to include "democratize education for both students and educators."
- **CTA section**: Change "Join thousands of students" to "Join thousands of students and teachers."

### 5. Pricing (`src/pages/Pricing.tsx`)
- **Feature comparison table**: Add row for "Classroom Management" -- Free: "1 class", Pro: "5 classes", Ultra: "Unlimited classes".
- **Enterprise CTA**: Mention classroom/institutional deployment -- "Deploy AI-powered classrooms across your entire institution."

### 6. FAQ (`src/pages/FAQ.tsx`)
- Add 3 new FAQ entries:
  - "Can teachers use NewtonAI for classroom management?" -- Yes, teachers can create classes, invite students via codes, assign AI-generated quizzes/flashcards, and track progress.
  - "How do students join a class?" -- Students enter a 6-character invite code provided by their teacher at /join-class.
  - "Is student data in classrooms private?" -- Yes, only the class teacher can see submissions and performance. Data is encrypted and follows our privacy policy.

### 7. Contact (`src/pages/Contact.tsx`)
- **Common Reasons section**: Add a "Classroom & Teacher Support" card -- "Questions about setting up classes, managing students, or creating assignments? We're here to help teachers get started."

---

## Resources Pages

### 8. Features (`src/pages/Features.tsx`)
- Add a new feature entry for "Classroom Hub" with the `School` icon:
  - Title: "Classroom Hub"
  - Description: Explains class creation, invite codes, AI-generated assignments, student progress tracking, and analytics.
  - Link: `/teacher`
- Update the "Integration Benefits" section to add a 4th benefit: "For Teachers Too" -- manage classrooms and assign AI-generated work from one platform.

### 9. How It Works (`src/pages/HowItWorks.tsx`)
- Add a new section "For Teachers" after the 4-step process:
  - Step-by-step for teachers: Create Class -> Share Invite Code -> Assign AI-Generated Work -> Track Student Progress
- Update "Why Students Choose NewtonAI" to "Why Students & Teachers Choose NewtonAI" and add a card for teachers.

### 10. Guides (`src/pages/Guides.tsx`)
- Add a new guide card: "Getting Started as a Teacher on NewtonAI" -- slug: `teacher-getting-started`, icon: `GraduationCap`, category: "For Teachers", read time: "6 min read". (Link will be placeholder until the guide page is created.)

### 11. AI for Students (`src/pages/AIForStudents.tsx`)
- Add a section "AI for Teachers Too" near the bottom (before the CTA):
  - Brief mention that teachers can create classes, assign AI-generated quizzes and flashcards, and monitor student progress.
  - CTA link to `/teacher` -- "Explore Teacher Tools"
- Update the CTA to say "Join Thousands of Students & Teachers."

---

## Technical Details

### Files to Modify
| File | Key Changes |
|------|-------------|
| `src/pages/Terms.tsx` | Add classroom definitions, teacher accounts, acceptable use clauses |
| `src/pages/Privacy.tsx` | Add classroom data collection, teacher data sharing notes |
| `src/pages/Refund.tsx` | Minor mention of classroom tools in overview |
| `src/pages/About.tsx` | Update story, mission, and CTAs to include teachers |
| `src/pages/Pricing.tsx` | Add classroom row to feature table, update enterprise CTA |
| `src/pages/FAQ.tsx` | Add 3 classroom-related FAQs + update schema |
| `src/pages/Contact.tsx` | Add classroom support reason card |
| `src/pages/Features.tsx` | Add Classroom Hub feature entry + teacher benefit |
| `src/pages/HowItWorks.tsx` | Add "For Teachers" section with teacher workflow |
| `src/pages/Guides.tsx` | Add teacher guide card |
| `src/pages/AIForStudents.tsx` | Add "AI for Teachers Too" section |

### No new files needed
All updates fit within existing page components.

### Design consistency
- Teacher-related content uses the `School` or `GraduationCap` icons from lucide-react (already available)
- Follows existing section patterns: `SectionHeader` + content grid/prose
- Maintains the dark-mode-first aesthetic with `bg-primary/10` accent containers
- FAQ entries automatically included in the FAQPage structured data schema

