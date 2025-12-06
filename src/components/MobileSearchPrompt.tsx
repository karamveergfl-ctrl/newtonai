import React, { useState, useEffect } from 'react';
import { Search, X, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface MobileSearchPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedText: string;
  onSearch: (text: string) => void;
  isLoading?: boolean;
}

export function MobileSearchPrompt({
  open,
  onOpenChange,
  selectedText,
  onSearch,
  isLoading = false,
}: MobileSearchPromptProps) {
  const [text, setText] = useState(selectedText);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    setText(selectedText);
  }, [selectedText]);

  const handleSearch = () => {
    if (text.trim()) {
      onSearch(text.trim());
      onOpenChange(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText((prev) => prev + ' ' + transcript);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <DrawerTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-primary" />
            Search for Videos
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-4">
          <div className="relative">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter or edit text to search..."
              className="min-h-[120px] pr-12 text-base resize-none"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-10 w-10"
              onClick={handleVoiceInput}
            >
              {isListening ? (
                <MicOff className="h-5 w-5 text-destructive animate-pulse" />
              ) : (
                <Mic className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Edit the text above or use voice input to refine your search.
          </p>
        </div>

        <DrawerFooter className="border-t border-border pt-4">
          <Button
            onClick={handleSearch}
            disabled={!text.trim() || isLoading}
            className="w-full h-12 text-base"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Searching...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Videos & Solutions
              </span>
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full h-12 text-base">
              <X className="h-5 w-5 mr-2" />
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
