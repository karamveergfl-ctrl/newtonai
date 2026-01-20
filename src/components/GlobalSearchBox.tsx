import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Search, Loader2, MicOff, Youtube, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface GlobalSearchBoxProps {
  onTopicSearch: (query: string) => void;
  isSearching: boolean;
}

export const GlobalSearchBox = ({ onTopicSearch, isSearching }: GlobalSearchBoxProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSearch = () => {
    if (searchQuery.trim().length > 2) {
      onTopicSearch(searchQuery);
    } else {
      toast({
        title: "Search query too short",
        description: "Please enter at least 3 characters",
        variant: "destructive",
      });
    }
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice search not supported",
        description: "Your browser doesn't support voice recognition",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak your topic now",
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      onTopicSearch(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Voice search error",
        description: "Could not recognize speech. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const suggestedTopics = ["Newton's laws", "Photosynthesis", "Calculus basics"];

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 px-2 sm:px-0" data-tutorial="search-box">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 text-muted-foreground justify-center sm:justify-start">
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-1.5 rounded-full">
          <Youtube className="w-4 h-4" />
          <span className="text-sm font-medium">Video Search</span>
        </div>
      </div>

      {/* Main Search Container */}
      <div 
        className={`
          relative bg-card/90 backdrop-blur-md rounded-2xl border-2 shadow-xl
          transition-all duration-300 ease-out
          ${isFocused ? 'border-primary/50 shadow-primary/20 shadow-2xl scale-[1.01]' : 'border-border/50'}
          ${isListening ? 'border-primary animate-pulse' : ''}
        `}
      >
        {/* Glow Effect */}
        {isFocused && (
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl opacity-50" />
        )}

        <div className="p-4 sm:p-5 space-y-4">
          {/* Input Field */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder={isMobile ? "Search any topic..." : "Search any topic (e.g., 'Newton's laws', 'photosynthesis')"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full h-14 pl-12 pr-4 text-base sm:text-lg bg-background/50 border-0 rounded-xl focus-visible:ring-2 focus-visible:ring-primary/30 placeholder:text-muted-foreground/60"
              disabled={isSearching || isListening}
            />
          </div>

          {/* Buttons Row */}
          <div className="flex gap-3">
            <Button
              onClick={handleSearch}
              disabled={isSearching || isListening}
              size="lg"
              className="flex-1 h-14 text-base font-semibold gap-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Search Videos</span>
                </>
              )}
            </Button>
            
            <Button
              onClick={handleVoiceSearch}
              disabled={isSearching}
              size="lg"
              variant={isListening ? "default" : "outline"}
              className={`
                h-14 w-14 sm:w-auto sm:px-5 rounded-xl transition-all duration-200 active:scale-[0.98]
                ${isListening 
                  ? 'bg-destructive hover:bg-destructive/90 animate-pulse shadow-lg shadow-destructive/30' 
                  : 'hover:bg-primary/10 hover:border-primary/50'
                }
              `}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5" />
                  <span className="hidden sm:inline ml-2">Stop</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span className="hidden sm:inline ml-2">Voice</span>
                </>
              )}
            </Button>
          </div>

          {/* Quick Topic Suggestions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground shrink-0">Try:</span>
            {suggestedTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => {
                  setSearchQuery(topic);
                  onTopicSearch(topic);
                }}
                disabled={isSearching || isListening}
                className="text-xs px-3 py-1.5 bg-muted/50 hover:bg-primary/10 hover:text-primary rounded-full transition-colors duration-200 disabled:opacity-50"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listening Overlay for Mobile */}
      {isListening && isMobile && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                <Mic className="w-12 h-12 text-destructive" />
              </div>
              <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-destructive/30 animate-ping" />
            </div>
            <p className="text-xl font-semibold">Listening...</p>
            <p className="text-muted-foreground">Speak your topic now</p>
            <Button 
              variant="outline" 
              onClick={handleVoiceSearch}
              className="mt-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
