import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Brain, Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextSelectionToolbarProps {
  selectedText: string | null;
  onAskAbout: (text: string) => void;
  onExplain: (text: string) => void;
  onClose: () => void;
}

export function TextSelectionToolbar({
  selectedText,
  onAskAbout,
  onExplain,
  onClose,
}: TextSelectionToolbarProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selectedText) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Position above the selection
      setPosition({
        top: rect.top - 50,
        left: rect.left + rect.width / 2,
      });
    } else {
      setPosition(null);
    }
  }, [selectedText]);

  useEffect(() => {
    if (selectedText) {
      updatePosition();
    } else {
      setPosition(null);
    }
  }, [selectedText, updatePosition]);

  if (!selectedText || !position) return null;

  return (
    <div
      ref={toolbarRef}
      className={cn(
        "fixed z-50 flex items-center gap-1 p-1 bg-popover border shadow-lg rounded-lg",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}
      style={{
        top: Math.max(8, position.top),
        left: position.left,
        transform: 'translateX(-50%)',
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAskAbout(selectedText)}
        className="gap-1.5 h-8 px-2.5 text-xs"
      >
        <MessageSquare className="w-3.5 h-3.5 text-primary" />
        Ask
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onExplain(selectedText)}
        className="gap-1.5 h-8 px-2.5 text-xs"
      >
        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
        Explain
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="h-8 w-8"
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
