import { 
  Lock, 
  Zap, 
  LayoutGrid, 
  Lightbulb, 
  MessageCircle,
  Mic,
  Timer,
  PenTool,
  AudioWaveform,
  FileText,
  FileCheck,
  Youtube,
  Image,
  CreditCard,
  Target,
  HelpCircle,
  CheckCircle,
  Headphones,
  Radio
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  icon: React.ElementType;
  label: string;
  colorClass: string;
  bgClass: string;
}

interface FeatureCategory {
  title: string;
  features: Feature[];
}

const featureCategories: FeatureCategory[] = [
  {
    title: "Homework Help",
    features: [
      { icon: Zap, label: "Step-by-step explanations", colorClass: "text-yellow-500", bgClass: "bg-yellow-500/10" },
      { icon: LayoutGrid, label: "85M+ question bank", colorClass: "text-blue-500", bgClass: "bg-blue-500/10" },
      { icon: Lightbulb, label: "All subject support", colorClass: "text-orange-500", bgClass: "bg-orange-500/10" },
      { icon: MessageCircle, label: "24/7 availability", colorClass: "text-teal-500", bgClass: "bg-teal-500/10" },
    ]
  },
  {
    title: "Live Transcription",
    features: [
      { icon: Mic, label: "Real-time class notes", colorClass: "text-purple-500", bgClass: "bg-purple-500/10" },
      { icon: Timer, label: "Perfect for long lectures", colorClass: "text-pink-500", bgClass: "bg-pink-500/10" },
      { icon: PenTool, label: "Notes without typing", colorClass: "text-pink-400", bgClass: "bg-pink-400/10" },
      { icon: AudioWaveform, label: "Never miss a word", colorClass: "text-cyan-500", bgClass: "bg-cyan-500/10" },
    ]
  },
  {
    title: "AI Lecture Notes",
    features: [
      { icon: FileText, label: "Live lecture notes", colorClass: "text-orange-400", bgClass: "bg-orange-400/10" },
      { icon: FileCheck, label: "PDF document summary", colorClass: "text-pink-500", bgClass: "bg-pink-500/10" },
      { icon: Youtube, label: "YouTube video summary", colorClass: "text-purple-400", bgClass: "bg-purple-400/10" },
      { icon: Image, label: "Image-to-text notes", colorClass: "text-green-500", bgClass: "bg-green-500/10" },
    ]
  },
  {
    title: "AI Flashcards",
    features: [
      { icon: CreditCard, label: "Vocabulary memorization cards", colorClass: "text-purple-500", bgClass: "bg-purple-500/10" },
      { icon: Target, label: "Concept definition cards", colorClass: "text-pink-500", bgClass: "bg-pink-500/10" },
    ]
  },
  {
    title: "AI Quiz",
    features: [
      { icon: HelpCircle, label: "Auto-generated questions", colorClass: "text-blue-500", bgClass: "bg-blue-500/10" },
      { icon: CheckCircle, label: "Instant feedback", colorClass: "text-green-500", bgClass: "bg-green-500/10" },
    ]
  },
  {
    title: "AI Podcast",
    features: [
      { icon: Headphones, label: "Listen while you learn", colorClass: "text-purple-500", bgClass: "bg-purple-500/10" },
      { icon: Radio, label: "Convert notes to audio", colorClass: "text-pink-500", bgClass: "bg-pink-500/10" },
    ]
  },
];

interface FeatureShowcaseProps {
  compact?: boolean;
  className?: string;
}

export function FeatureShowcase({ compact = false, className }: FeatureShowcaseProps) {
  const displayCategories = compact ? featureCategories.slice(0, 2) : featureCategories;

  return (
    <div className={cn(
      "relative rounded-xl overflow-hidden",
      className
    )}>
      {/* Gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 rounded-xl" />
      
      {/* Inner content */}
      <div className="relative m-[1px] bg-card/95 backdrop-blur-sm rounded-xl p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base text-foreground">Unlock all features</h3>
        </div>

        {/* Feature categories */}
        <div className="space-y-3 sm:space-y-4">
          {displayCategories.map((category) => (
            <div key={category.title}>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                {category.title}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                {category.features.map((feature, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0",
                      feature.bgClass
                    )}>
                      <feature.icon className={cn("w-3.5 h-3.5", feature.colorClass)} />
                    </div>
                    <span className="text-xs text-muted-foreground leading-tight">
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {compact && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            + AI Quiz, Mind Maps, Podcasts & more
          </p>
        )}
      </div>
    </div>
  );
}
