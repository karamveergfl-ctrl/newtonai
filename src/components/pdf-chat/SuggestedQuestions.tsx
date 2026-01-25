import { Button } from '@/components/ui/button';
import { Sparkles, HelpCircle, List, BookOpen, Lightbulb } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

const suggestions = [
  {
    icon: Sparkles,
    question: "Summarize this document in a few paragraphs",
    label: "Summarize",
  },
  {
    icon: List,
    question: "What are the key concepts in this document?",
    label: "Key concepts",
  },
  {
    icon: BookOpen,
    question: "Explain the main argument or thesis of this document",
    label: "Main argument",
  },
  {
    icon: Lightbulb,
    question: "List the important definitions mentioned in this document",
    label: "Definitions",
  },
  {
    icon: HelpCircle,
    question: "What conclusions does the author draw?",
    label: "Conclusions",
  },
];

export function SuggestedQuestions({ onSelect, disabled }: SuggestedQuestionsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-6">
      {suggestions.map((suggestion, idx) => (
        <Button
          key={idx}
          variant="outline"
          size="sm"
          onClick={() => onSelect(suggestion.question)}
          disabled={disabled}
          className="gap-1.5 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
        >
          <suggestion.icon className="w-3.5 h-3.5" />
          {suggestion.label}
        </Button>
      ))}
    </div>
  );
}
