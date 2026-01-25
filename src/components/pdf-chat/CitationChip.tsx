import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText } from 'lucide-react';

interface Citation {
  pageNumber: number;
  chunkId: string;
  quote: string;
}

interface CitationChipProps {
  citation: Citation;
  onClick: (pageNumber: number, quote: string) => void;
}

export function CitationChip({ citation, onClick }: CitationChipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-primary/20 transition-colors gap-1 px-2 py-1"
            onClick={() => onClick(citation.pageNumber, citation.quote)}
          >
            <FileText className="w-3 h-3" />
            Page {citation.pageNumber}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs text-muted-foreground italic">"{citation.quote}"</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
