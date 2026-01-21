import { useState, useEffect } from "react";
import { X, Upload, Search, Sparkles, BookOpen, Brain, FileText, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const WELCOME_STORAGE_KEY = "newton-ai-welcome-seen";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  description: string;
  action: () => void;
  color: string;
}

interface WelcomeModalProps {
  onUploadClick?: () => void;
  onRecordClick?: () => void;
}

export function WelcomeModal({ onUploadClick, onRecordClick }: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(WELCOME_STORAGE_KEY);
    
    // Show welcome modal for first-time users
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(WELCOME_STORAGE_KEY, "true");
  };

  const handleQuickAction = (action?: () => void) => {
    handleClose();
    action?.();
  };

  const features = [
    { icon: <FileText className="w-4 h-4" />, text: "Upload PDFs & Images" },
    { icon: <Search className="w-4 h-4" />, text: "Find Video Tutorials" },
    { icon: <Brain className="w-4 h-4" />, text: "AI Problem Solving" },
    { icon: <BookOpen className="w-4 h-4" />, text: "Generate Study Materials" },
  ];

  const quickActions: QuickAction[] = [
    {
      icon: <Upload className="w-5 h-5" />,
      label: "Upload Document",
      description: "PDF, images, or screenshots",
      action: () => onUploadClick?.(),
      color: "from-blue-500/20 to-blue-600/10",
    },
    {
      icon: <Mic className="w-5 h-5" />,
      label: "Record Lecture",
      description: "Capture and transcribe audio",
      action: () => onRecordClick?.(),
      color: "from-purple-500/20 to-purple-600/10",
    },
    {
      icon: <Search className="w-5 h-5" />,
      label: "Search Topics",
      description: "Find educational videos",
      action: () => {},
      color: "from-emerald-500/20 to-emerald-600/10",
    },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="w-full max-w-lg bg-gradient-to-br from-card via-card to-card/95 border border-border/50 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-6 py-8 text-center overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                </div>
                
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-background/50"
                  onClick={handleClose}
                >
                  <X className="w-4 h-4" />
                </Button>

                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", damping: 15 }}
                  className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 mb-4"
                >
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="relative text-xl font-bold text-foreground mb-2"
                >
                  Welcome to Newton AI! 🎉
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative text-sm text-muted-foreground"
                >
                  Your AI-powered study companion is ready
                </motion.p>
              </div>

              {/* Features list */}
              <div className="px-6 py-4 border-b border-border/30">
                <div className="grid grid-cols-2 gap-2">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + index * 0.05 }}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                        {feature.icon}
                      </div>
                      <span>{feature.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-6">
                <h3 className="text-sm font-medium text-foreground mb-3">Get Started</h3>
                <div className="space-y-2">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + index * 0.05 }}
                      onClick={() => handleQuickAction(action.action)}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r ${action.color} border border-border/30 hover:border-primary/30 transition-all duration-200 group text-left`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground">
                          {action.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-muted/20 border-t border-border/30 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Esc</kbd> to close
                </p>
                <Button
                  size="sm"
                  onClick={handleClose}
                  className="h-8 text-xs"
                >
                  Start Exploring
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
