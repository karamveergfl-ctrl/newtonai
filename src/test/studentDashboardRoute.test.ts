import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * Guards against regression of the /student/dashboard route:
 * the student "Home" must render the main Dashboard (Index),
 * NOT the legacy StudentDashboard (which flashes a classes view).
 */
describe("/student/dashboard route", () => {
  const appSrc = readFileSync(
    path.resolve(__dirname, "../App.tsx"),
    "utf-8"
  );

  it("renders the main <Dashboard /> component", () => {
    const routeMatch = appSrc.match(
      /path="\/student\/dashboard"[\s\S]*?element=\{([\s\S]*?)\}\s*\/>/
    );
    expect(routeMatch, "/student/dashboard route not found").toBeTruthy();
    const element = routeMatch![1];
    expect(element).toContain("<Dashboard />");
    expect(element).not.toContain("<StudentDashboard />");
  });
});