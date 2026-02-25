import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ClassroomTheme = "classroom-light" | "classroom-dark";

interface ClassroomThemeContextValue {
  theme: ClassroomTheme;
  toggleTheme: () => void;
}

const ClassroomThemeContext = createContext<ClassroomThemeContextValue | null>(null);

export function useClassroomTheme() {
  const ctx = useContext(ClassroomThemeContext);
  if (!ctx) throw new Error("useClassroomTheme must be used within ClassroomThemeProvider");
  return ctx;
}

interface ClassroomThemeProviderProps {
  children: ReactNode;
}

export function ClassroomThemeProvider({ children }: ClassroomThemeProviderProps) {
  const [theme, setTheme] = useState<ClassroomTheme>(() => {
    const saved = localStorage.getItem("newton_classroom_theme");
    return (saved === "classroom-light" || saved === "classroom-dark") ? saved : "classroom-dark";
  });

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "classroom-dark" ? "classroom-light" : "classroom-dark";
      localStorage.setItem("newton_classroom_theme", next);
      return next;
    });
  }, []);

  return (
    <ClassroomThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme}>
        {children}
      </div>
    </ClassroomThemeContext.Provider>
  );
}
