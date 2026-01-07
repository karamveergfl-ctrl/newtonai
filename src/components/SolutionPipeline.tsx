import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, 
  FileSearch, 
  Calculator, 
  Video, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PipelineStage = 'extracting' | 'structuring' | 'solving' | 'videos' | 'complete';

interface SolutionPipelineProps {
  currentStage: PipelineStage;
  className?: string;
}

const stages = [
  { id: 'extracting', label: 'Extract Text', description: 'OCR scanning image', icon: Scan },
  { id: 'structuring', label: 'Understand', description: 'Parsing problem', icon: FileSearch },
  { id: 'solving', label: 'Solve', description: 'Step-by-step solution', icon: Calculator },
  { id: 'videos', label: 'Find Videos', description: 'Related tutorials', icon: Video },
];

export function SolutionPipeline({ currentStage, className }: SolutionPipelineProps) {
  const currentIndex = stages.findIndex(s => s.id === currentStage);
  const isComplete = currentStage === 'complete';

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop horizontal pipeline */}
      <div className="hidden md:flex items-center justify-center gap-2">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = stage.id === currentStage;
          const isPast = currentIndex > index || isComplete;
          const isFuture = currentIndex < index && !isComplete;

          return (
            <div key={stage.id} className="flex items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div
                  className={cn(
                    "relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300",
                    isPast && "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                    isActive && "bg-primary/10 text-primary border-2 border-primary",
                    isFuture && "bg-muted text-muted-foreground"
                  )}
                >
                  {isPast ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                  
                  {/* Pulse effect for active stage */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-primary"
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>
                
                <span className={cn(
                  "mt-2 text-xs font-medium transition-colors",
                  isPast && "text-primary",
                  isActive && "text-primary",
                  isFuture && "text-muted-foreground"
                )}>
                  {stage.label}
                </span>
                
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-muted-foreground"
                  >
                    {stage.description}
                  </motion.span>
                )}
              </motion.div>

              {/* Connector arrow */}
              {index < stages.length - 1 && (
                <div className="mx-2 flex items-center">
                  <motion.div
                    className={cn(
                      "h-0.5 w-8 transition-colors duration-300",
                      currentIndex > index || isComplete ? "bg-primary" : "bg-muted"
                    )}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.1 + 0.05 }}
                  />
                  <ArrowRight className={cn(
                    "h-4 w-4 -ml-1 transition-colors duration-300",
                    currentIndex > index || isComplete ? "text-primary" : "text-muted"
                  )} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile vertical pipeline */}
      <div className="md:hidden flex flex-col items-start gap-3 px-4">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = stage.id === currentStage;
          const isPast = currentIndex > index || isComplete;
          const isFuture = currentIndex < index && !isComplete;

          return (
            <motion.div
              key={stage.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 w-full"
            >
              <div
                className={cn(
                  "relative w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                  isPast && "bg-primary text-primary-foreground",
                  isActive && "bg-primary/10 text-primary border-2 border-primary",
                  isFuture && "bg-muted text-muted-foreground"
                )}
              >
                {isPast ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-sm font-medium transition-colors block",
                  isPast && "text-primary",
                  isActive && "text-foreground",
                  isFuture && "text-muted-foreground"
                )}>
                  {stage.label}
                </span>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted-foreground"
                  >
                    {stage.description}...
                  </motion.span>
                )}
              </div>
              
              {/* Progress bar for active */}
              {isActive && (
                <motion.div 
                  className="h-1 flex-1 bg-muted rounded-full overflow-hidden max-w-[100px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Completion message */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 flex items-center justify-center gap-2 text-primary"
          >
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Solution Ready!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
