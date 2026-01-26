import { memo } from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
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
            className="w-full h-full object-cover scale-110"
          />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          "flex-1 max-w-[85%] rounded-2xl px-3.5 py-2.5",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted/60 text-foreground rounded-bl-md"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
            {message.content ? (
              <MarkdownRenderer content={message.content} />
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
