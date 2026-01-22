import { motion } from "framer-motion";
import { 
  BookOpen, 
  Brain, 
  FileText, 
  Video, 
  Sparkles,
  Mic,
  Layers,
  FileQuestion,
  LucideIcon
} from "lucide-react";
import LottieNewton from "@/components/newton/LottieNewton";

interface Tool {
  icon: LucideIcon;
  label: string;
  color: string;
  shadowColor: string;
  position: string;
}

const tools: Tool[] = [
  { icon: BookOpen, label: "Notes", color: "bg-gradient-to-br from-teal-400 to-teal-600", shadowColor: "teal", position: "top-left" },
  { icon: Brain, label: "Quiz", color: "bg-gradient-to-br from-purple-400 to-purple-600", shadowColor: "purple", position: "top-right" },
  { icon: Layers, label: "Flashcards", color: "bg-gradient-to-br from-emerald-400 to-emerald-600", shadowColor: "emerald", position: "left" },
  { icon: FileText, label: "PDF", color: "bg-gradient-to-br from-pink-400 to-pink-600", shadowColor: "pink", position: "right" },
  { icon: Sparkles, label: "Mind Map", color: "bg-gradient-to-br from-fuchsia-400 to-fuchsia-600", shadowColor: "fuchsia", position: "bottom-left" },
  { icon: FileQuestion, label: "Summary", color: "bg-gradient-to-br from-amber-400 to-amber-600", shadowColor: "amber", position: "bottom" },
  { icon: Video, label: "Videos", color: "bg-gradient-to-br from-blue-400 to-blue-600", shadowColor: "blue", position: "bottom-right" },
  { icon: Mic, label: "Podcast", color: "bg-gradient-to-br from-orange-400 to-orange-600", shadowColor: "orange", position: "top" },
];

// Animation delays for staggered float effect
const floatDelays: Record<string, number> = {
  "top-left": 0,
  "top": 0.5,
  "top-right": 0.3,
  "left": 0.7,
  "right": 0.2,
  "bottom-left": 0.4,
  "bottom": 0.6,
  "bottom-right": 0.8,
};

const floatDurations: Record<string, number> = {
  "top-left": 4,
  "top": 3.5,
  "top-right": 4.2,
  "left": 3.8,
  "right": 4.5,
  "bottom-left": 4.3,
  "bottom": 3.6,
  "bottom-right": 4.1,
};

// Improved position classes with better spacing - no overlaps
const positionClasses: Record<string, string> = {
  "top-left": "-top-2 -left-2 md:top-2 md:-left-8",
  "top": "-top-8 left-1/2 -translate-x-1/2",
  "top-right": "-top-2 -right-2 md:top-2 md:-right-8",
  "left": "top-[35%] -translate-y-1/2 -left-4 md:-left-20",
  "right": "top-[35%] -translate-y-1/2 -right-4 md:-right-20",
  "bottom-left": "bottom-[25%] -left-2 md:-left-14",
  "bottom": "-bottom-10 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-[25%] -right-2 md:-right-14",
};

const ToolBadge = ({ tool, index }: { tool: Tool; index: number }) => {
  const Icon = tool.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: 0.5 + index * 0.1,
        type: "spring",
        stiffness: 200
      }}
      className={`absolute ${positionClasses[tool.position]} z-10`}
    >
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          x: tool.position.includes("left") ? [0, 5, 0] : tool.position.includes("right") ? [0, -5, 0] : [0, 0, 0]
        }}
        transition={{
          duration: floatDurations[tool.position] || 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: floatDelays[tool.position] || 0
        }}
        className="flex items-center gap-2.5 bg-slate-800/80 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-xl shadow-black/25 border border-white/10 hover:border-white/20 hover:bg-slate-700/80 transition-all duration-300 cursor-default group"
      >
        <div className={`w-8 h-8 rounded-xl ${tool.color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-4 h-4 text-white drop-shadow-sm" />
        </div>
        <span className="text-sm font-semibold text-white whitespace-nowrap tracking-tight">
          {tool.label}
        </span>
      </motion.div>
    </motion.div>
  );
};

export const FloatingToolsShowcase = () => {
  return (
    <div className="relative w-full max-w-xl mx-auto h-[360px] md:h-[420px]">
      {/* Layered ambient glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Central Phone/App Mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, type: "spring", stiffness: 100 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-72 md:w-56 md:h-80 rounded-[2.5rem] bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border border-slate-600/50 shadow-2xl shadow-black/50 overflow-hidden"
      >
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-full z-20" />
        
        {/* Inner bezel with screen content */}
        <div className="absolute inset-[3px] rounded-[2.3rem] bg-slate-900 overflow-hidden">
          <div className="absolute inset-3 flex flex-col pt-6">
            {/* App header with logo */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-white tracking-tight">Newton AI</span>
            </div>
            
            {/* Active tool indicator */}
            <div className="flex items-center gap-2 bg-slate-800/80 rounded-xl px-3 py-2 mb-3 border border-primary/30">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs text-white font-medium">Lecture Notes</span>
            </div>
            
            {/* Progress section */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Processing...</span>
                <span className="text-[10px] text-primary font-semibold">75%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary to-teal-400 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "75%" }}
                  transition={{ duration: 2, delay: 1, ease: "easeOut" }}
                />
              </div>
            </div>
            
            {/* Status dots */}
            <div className="flex gap-1.5 mb-auto">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-primary/60" />
              <div className="w-2 h-2 rounded-full bg-primary/30" />
            </div>
            
            {/* Newton character at bottom */}
            <div className="absolute bottom-3 right-3 w-16 h-20 md:w-20 md:h-24">
              <LottieNewton state="thinking" size="sm" />
            </div>
          </div>
        </div>
        
        {/* Screen reflection/shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-[2.5rem]" />
      </motion.div>

      {/* Floating Tool Badges */}
      {tools.map((tool, index) => (
        <ToolBadge key={tool.label} tool={tool} index={index} />
      ))}
    </div>
  );
};

export default FloatingToolsShowcase;
