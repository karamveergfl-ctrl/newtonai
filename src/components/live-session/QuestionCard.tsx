import { useState } from "react";
import { ChevronDown, ChevronUp, Pin, Check, Trash2, ArrowBigUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { LiveQuestion } from "@/types/liveSession";
import { cn } from "@/lib/utils";
import newtonAvatar from "@/assets/newton-chat-avatar-sm.webp";

interface QuestionCardProps {
  question: LiveQuestion;
  role: "teacher" | "student";
  onUpvote: (id: string) => void;
  onMarkAnswered?: (id: string) => void;
  onPin?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export function QuestionCard({
  question,
  role,
  onUpvote,
  onMarkAnswered,
  onPin,
  onDismiss,
}: QuestionCardProps) {
  const [newtonOpen, setNewtonOpen] = useState(false);
  const isTeacher = role === "teacher";

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 transition-all duration-200",
        question.is_pinned && "border-l-2 border-l-primary",
        question.is_answered && "opacity-60"
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        <p
          className={cn(
            "flex-1 text-sm text-foreground leading-relaxed",
            question.is_answered && "line-through text-muted-foreground"
          )}
        >
          {question.content}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          {question.is_pinned && (
            <span className="text-primary text-xs">📌</span>
          )}
          {question.is_answered && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Answered
            </Badge>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-2">
        {/* Upvote */}
        <button
          onClick={() => onUpvote(question.id)}
          className={cn(
            "flex items-center gap-1 text-xs rounded-md px-2 py-1 border transition-all duration-150 active:scale-95",
            question.has_upvoted
              ? "bg-primary/15 border-primary/40 text-primary"
              : "bg-transparent border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
          )}
        >
          <ArrowBigUp className={cn("w-3.5 h-3.5", question.has_upvoted && "fill-current")} />
          <span>{question.upvotes}</span>
        </button>

        {/* Teacher actions */}
        {isTeacher && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={() => onPin?.(question.id)}
              title={question.is_pinned ? "Unpin" : "Pin"}
            >
              <Pin className={cn("w-3.5 h-3.5", question.is_pinned && "fill-current text-primary")} />
            </Button>
            {!question.is_answered && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-emerald-400"
                onClick={() => onMarkAnswered?.(question.id)}
                title="Mark answered"
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDismiss?.(question.id)}
              title="Dismiss"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Newton answer */}
      {question.newton_answer && (
        <Collapsible open={newtonOpen} onOpenChange={setNewtonOpen} className="mt-2">
          <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors w-full">
            <img src={newtonAvatar} alt="" className="w-4 h-4 rounded-full" />
            <span>Newton's answer</span>
            {newtonOpen ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2.5 leading-relaxed transition-all duration-200">
            {question.newton_answer}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
