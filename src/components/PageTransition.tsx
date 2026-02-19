import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="min-h-screen animate-in fade-in duration-200">
      {children}
    </div>
  );
}
