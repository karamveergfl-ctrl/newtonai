# QA Checklist: Student Home Button

Goal: confirm the sidebar **Home** button always lands a student on `/student/dashboard` (the Home view with video search, study progress, and upload/record).

## Manual steps

1. Sign in as a **student** account.
2. From `/student/dashboard`, confirm Home is highlighted in the sidebar.
3. Navigate to `/tools/quiz`, then click **Home** → URL becomes `/student/dashboard` and the Home view renders (no flash of the classes list).
4. Navigate to `/student/classes`, then click **Home** → URL becomes `/student/dashboard`.
5. Refresh `/student/dashboard` → page loads directly into the Home view.
6. Sign in as an **admin** account, switch to the Student dashboard via the sidebar toggle, click **Home** → URL becomes `/student/dashboard`.
7. Sign in as a **teacher** account, click **Home** → URL becomes `/dashboard` (teachers keep the default Home route).

## Automated coverage

- `src/test/studentHomeButton.test.tsx` — asserts the sidebar Home button navigates students to `/student/dashboard`.
- `src/test/studentDashboardRoute.test.ts` — asserts the `/student/dashboard` route renders the `Dashboard` component.