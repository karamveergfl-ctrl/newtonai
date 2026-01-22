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

interface Tool {
  icon: LucideIcon;
  label: string;
  color: string;
  position: string;
}

const tools: Tool[] = [
  { icon: BookOpen, label: "Notes", color: "bg-teal-500", position: "top-left" },
  { icon: Brain, label: "Quiz", color: "bg-purple-500", position: "top-right" },
  { icon: Layers, label: "Flashcards", color: "bg-emerald-500", position: "left" },
  { icon: FileText, label: "PDF", color: "bg-pink-500", position: "right" },
  { icon: Sparkles, label: "Mind Map", color: "bg-fuchsia-500", position: "bottom-left" },
  { icon: FileQuestion, label: "Summary", color: "bg-amber-500", position: "bottom" },
  { icon: Video, label: "Videos", color: "bg-blue-500", position: "bottom-right" },
  { icon: Mic, label: "Podcast", color: "bg-orange-500", position: "top" },
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

// Position classes for each tool
const positionClasses: Record<string, string> = {
  "top-left": "top-4 left-4 md:top-8 md:left-8",
  "top": "top-0 left-1/2 -translate-x-1/2",
  "top-right": "top-4 right-4 md:top-8 md:right-8",
  "left": "top-1/2 -translate-y-1/2 left-0 md:-left-4",
  "right": "top-1/2 -translate-y-1/2 right-0 md:-right-4",
  "bottom-left": "bottom-8 left-4 md:bottom-12 md:left-8",
  "bottom": "bottom-0 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-8 right-4 md:bottom-12 md:right-8",
};

const ToolBadge = ({ tool, index }: { tool: Tool; index: number }) => {
  const Icon = tool.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: 0.4 + index * 0.1
      }}
      className={`absolute ${positionClasses[tool.position]} z-10`}
    >
      <motion.div
        animate={{ 
          y: [0, -8, 0],
          x: tool.position.includes("left") ? [0, 4, 0] : tool.position.includes("right") ? [0, -4, 0] : [0, 0, 0]
        }}
        transition={{
          duration: floatDurations[tool.position] || 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: floatDelays[tool.position] || 0
        }}
        className="flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-slate-700/50 hover:scale-105 transition-transform cursor-default"
      >
        <div className={`w-6 h-6 rounded-lg ${tool.color} flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs md:text-sm font-medium text-white whitespace-nowrap">
          {tool.label}
        </span>
      </motion.div>
    </motion.div>
  );
};

export const FloatingToolsShowcase = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto h-80 md:h-96">
      {/* Central Phone/App Mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-64 md:w-52 md:h-80 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-slate-700 shadow-2xl overflow-hidden"
      >
        {/* Phone screen content */}
        <div className="absolute inset-2 rounded-2xl bg-slate-900 flex flex-col p-4">
          {/* Status bar dots */}
          <div className="flex gap-1.5 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-teal-400/60" />
          </div>
          
          {/* Mock content */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span className="text-xs text-white font-medium">Notes</span>
            </div>
            
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <div className="w-2 h-2 rounded-full bg-teal-500" />
            </div>
            
            <div className="h-6 bg-teal-500 rounded-lg" />
          </div>
          
          {/* Newton character placeholder */}
          <div className="absolute bottom-2 right-2 w-16 h-20 md:w-20 md:h-24">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full bg-gradient-to-b from-teal-400 to-teal-600 rounded-t-full rounded-b-lg flex flex-col items-center justify-start pt-2"
            >
              {/* Simple character face */}
              <div className="w-6 h-6 md:w-8 md:h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-slate-800 rounded-full" />
                  <div className="w-1 h-1 bg-slate-800 rounded-full" />
                </div>
              </div>
              {/* Helmet stripe */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-6 bg-white/30 rounded-full" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Floating Tool Badges */}
      {tools.map((tool, index) => (
        <ToolBadge key={tool.label} tool={tool} index={index} />
      ))}

      {/* Ambient glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-secondary/20 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
};

export default FloatingToolsShowcase;
