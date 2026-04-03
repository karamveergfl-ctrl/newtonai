import { useState, useRef, useEffect } from "react";
import { useClassChat, type ClassChatMessage } from "@/hooks/useClassChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Send, X, Bot, User, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassNewtonChatProps {
  classId: string;
  className?: string;
  onClose?: () => void;
}

export function ClassNewtonChat({ classId, className, onClose }: ClassNewtonChatProps) {
  const { messages, isLoading, sendMessage, cancelRequest, clearMessages } = useClassChat({ classId });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className={cn("flex flex-col h-full bg-card rounded-xl border border-border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Newton – Class Tutor</h3>
            <p className="text-xs text-muted-foreground">Answers from class materials only</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearMessages} title="Clear chat">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 opacity-60">
            <Bot className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Ask me anything about your class materials!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              I'll only answer from content covered in this class.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {isLoading && messages[messages.length - 1]?.content === "" && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about class content..."
            disabled={isLoading}
            className="flex-1"
          />
          {isLoading ? (
            <Button type="button" variant="outline" size="icon" onClick={cancelRequest}>
              <X className="w-4 h-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ClassChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        isUser ? "bg-primary/10" : "bg-accent/10"
      )}>
        {isUser ? <User className="w-3.5 h-3.5 text-primary" /> : <Bot className="w-3.5 h-3.5 text-accent-foreground" />}
      </div>
      <div className={cn(
        "rounded-xl px-3 py-2 max-w-[80%] text-sm",
        isUser
          ? "bg-primary text-primary-foreground"
          : message.isError
            ? "bg-destructive/10 text-destructive"
            : "bg-muted"
      )}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
    </div>
  );
}
