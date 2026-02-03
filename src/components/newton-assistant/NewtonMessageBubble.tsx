import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { NewtonResponseSection, parseNewtonSections } from "./NewtonResponseSection";
import { supabase } from "@/integrations/supabase/client";
import newtonChatAvatar from "@/assets/newton-chat-avatar.png";
import type { NewtonMessage } from "@/hooks/useNewtonChat";

interface NewtonMessageBubbleProps {
  message: NewtonMessage;
  isStreaming?: boolean;
}

export const NewtonMessageBubble = memo(function NewtonMessageBubble({
  message,
  isStreaming = false,
}: NewtonMessageBubbleProps) {
  const isUser = message.role === "user";
  
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
      
      // Handle non-streaming response
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

  return (
    <motion.div
      className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden",
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
      <div
        className={cn(
          "flex-1 max-w-[90%] rounded-2xl overflow-hidden",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md px-3.5 py-2.5"
            : "bg-muted/40 text-foreground rounded-bl-md px-3 py-2 overflow-x-auto"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="text-sm">
            {message.content ? (
              hasSections && !isStreaming ? (
                // Render structured sections with cards
                <div className="space-y-1">
                  {sections.map((section, idx) => (
                    section.heading ? (
                      <NewtonResponseSection
                        key={idx}
                        section={section}
                        onExplain={handleExplain}
                      />
                    ) : (
                      <div key={idx} className="prose prose-sm dark:prose-invert max-w-none mb-3">
                        <MarkdownRenderer content={section.content} />
                      </div>
                    )
                  ))}
                </div>
              ) : (
                // Fallback to simple markdown rendering during streaming
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownRenderer content={message.content} />
                </div>
              )
            ) : isStreaming ? (
              <motion.span
                className="inline-flex gap-1"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
              >
                <motion.span
                  className="w-1.5 h-1.5 bg-current rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.span
                  className="w-1.5 h-1.5 bg-current rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.span
                  className="w-1.5 h-1.5 bg-current rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
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
    </motion.div>
  );
});
