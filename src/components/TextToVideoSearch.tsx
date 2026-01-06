import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Video, Search, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface TextToVideoSearchProps {
  onSearch: (text: string) => void;
  isSearching: boolean;
}

export const TextToVideoSearch = ({ onSearch, isSearching }: TextToVideoSearchProps) => {
  const [text, setText] = useState("");
  const { toast } = useToast();

  const handleSearch = () => {
    const trimmedText = text.trim();
    if (trimmedText.length < 10) {
      toast({
        title: "Text too short",
        description: "Please enter at least 10 characters to search for videos",
        variant: "destructive",
      });
      return;
    }
    onSearch(trimmedText);
  };

  const exampleTexts = [
    "Newton's laws of motion",
    "How photosynthesis works",
    "Solving quadratic equations",
    "The French Revolution causes",
  ];

  const handleExampleClick = (example: string) => {
    setText(example);
    onSearch(example);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 bg-gradient-to-br from-primary/5 via-card to-secondary/5 border-primary/20 shadow-xl">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                Text to Video Search
                <Sparkles className="w-4 h-4 text-primary" />
              </h2>
              <p className="text-sm text-muted-foreground">
                Paste any text or topic to find related educational videos
              </p>
            </div>
          </div>

          {/* Text Input */}
          <div className="relative">
            <Textarea
              placeholder="Paste your study text, homework question, or type any topic you want to learn about..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[120px] resize-none text-base border-primary/20 focus:border-primary bg-background/50"
              disabled={isSearching}
            />
            <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
              {text.length} characters
            </div>
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={isSearching || text.trim().length < 10}
            size="lg"
            className="w-full gap-3 text-lg h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Finding Videos...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search Videos
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>

          {/* Quick Examples */}
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {exampleTexts.map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExampleClick(example)}
                  disabled={isSearching}
                  className="text-xs hover:bg-primary/10 hover:border-primary/50"
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
