import { useState, useEffect } from "react";
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
import newtonCharacter from "@/assets/newton-character-sm.webp";

interface Tool {
  icon: LucideIcon;
  label: string;
  description: string;
  color: string;
  position: string;
  route: string;
}

const tools: Tool[] = [
  { icon: BookOpen, label: "Notes", description: "AI Lecture Notes", color: "bg-gradient-to-br from-teal-400 to-teal-600", position: "top-left", route: "/tools/lecture-notes" },
  { icon: Brain, label: "Quiz", description: "AI Quiz Generator", color: "bg-gradient-to-br from-purple-400 to-purple-600", position: "top-right", route: "/tools/quiz" },
  { icon: Layers, label: "Flashcards", description: "Smart Flashcards", color: "bg-gradient-to-br from-emerald-400 to-emerald-600", position: "left", route: "/tools/flashcards" },
  { icon: FileText, label: "PDF", description: "PDF Summarizer", color: "bg-gradient-to-br from-pink-400 to-pink-600", position: "right", route: "/tools/summarizer" },
  { icon: Sparkles, label: "Mind Map", description: "Visual Mind Maps", color: "bg-gradient-to-br from-fuchsia-400 to-fuchsia-600", position: "bottom-left", route: "/tools/mind-map" },
  { icon: FileQuestion, label: "Summary", description: "Content Summary", color: "bg-gradient-to-br from-amber-400 to-amber-600", position: "bottom", route: "/tools/summarizer" },
  { icon: Video, label: "Videos", description: "Video Summarizer", color: "bg-gradient-to-br from-blue-400 to-blue-600", position: "bottom-right", route: "/tools/summarizer" },
  { icon: Mic, label: "Podcast", description: "AI Podcast", color: "bg-gradient-to-br from-orange-400 to-orange-600", position: "top", route: "/tools/podcast" },
];

// Static position classes
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

interface FloatingToolsShowcaseProps {
  showCTA?: boolean;
}

const ToolBadge = ({ tool, isSelected, onSelect }: { tool: Tool; isSelected: boolean; onSelect: () => void }) => {
  const Icon = tool.icon;
  
  return (
    <div className={`absolute ${positionClasses[tool.position]} z-10`}>
      <button
        onClick={onSelect}
        className={`flex items-center gap-2.5 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-xl shadow-black/25 border transition-all duration-300 cursor-pointer group
          ${isSelected 
            ? 'bg-slate-700/90 border-primary/50 ring-2 ring-primary/30 scale-110' 
            : 'bg-slate-800/80 border-white/10 hover:border-white/20 hover:bg-slate-700/80 hover:scale-105'
          }`}
      >
        <div className={`w-8 h-8 rounded-xl ${tool.color} flex items-center justify-center shadow-lg transition-transform duration-200 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}>
          <Icon className="w-4 h-4 text-white drop-shadow-sm" />
        </div>
        <span className="text-sm font-semibold text-white whitespace-nowrap tracking-tight">
          {tool.label}
        </span>
      </button>
    </div>
  );
};

const FloatingToolsShowcase = ({ showCTA = true }: FloatingToolsShowcaseProps) => {
  const [selectedTool, setSelectedTool] = useState<number>(0);
  
  
  const currentTool = tools[selectedTool];
  const CurrentIcon = currentTool.icon;

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Main showcase container */}
      <div className="relative h-[380px] md:h-[440px]">
        {/* Static ambient glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Central Phone/App Mockup */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-72 md:w-56 md:h-80 rounded-[2.5rem] bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border border-slate-600/50 shadow-2xl shadow-black/50 overflow-hidden z-20">
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
              <div 
                className="flex items-center gap-2 bg-slate-800/80 rounded-xl px-3 py-2 mb-3 border border-primary/30"
              >
                <div className={`w-5 h-5 rounded-lg ${currentTool.color} flex items-center justify-center`}>
                  <CurrentIcon className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs text-white font-medium truncate">{currentTool.description}</span>
              </div>
              
              {/* Progress section */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Processing...</span>
                  <span className="text-[10px] text-primary font-semibold">
                    {Math.floor(60 + (selectedTool * 5) % 35)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${60 + (selectedTool * 5) % 35}%` }}
                  />
                </div>
              </div>
              
              {/* Tool indicator dots */}
              <div className="flex gap-1.5 mb-auto">
                {tools.slice(0, 4).map((_, i) => (
                  <div 
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      i === selectedTool % 4 ? 'bg-primary scale-125' : 'bg-primary/30'
                    }`}
                  />
                ))}
              </div>
              
              {/* Newton character at bottom - static image */}
              <div className="absolute bottom-3 right-3 w-14 h-14 md:w-[4.5rem] md:h-[4.5rem] rounded-full overflow-hidden ring-2 ring-primary/20">
                <img 
                  src={newtonCharacter} 
                  alt="Newton AI mascot" 
                  loading="eager"
                  fetchPriority="high"
                  width={72}
                  height={72}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          
          {/* Screen reflection/shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-[2.5rem]" />
        </div>

        {/* Static Tool Badges */}
        {tools.map((tool, index) => (
          <ToolBadge 
            key={tool.label} 
            tool={tool} 
            isSelected={selectedTool === index}
            onSelect={() => setSelectedTool(index)}
          />
        ))}
      </div>

      {/* Try it yourself CTA - conditionally rendered */}
      {showCTA && (
        <div className="flex flex-col items-center gap-3 mt-8 relative z-30">
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
          <p className="text-sm text-muted-foreground">
            Currently viewing: <span className="text-primary font-medium">{currentTool.description}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default FloatingToolsShowcase;