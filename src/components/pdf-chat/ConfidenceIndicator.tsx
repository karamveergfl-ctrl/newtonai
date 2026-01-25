import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'not_found';

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  className?: string;
}

const config = {
  high: {
    icon: CheckCircle2,
    label: 'High confidence',
    description: 'Answer is well-supported by the document',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  medium: {
    icon: HelpCircle,
    label: 'Medium confidence',
    description: 'Partially supported by the document',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  low: {
    icon: AlertTriangle,
    label: 'Low confidence',
    description: 'Limited support from document content',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  not_found: {
    icon: AlertTriangle,
    label: 'Not found',
    description: 'Information not found in the document',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
};

export function ConfidenceIndicator({ level, className }: ConfidenceIndicatorProps) {
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
        <TooltipContent side="top">
          <p className="text-xs">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
