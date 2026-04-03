import { memo, useCallback, useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { User, Copy, Check, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
const MarkdownRenderer = lazy(() => import("@/components/MarkdownRenderer").then(m => ({ default: m.MarkdownRenderer })));
import { NewtonResponseSection, parseNewtonSections } from "./NewtonResponseSection";
import { supabase } from "@/integrations/supabase/client";
import newtonChatAvatar from "@/assets/newton-chat-avatar-sm.webp";
import type { NewtonMessage } from "@/hooks/useNewtonChat";
import { toast } from "sonner";

interface NewtonMessageBubbleProps {
  message: NewtonMessage;
  isStreaming?: boolean;
  onRetry?: () => void;
}

export const NewtonMessageBubble = memo(function NewtonMessageBubble({
  message,
  isStreaming = false,
  onRetry,
}: NewtonMessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [message.content]);

  const handleSpeak = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(message.content.replace(/[#*`_~\[\]()]/g, ''));
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, [message.content, isSpeaking]);

  // Handle explain button click
  const handleExplain = useCallback(async (heading: string, content: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('newton-chat', {
        body: {
          messages: [
            {
              role: "system",
              content: "You are Newton, a helpful AI tutor. Give a simple, clear explanation that a student can easily understand. Use examples when helpful. Use proper LaTeX notation for any math formulas (wrap in $...$ for inline or $$...$$ for block). Keep the explanation brief but thorough."
            },
            {
              role: "user",
              content: `Explain this topic in simple terms:\n\n**${heading}**\n\n${content.slice(0, 1000)}`
            }
          ],
          stream: false
        }
      });

      if (error) throw error;
      
      if (data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      
      return 'Unable to generate explanation.';
    } catch (err) {
      console.error('Newton explain error:', err);
      throw err;
    }
  }, []);

  // Parse content into sections for assistant messages
  const sections = !isUser && message.content ? parseNewtonSections(message.content) : [];
  const hasSections = sections.length > 1 || (sections.length === 1 && sections[0].heading !== null);

  const showActions = !isUser && message.content && !isStreaming;

  return (
    <motion.div
      className={cn("flex gap-1.5 sm:gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center overflow-hidden",
          isUser ? "bg-primary" : ""
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <img
            src={newtonChatAvatar}
            alt="Newton"
            className="w-full h-full object-cover scale-150"
          />
        )}
      </div>

      {/* Message bubble */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div
          className={cn(
            "rounded-2xl overflow-hidden",
            isUser
              ? "max-w-[85%] bg-primary text-primary-foreground rounded-br-sm px-4 py-3 ml-auto"
              : "bg-muted/50 text-foreground rounded-bl-sm px-4 py-3 min-w-0 max-w-full overflow-hidden border border-border/30"
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="text-sm">
              {message.content ? (
                hasSections && !isStreaming ? (
                  <div className="space-y-1 min-w-0 overflow-hidden">
                    {sections.map((section, idx) => (
                      section.heading ? (
                        <NewtonResponseSection
                          key={idx}
                          section={section}
                          onExplain={handleExplain}
                        />
                      ) : (
                        <div key={idx} className="prose prose-sm dark:prose-invert max-w-none mb-3 break-words [overflow-wrap:anywhere]">
                          <Suspense fallback={<span className="text-muted-foreground text-xs">Loading…</span>}>
                            <MarkdownRenderer content={section.content} />
                          </Suspense>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none break-words [overflow-wrap:anywhere]">
                    <Suspense fallback={<span className="text-muted-foreground text-xs">Loading…</span>}>
                      <MarkdownRenderer content={message.content} />
                    </Suspense>
                  </div>
                )
              ) : isStreaming ? (
                <motion.span
                  className="inline-flex gap-1.5 px-2 py-1"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.span className="w-2 h-2 bg-muted-foreground/60 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                  <motion.span className="w-2 h-2 bg-muted-foreground/60 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                  <motion.span className="w-2 h-2 bg-muted-foreground/60 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                </motion.span>
              ) : null}
            </div>
          )}

          {/* Timestamp */}
          <p
            className={cn(
              "text-[10px] mt-1",
              isUser ? "text-primary-foreground/60" : "text-muted-foreground"
            )}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Action buttons for assistant messages */}
        {showActions && (
          <div className="flex items-center gap-1 px-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
              title="Copy message"
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-6 w-6 text-muted-foreground hover:text-foreground", isSpeaking && "text-primary")}
              onClick={handleSpeak}
              title={isSpeaking ? "Stop speaking" : "Read aloud"}
            >
              {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </Button>
            {(message.isError || onRetry) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={onRetry}
                title="Retry"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});
