import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Guards the sidebar Home button and admin dashboard switch so:
 *  - Students always land on /student/dashboard.
 *  - Teachers keep /teacher (or /dashboard) as Home.
 *  - Admins who flipped to student view stay on /student/dashboard.
 */
describe("Sidebar Home button + admin dashboard switch", () => {
  const sidebar = readFileSync(
    resolve(__dirname, "../components/AppSidebar.tsx"),
    "utf-8"
  );
  const gate = readFileSync(
    resolve(__dirname, "../components/OnboardingGate.tsx"),
    "utf-8"
  );

  it("computes a role+mode aware Home path", () => {
    expect(sidebar).toContain("const homePath = isAdmin");
    expect(sidebar).toContain('"/student/dashboard"');
  });

  it("Home button navigates to the resolved homePath", () => {
    expect(sidebar).toContain("navigate(homePath)");
    expect(sidebar).toContain("isActive(homePath)");
  });

  it("admin switch button persists the chosen dashboard mode before navigating", () => {
    expect(sidebar).toContain("setDashboardMode(nextMode)");
    expect(sidebar).toContain("Switch to Student");
    expect(sidebar).toContain("Switch to Teacher");
  });

  it("OnboardingGate keeps admins on /student/dashboard when in student view", () => {
    expect(gate).toContain('navigate("/student/dashboard"');
    expect(gate).toContain('dashboardMode === "student"');
  });
});