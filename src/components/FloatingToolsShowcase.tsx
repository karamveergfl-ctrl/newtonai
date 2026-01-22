import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Brain, 
  FileText, 
  Video, 
  Sparkles,
  Mic,
  Layers,
  FileQuestion,
  LucideIcon,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LottieNewton from "@/components/newton/LottieNewton";

interface Tool {
  icon: LucideIcon;
  label: string;
  description: string;
  color: string;
  shadowColor: string;
  position: string;
  parallaxSpeed: number;
  route: string;
}

const tools: Tool[] = [
  { icon: BookOpen, label: "Notes", description: "AI Lecture Notes", color: "bg-gradient-to-br from-teal-400 to-teal-600", shadowColor: "teal", position: "top-left", parallaxSpeed: 0.15, route: "/tools/lecture-notes" },
  { icon: Brain, label: "Quiz", description: "AI Quiz Generator", color: "bg-gradient-to-br from-purple-400 to-purple-600", shadowColor: "purple", position: "top-right", parallaxSpeed: 0.2, route: "/tools/quiz" },
  { icon: Layers, label: "Flashcards", description: "Smart Flashcards", color: "bg-gradient-to-br from-emerald-400 to-emerald-600", shadowColor: "emerald", position: "left", parallaxSpeed: 0.1, route: "/tools/flashcards" },
  { icon: FileText, label: "PDF", description: "PDF Summarizer", color: "bg-gradient-to-br from-pink-400 to-pink-600", shadowColor: "pink", position: "right", parallaxSpeed: 0.12, route: "/tools/summarizer" },
  { icon: Sparkles, label: "Mind Map", description: "Visual Mind Maps", color: "bg-gradient-to-br from-fuchsia-400 to-fuchsia-600", shadowColor: "fuchsia", position: "bottom-left", parallaxSpeed: 0.18, route: "/tools/mind-map" },
  { icon: FileQuestion, label: "Summary", description: "Content Summary", color: "bg-gradient-to-br from-amber-400 to-amber-600", shadowColor: "amber", position: "bottom", parallaxSpeed: 0.08, route: "/tools/summarizer" },
  { icon: Video, label: "Videos", description: "Video Summarizer", color: "bg-gradient-to-br from-blue-400 to-blue-600", shadowColor: "blue", position: "bottom-right", parallaxSpeed: 0.22, route: "/tools/summarizer" },
  { icon: Mic, label: "Podcast", description: "AI Podcast", color: "bg-gradient-to-br from-orange-400 to-orange-600", shadowColor: "orange", position: "top", parallaxSpeed: 0.14, route: "/tools/podcast" },
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

interface FloatingToolsShowcaseProps {
  showCTA?: boolean;
}

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

// Improved position classes with better spacing
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

// Connection line endpoints (relative to container center)
const lineEndpoints: Record<string, { x: number; y: number }> = {
  "top-left": { x: -120, y: -100 },
  "top": { x: 0, y: -140 },
  "top-right": { x: 120, y: -100 },
  "left": { x: -160, y: -30 },
  "right": { x: 160, y: -30 },
  "bottom-left": { x: -110, y: 80 },
  "bottom": { x: 0, y: 130 },
  "bottom-right": { x: 110, y: 80 },
};

interface ToolBadgeProps {
  tool: Tool;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  scrollY: any;
}

const ToolBadge = ({ tool, index, isSelected, onSelect, scrollY }: ToolBadgeProps) => {
  const Icon = tool.icon;
  
  // Parallax transform based on scroll
  const y = useTransform(scrollY, [0, 500], [0, tool.parallaxSpeed * 100]);
  const x = useTransform(
    scrollY, 
    [0, 500], 
    [0, tool.position.includes("left") ? -tool.parallaxSpeed * 30 : tool.position.includes("right") ? tool.parallaxSpeed * 30 : 0]
  );
  
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
      style={{ y, x }}
      className={`absolute ${positionClasses[tool.position]} z-10`}
    >
      <motion.button
        onClick={onSelect}
        animate={{ 
          y: [0, -10, 0],
          x: tool.position.includes("left") ? [0, 5, 0] : tool.position.includes("right") ? [0, -5, 0] : [0, 0, 0],
          scale: isSelected ? 1.1 : 1
        }}
        transition={{
          y: {
            duration: floatDurations[tool.position] || 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: floatDelays[tool.position] || 0
          },
          x: {
            duration: floatDurations[tool.position] || 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: floatDelays[tool.position] || 0
          },
          scale: { duration: 0.2 }
        }}
        className={`flex items-center gap-2.5 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-xl shadow-black/25 border transition-all duration-300 cursor-pointer group
          ${isSelected 
            ? 'bg-slate-700/90 border-primary/50 ring-2 ring-primary/30' 
            : 'bg-slate-800/80 border-white/10 hover:border-white/20 hover:bg-slate-700/80'
          }`}
      >
        <div className={`w-8 h-8 rounded-xl ${tool.color} flex items-center justify-center shadow-lg transition-transform duration-200 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}>
          <Icon className="w-4 h-4 text-white drop-shadow-sm" />
        </div>
        <span className="text-sm font-semibold text-white whitespace-nowrap tracking-tight">
          {tool.label}
        </span>
      </motion.button>
    </motion.div>
  );
};

// Animated connection line component
const ConnectionLine = ({ 
  position, 
  isActive, 
  delay 
}: { 
  position: string; 
  isActive: boolean;
  delay: number;
}) => {
  const endpoint = lineEndpoints[position];
  if (!endpoint) return null;
  
  // Calculate control point for curved line
  const controlX = endpoint.x * 0.3;
  const controlY = endpoint.y * 0.3;
  
  const pathD = `M 0 0 Q ${controlX} ${controlY} ${endpoint.x} ${endpoint.y}`;
  
  return (
    <motion.path
      d={pathD}
      stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
      strokeWidth={isActive ? 2 : 1}
      strokeDasharray="6 6"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ 
        pathLength: 1, 
        opacity: isActive ? 0.6 : 0.2,
        strokeDashoffset: [0, -24]
      }}
      transition={{
        pathLength: { duration: 1, delay: delay + 0.5 },
        opacity: { duration: 0.3 },
        strokeDashoffset: { 
          duration: 2, 
          repeat: Infinity, 
          ease: "linear" 
        }
      }}
    />
  );
};

const FloatingToolsShowcase = ({ showCTA = true }: FloatingToolsShowcaseProps) => {
  const [selectedTool, setSelectedTool] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  
  // Auto-rotate through tools
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedTool((prev) => (prev + 1) % tools.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  const currentTool = tools[selectedTool];
  const CurrentIcon = currentTool.icon;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      {/* Main showcase container */}
      <div className="relative h-[380px] md:h-[440px]">
        {/* Layered ambient glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* SVG Connection Lines */}
        <svg 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none overflow-visible"
          style={{ width: '400px', height: '400px' }}
        >
          <g transform="translate(200, 200)">
            {tools.map((tool, index) => (
              <ConnectionLine 
                key={tool.position}
                position={tool.position}
                isActive={selectedTool === index}
                delay={index * 0.1}
              />
            ))}
          </g>
        </svg>

        {/* Central Phone/App Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, type: "spring", stiffness: 100 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-72 md:w-56 md:h-80 rounded-[2.5rem] bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border border-slate-600/50 shadow-2xl shadow-black/50 overflow-hidden z-20"
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
              
              {/* Dynamic active tool indicator */}
              <motion.div 
                key={selectedTool}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 bg-slate-800/80 rounded-xl px-3 py-2 mb-3 border border-primary/30"
              >
                <div className={`w-5 h-5 rounded-lg ${currentTool.color} flex items-center justify-center`}>
                  <CurrentIcon className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs text-white font-medium truncate">{currentTool.description}</span>
              </motion.div>
              
              {/* Progress section */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Processing...</span>
                  <motion.span 
                    key={selectedTool}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] text-primary font-semibold"
                  >
                    {Math.floor(60 + Math.random() * 35)}%
                  </motion.span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div 
                    key={selectedTool}
                    className="h-full bg-gradient-to-r from-primary to-teal-400 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${60 + Math.random() * 35}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </div>
              
              {/* Tool indicator dots */}
              <div className="flex gap-1.5 mb-auto">
                {tools.slice(0, 4).map((_, i) => (
                  <motion.div 
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      i === selectedTool % 4 ? 'bg-primary' : 'bg-primary/30'
                    }`}
                    animate={i === selectedTool % 4 ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  />
                ))}
              </div>
              
              {/* Newton character at bottom - using writing state (no lightbulb overlay) */}
              <div className="absolute bottom-3 right-3 w-16 h-20 md:w-20 md:h-24">
                <LottieNewton state="writing" size="sm" />
              </div>
            </div>
          </div>
          
          {/* Screen reflection/shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-[2.5rem]" />
        </motion.div>

        {/* Floating Tool Badges */}
        {tools.map((tool, index) => (
          <ToolBadge 
            key={tool.label} 
            tool={tool} 
            index={index}
            isSelected={selectedTool === index}
            onSelect={() => setSelectedTool(index)}
            scrollY={scrollY}
          />
        ))}
      </div>

      {/* Try it yourself CTA - conditionally rendered */}
      {showCTA && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="flex flex-col items-center gap-3 mt-8 relative z-30"
        >
          <p className="text-sm text-muted-foreground">
            Currently viewing: <span className="text-primary font-medium">{currentTool.description}</span>
          </p>
          <Button 
            asChild 
            size="lg" 
            className="group shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
          >
            <Link to={currentTool.route}>
              Try {currentTool.label} Now
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default FloatingToolsShowcase;
