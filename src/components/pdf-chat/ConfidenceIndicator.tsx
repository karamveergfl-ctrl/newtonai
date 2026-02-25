import { AlertTriangle, CheckCircle2, HelpCircle, MessageCircleQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'clarify' | 'not_found';

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  correctedQuery?: string;
  className?: string;
}

const config = {
  high: {
    icon: CheckCircle2,
    label: 'High confidence',
    description: 'Answer is well-supported by the document',
    color: 'text-green-400',
    bg: 'bg-green-950/30',
  },
  medium: {
    icon: HelpCircle,
    label: 'Interpreted query',
    description: 'Answer based on interpreted meaning',
    color: 'text-amber-400',
    bg: 'bg-amber-950/30',
  },
  low: {
    icon: AlertTriangle,
    label: 'Low confidence',
    description: 'Limited support from document content',
    color: 'text-red-400',
    bg: 'bg-red-950/30',
  },
  clarify: {
    icon: MessageCircleQuestion,
    label: 'Clarification needed',
    description: 'Please clarify your question for better results',
    color: 'text-blue-400',
    bg: 'bg-blue-950/30',
  },
  not_found: {
    icon: AlertTriangle,
    label: 'Not found',
    description: 'Information not found in the document',
    color: 'text-red-400',
    bg: 'bg-red-950/30',
  },
};

export function ConfidenceIndicator({ level, correctedQuery, className }: ConfidenceIndicatorProps) {
  const { icon: Icon, label, description, color, bg } = config[level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              bg,
              color,
              className
            )}
          >
            <Icon className="w-3 h-3" />
            <span>{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{description}</p>
          {correctedQuery && (
            <p className="text-xs mt-1 opacity-80">
              Searched for: "{correctedQuery}"
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface SpellCorrectionNoticeProps {
  originalQuery: string;
  correctedQuery: string;
}

export function SpellCorrectionNotice({ originalQuery, correctedQuery }: SpellCorrectionNoticeProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-sm">
      <span className="text-primary">✨</span>
      <span>
        Showing results for <span className="font-medium">"{correctedQuery}"</span>
        <span className="text-muted-foreground ml-1">(searched for "{originalQuery}")</span>
      </span>
    </div>
  );
}

interface SuggestedTopicsProps {
  topics: string[];
  onTopicClick: (topic: string) => void;
}

export function SuggestedTopics({ topics, onTopicClick }: SuggestedTopicsProps) {
  if (!topics || topics.length === 0) return null;

  return (
    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircleQuestion className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium">Did you mean one of these?</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, idx) => (
          <button
            key={idx}
            onClick={() => onTopicClick(topic)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 transition-colors"
          >
            {topic}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Click a topic or rephrase your question.
      </p>
    </div>
  );
}
