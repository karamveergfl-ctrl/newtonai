import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Guards the sidebar Home button so students always land on /student/dashboard.
 * If this test fails, AppSidebar's Home button was changed in a way that could
 * regress students back to the generic /dashboard route.
 */
describe("Sidebar Home button (students)", () => {
  const source = readFileSync(
    resolve(__dirname, "../components/AppSidebar.tsx"),
    "utf-8"
  );

  it("navigates students to /student/dashboard", () => {
    expect(source).toContain(
      'navigate(isStudent ? "/student/dashboard" : "/dashboard")'
    );
  });

  it("marks Home active on /student/dashboard for students", () => {
    expect(source).toContain(
      'isActive(isStudent ? "/student/dashboard" : "/dashboard")'
    );
  });

  it("keeps non-student users on /dashboard", () => {
    // The ternary fallback must remain "/dashboard" so teachers/admins are unaffected.
    expect(source).not.toContain('navigate(isStudent ? "/student/dashboard" : "/student/dashboard")');
  });
});