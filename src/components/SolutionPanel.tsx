import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SolutionPanelProps {
  content: string;
  isQuestion: boolean;
  onClose: () => void;
}

export const SolutionPanel = ({ content, isQuestion, onClose }: SolutionPanelProps) => {
  // Format markdown-style content to HTML
  const formatContent = (text: string) => {
    return text
      // Headers
      .replace(/### (.*?)(\n|$)/g, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/## (.*?)(\n|$)/g, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-primary">$1</strong>')
      // Code blocks
      .replace(/```(.*?)```/gs, '<pre class="bg-muted p-3 rounded-md my-2 overflow-x-auto"><code>$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
      // Bullet points
      .replace(/^\* (.*?)$/gm, '<li class="ml-4">$1</li>')
      .replace(/(<li.*<\/li>)/s, '<ul class="list-disc my-2">$1</ul>')
      // Numbered lists
      .replace(/^\d+\. (.*?)$/gm, '<li class="ml-4">$1</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/^(?!<[h|u|l|p|c])(.*?)$/gm, '<p class="mb-3">$1</p>');
  };

  return (
    <div className="h-full flex flex-col bg-card border-l animate-fade-in">
      <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
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
      <ScrollArea className="flex-1">
        <div className="p-6">
          <div 
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: formatContent(content) }} 
          />
        </div>
      </ScrollArea>
    </div>
  );
};
