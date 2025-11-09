import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export const SearchBox = ({ onSearch, isSearching }: SearchBoxProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  const handleSearch = () => {
    if (searchQuery.trim().length > 2) {
      onSearch(searchQuery);
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
      onSearch(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
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
    <div className="group/search relative">
      <div className="flex gap-2 mb-2 transition-opacity duration-300 bg-background/60 backdrop-blur-sm p-2 rounded-lg hover:bg-background/90">
        <Input
          type="text"
          placeholder="Search for a topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 border-0 bg-transparent focus-visible:ring-1"
          disabled={isSearching || isListening}
        />
        <Button
          onClick={handleSearch}
          disabled={isSearching || isListening}
          size="icon"
          variant="ghost"
          className="shrink-0"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
        <Button
          onClick={handleVoiceSearch}
          disabled={isSearching || isListening}
          size="icon"
          variant="ghost"
          className={`shrink-0 ${isListening ? "bg-primary/20 animate-pulse" : ""}`}
        >
          <Mic className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
