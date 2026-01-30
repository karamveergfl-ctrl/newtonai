import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface StudyContextType {
  isInDeepStudy: boolean;
  setDeepStudy: (active: boolean) => void;
}

const StudyContext = createContext<StudyContextType>({
  isInDeepStudy: false,
  setDeepStudy: () => {},
});

export function StudyProvider({ children }: { children: ReactNode }) {
  const [isInDeepStudy, setIsInDeepStudy] = useState(false);

  const setDeepStudy = useCallback((active: boolean) => {
    setIsInDeepStudy(active);
  }, []);

  return (
    <StudyContext.Provider value={{ isInDeepStudy, setDeepStudy }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudyContext() {
  return useContext(StudyContext);
}
