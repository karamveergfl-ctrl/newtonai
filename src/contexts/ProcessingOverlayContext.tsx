import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ProcessingOverlayState {
  isVisible: boolean;
  message: string;
  subMessage?: string;
  progress: number;
  isIndeterminate: boolean;
  canCancel: boolean;
  onCancel?: () => void;
  variant: "overlay" | "card" | "inline";
}

interface ProcessingOverlayContextType {
  state: ProcessingOverlayState;
  showProcessing: (options: {
    message?: string;
    subMessage?: string;
    variant?: "overlay" | "card" | "inline";
    canCancel?: boolean;
    onCancel?: () => void;
  }) => void;
  hideProcessing: () => void;
  updateProgress: (progress: number, isIndeterminate?: boolean) => void;
  updateMessage: (message: string, subMessage?: string) => void;
}

const defaultState: ProcessingOverlayState = {
  isVisible: false,
  message: "Newton is working...",
  subMessage: undefined,
  progress: 0,
  isIndeterminate: true,
  canCancel: false,
  onCancel: undefined,
  variant: "overlay",
};

const ProcessingOverlayContext = createContext<ProcessingOverlayContextType | null>(null);

export function ProcessingOverlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProcessingOverlayState>(defaultState);

  const showProcessing = useCallback((options: {
    message?: string;
    subMessage?: string;
    variant?: "overlay" | "card" | "inline";
    canCancel?: boolean;
    onCancel?: () => void;
  }) => {
    setState({
      isVisible: true,
      message: options.message || "Newton is working...",
      subMessage: options.subMessage,
      progress: 0,
      isIndeterminate: true,
      canCancel: options.canCancel || false,
      onCancel: options.onCancel,
      variant: options.variant || "overlay",
    });
  }, []);

  const hideProcessing = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: false,
      progress: 100,
    }));
  }, []);

  const updateProgress = useCallback((progress: number, isIndeterminate?: boolean) => {
    setState(prev => ({
      ...prev,
      progress,
      isIndeterminate: isIndeterminate ?? (progress === 0),
    }));
  }, []);

  const updateMessage = useCallback((message: string, subMessage?: string) => {
    setState(prev => ({
      ...prev,
      message,
      subMessage,
    }));
  }, []);

  return (
    <ProcessingOverlayContext.Provider value={{ state, showProcessing, hideProcessing, updateProgress, updateMessage }}>
      {children}
    </ProcessingOverlayContext.Provider>
  );
}

export function useProcessingOverlay() {
  const context = useContext(ProcessingOverlayContext);
  if (!context) {
    throw new Error("useProcessingOverlay must be used within a ProcessingOverlayProvider");
  }
  return context;
}

export { ProcessingOverlayContext };
