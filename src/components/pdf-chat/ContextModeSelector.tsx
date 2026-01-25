import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, BookOpen, TextSelect } from 'lucide-react';
import type { ContextMode } from '@/hooks/usePDFChat';

interface ContextModeSelectorProps {
  mode: ContextMode;
  onChange: (mode: ContextMode) => void;
  hasSelection: boolean;
  disabled?: boolean;
}

export function ContextModeSelector({ 
  mode, 
  onChange, 
  hasSelection,
  disabled = false,
}: ContextModeSelectorProps) {
  return (
    <TooltipProvider>
      <ToggleGroup 
        type="single" 
        value={mode} 
        onValueChange={(v) => v && onChange(v as ContextMode)}
        disabled={disabled}
        className="justify-start"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="entire_document" size="sm" className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Document</span>
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>Search entire document</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="current_page" size="sm" className="gap-1.5 text-xs">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Page</span>
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>Search current page only</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="selected_text" 
              size="sm" 
              className="gap-1.5 text-xs"
              disabled={!hasSelection}
            >
              <TextSelect className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Selection</span>
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            {hasSelection ? 'Ask about selected text' : 'Select text in PDF first'}
          </TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
}
