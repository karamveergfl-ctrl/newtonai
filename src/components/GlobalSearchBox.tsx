import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Search, Loader2, MicOff, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface GlobalSearchBoxProps {
  onTopicSearch: (query: string) => void;
  isSearching: boolean;
}

export const GlobalSearchBox = ({ onTopicSearch, isSearching }: GlobalSearchBoxProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
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

  return (
    <div className="w-full max-w-2xl mx-auto mb-6" data-tutorial="search-box">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        <Youtube className="w-4 h-4" />
        <span className="text-sm">Search any topic for educational videos</span>
      </div>
      <div className={`flex gap-2 bg-card/80 backdrop-blur-sm p-3 rounded-xl border shadow-lg ${
        isMobile ? 'flex-col sm:flex-row' : ''
      }`}>
        <Input
          type="text"
          placeholder="Search any topic (e.g., 'Newton's laws', 'photosynthesis', 'calculus')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className={`flex-1 border-0 bg-transparent focus-visible:ring-1 text-base ${
            isMobile ? 'h-12' : 'h-10'
          }`}
          disabled={isSearching || isListening}
        />
        <div className="flex gap-2 justify-end">
          <Button
            onClick={handleSearch}
            disabled={isSearching || isListening}
            size={isMobile ? "lg" : "default"}
            className={`shrink-0 gap-2 ${isMobile ? 'h-12 px-6' : ''}`}
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Search</span>
          </Button>
          <Button
            onClick={handleVoiceSearch}
            disabled={isSearching}
            size={isMobile ? "lg" : "icon"}
            variant={isListening ? "default" : "outline"}
            className={`shrink-0 ${isMobile ? 'h-12 px-4' : ''} ${isListening ? "animate-pulse" : ""}`}
          >
            {isListening ? (
              <MicOff className="w-4 h-4 text-destructive" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
