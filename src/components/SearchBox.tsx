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
    <div className="flex gap-2 mb-4">
      <Input
        type="text"
        placeholder="Search for a topic (text or voice)..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        className="flex-1"
        disabled={isSearching || isListening}
      />
      <Button
        onClick={handleSearch}
        disabled={isSearching || isListening}
        size="icon"
        variant="secondary"
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
        variant="secondary"
        className={isListening ? "bg-primary animate-pulse" : ""}
      >
        <Mic className="w-4 h-4" />
      </Button>
    </div>
  );
};
