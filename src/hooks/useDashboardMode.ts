import { useCallback, useEffect, useState } from "react";

export type DashboardMode = "teacher" | "student";

const KEY = "newtonai_dashboard_mode";

export function getDashboardMode(): DashboardMode | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "teacher" || v === "student" ? v : null;
}

export function setDashboardMode(mode: DashboardMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, mode);
  window.dispatchEvent(new CustomEvent("newtonai:dashboard-mode", { detail: mode }));
}

/**
 * Frontend-only preference letting admin accounts pick which dashboard
 * they are actively using (teacher vs student). Home navigation and the
 * onboarding gate consult this so admins don't get bounced back to the
 * teacher dashboard after switching to student view.
 */
export function useDashboardMode() {
  const [mode, setMode] = useState<DashboardMode | null>(() => getDashboardMode());

  useEffect(() => {
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as DashboardMode | undefined;
      if (detail === "teacher" || detail === "student") setMode(detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        const v = e.newValue;
        setMode(v === "teacher" || v === "student" ? v : null);
      }
    };
    window.addEventListener("newtonai:dashboard-mode", onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("newtonai:dashboard-mode", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback((next: DashboardMode) => {
    setDashboardMode(next);
    setMode(next);
  }, []);

  return { mode, setMode: update };
}