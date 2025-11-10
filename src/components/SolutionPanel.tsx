import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SolutionPanelProps {
  content: string;
  isQuestion: boolean;
  onClose: () => void;
}

export const SolutionPanel = ({ content, isQuestion, onClose }: SolutionPanelProps) => {
  return (
    <Card className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 w-11/12 md:w-3/4 max-w-4xl bg-card/98 backdrop-blur-md shadow-2xl border-primary/30 animate-fade-in">
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-lg">
          {isQuestion ? "📝 Detailed Solution" : "💡 Topic Overview"}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="max-h-[60vh]">
        <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
          <div 
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ 
              __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                           .replace(/\n\n/g, '</p><p>')
                           .replace(/^(.+)$/gm, '<p>$1</p>')
            }} 
          />
        </div>
      </ScrollArea>
    </Card>
  );
};
