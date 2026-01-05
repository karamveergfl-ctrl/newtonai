import { BookOpen, List, HelpCircle, Lightbulb, FileText, MessageSquare, ClipboardList } from "lucide-react";

// NotebookLM Color Palette
export const nlmColors = {
  blue: "#4285F4",
  green: "#34A853",
  yellow: "#FBBC04",
  red: "#EA4335",
  purple: "#9334E9",
  cyan: "#00ACC1",
};

// Mind Map Theme following NotebookLM style
export const notebookLMTheme = {
  name: "NotebookLM",
  colors: [nlmColors.blue, nlmColors.green, nlmColors.yellow, nlmColors.red, nlmColors.purple, nlmColors.cyan],
  bgGradient: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)",
};

// Section icons for study guide
export const sectionIcons = {
  overview: BookOpen,
  keyTopics: List,
  keyTerms: ClipboardList,
  quickReview: HelpCircle,
  essayPrompts: MessageSquare,
  takeaways: Lightbulb,
  summary: FileText,
};

// Typography classes
export const typography = {
  heading1: "font-display text-2xl font-bold tracking-tight",
  heading2: "font-display text-xl font-semibold tracking-tight",
  heading3: "font-display text-lg font-medium",
  body: "font-sans text-base leading-relaxed",
  small: "font-sans text-sm",
  caption: "font-sans text-xs text-muted-foreground",
};

// Card styles for study sections
export const cardStyles = {
  section: "bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4",
  sectionHeader: "flex items-center gap-3 mb-4 pb-3 border-b border-gray-100",
  sectionIcon: "w-8 h-8 rounded-lg flex items-center justify-center",
  sectionTitle: "font-display font-semibold text-lg",
};

// Mind map node styles
export const mindMapNodeStyles = {
  central: "px-8 py-4 rounded-2xl font-display font-bold text-lg text-white shadow-lg border-2 border-white/20",
  branch: "px-4 py-2 rounded-xl font-medium text-sm text-white shadow-md border border-white/10 cursor-pointer hover:scale-105 transition-transform duration-200",
  leaf: "px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200",
  connector: "transition-all duration-300",
};

// Animation presets
export const animations = {
  fadeIn: "animate-in fade-in duration-300",
  slideUp: "animate-in slide-in-from-bottom-4 duration-300",
  scaleIn: "animate-in zoom-in-95 duration-200",
};

// Study section component
export interface StudySection {
  type: "overview" | "keyTopics" | "keyTerms" | "quickReview" | "essayPrompts" | "takeaways";
  title: string;
  content: string;
  iconColor: string;
}

// Parse summary content into structured sections
export const parseSummaryContent = (content: string): StudySection[] => {
  const sections: StudySection[] = [];
  
  // Define section patterns
  const sectionPatterns = [
    { regex: /##?\s*Overview\s*\n([\s\S]*?)(?=##|$)/i, type: "overview" as const, title: "Overview", color: nlmColors.blue },
    { regex: /##?\s*Key\s*Topics?\s*\n([\s\S]*?)(?=##|$)/i, type: "keyTopics" as const, title: "Key Topics", color: nlmColors.green },
    { regex: /##?\s*Key\s*Terms?\s*(?:&\s*Definitions?)?\s*\n([\s\S]*?)(?=##|$)/i, type: "keyTerms" as const, title: "Key Terms & Definitions", color: nlmColors.purple },
    { regex: /##?\s*Quick\s*Review\s*\n([\s\S]*?)(?=##|$)/i, type: "quickReview" as const, title: "Quick Review", color: nlmColors.yellow },
    { regex: /##?\s*Essay\s*Prompts?\s*\n([\s\S]*?)(?=##|$)/i, type: "essayPrompts" as const, title: "Essay Prompts", color: nlmColors.red },
    { regex: /##?\s*(?:Key\s*)?Takeaways?\s*\n([\s\S]*?)(?=##|$)/i, type: "takeaways" as const, title: "Key Takeaways", color: nlmColors.cyan },
  ];
  
  for (const pattern of sectionPatterns) {
    const match = content.match(pattern.regex);
    if (match && match[1]?.trim()) {
      sections.push({
        type: pattern.type,
        title: pattern.title,
        content: match[1].trim(),
        iconColor: pattern.color,
      });
    }
  }
  
  return sections;
};
