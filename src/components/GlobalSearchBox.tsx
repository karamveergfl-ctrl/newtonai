import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Search, Loader2, MicOff, Youtube, History, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

interface GlobalSearchBoxProps {
  onTopicSearch: (query: string) => void;
  isSearching: boolean;
}

export const GlobalSearchBox = ({ onTopicSearch, isSearching }: GlobalSearchBoxProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get current user and fetch search history
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        fetchSearchHistory(session.user.id);
      }
    };
    getUser();
  }, []);

  const fetchSearchHistory = async (uid: string) => {
    const { data, error } = await supabase
      .from('search_history')
      .select('search_query')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!error && data) {
      // Get unique queries
      const uniqueQueries = [...new Set(data.map(item => item.search_query))];
      setSearchHistory(uniqueQueries.slice(0, 5));
    }
  };

  const saveSearchHistory = async (query: string) => {
    if (!userId) return;
    
    await supabase
      .from('search_history')
      .insert({
        user_id: userId,
        search_query: query,
        is_question: false
      });
    
    // Update local history
    setSearchHistory(prev => {
      const filtered = prev.filter(q => q !== query);
      return [query, ...filtered].slice(0, 5);
    });
  };

  const deleteHistoryItem = async (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;

    await supabase
      .from('search_history')
      .delete()
      .eq('user_id', userId)
      .eq('search_query', query);
    
    setSearchHistory(prev => prev.filter(q => q !== query));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim().length === 0) {
      inputRef.current?.focus();
      return;
    }
    
    if (searchQuery.trim().length > 2) {
      saveSearchHistory(searchQuery.trim());
      onTopicSearch(searchQuery);
      setIsFocused(false);
    } else {
      toast({
        title: "Search query too short",
        description: "Please enter at least 3 characters",
        variant: "destructive",
      });
    }
  };

  const handleHistorySelect = (query: string) => {
    setSearchQuery(query);
    onTopicSearch(query);
    setIsFocused(false);
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
      saveSearchHistory(transcript);
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

  const showDropdown = isFocused && searchHistory.length > 0 && !isSearching && !isListening;

  const topicChips = [
    { label: "Physics", query: "Newton's laws of motion" },
    { label: "Math", query: "Calculus fundamentals" },
    { label: "Biology", query: "Photosynthesis process" },
    { label: "Chemistry", query: "Chemical bonding" },
    { label: "History", query: "World War 2" },
    { label: "Economics", query: "Supply and demand" },
  ];

  const handleChipClick = (query: string) => {
    setSearchQuery(query);
    saveSearchHistory(query);
    onTopicSearch(query);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-6" data-tutorial="search-box" ref={containerRef}>
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        <Youtube className="w-4 h-4" />
        <span className="text-sm">Search any topic for educational videos</span>
      </div>
      <div className="relative">
        <div className="flex gap-2 bg-card/80 backdrop-blur-sm p-3 rounded-xl border shadow-lg">
          <Input
            ref={inputRef}
            type="text"
            placeholder={isMobile ? "Search any topic..." : "Search any topic (e.g., 'Newton's laws', 'photosynthesis')"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => setIsFocused(true)}
            className="flex-1 border-0 bg-transparent focus-visible:ring-1 text-base h-10"
            disabled={isSearching || isListening}
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || isListening}
            size="icon"
            className="shrink-0 h-10 w-10"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={handleVoiceSearch}
            disabled={isSearching}
            size="icon"
            variant={isListening ? "default" : "outline"}
            className={`shrink-0 h-10 w-10 ${isListening ? "animate-pulse" : ""}`}
          >
            {isListening ? (
              <MicOff className="w-4 h-4 text-destructive" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Search History Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border rounded-xl shadow-lg overflow-hidden">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b flex items-center gap-2">
              <History className="w-3 h-3" />
              Recent Searches
            </div>
            <ul className="py-1">
              {searchHistory.map((query, index) => (
                <li
                  key={index}
                  onClick={() => handleHistorySelect(query)}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-muted cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{query}</span>
                  </div>
                  <button
                    onClick={(e) => deleteHistoryItem(query, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                    aria-label="Remove from history"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Quick Topic Chips */}
      <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {topicChips.map((chip) => (
          <button
            key={chip.label}
            onClick={() => handleChipClick(chip.query)}
            disabled={isSearching}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
};
