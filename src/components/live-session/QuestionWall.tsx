import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageSquarePlus, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuestionWall } from "@/hooks/useQuestionWall";
import { QuestionCard } from "./QuestionCard";
import { cn } from "@/lib/utils";

interface QuestionWallProps {
  sessionId: string;
  role: "teacher" | "student";
}

type FilterTab = "all" | "unanswered" | "pinned";

const MAX_CHARS = 200;
const MIN_CHARS = 5;

export function QuestionWall({ sessionId, role }: QuestionWallProps) {
  const {
    questions,
    isLoading,
    isSubmitting,
    questionsEnabled,
    newQuestionCount,
    submitQuestion,
    toggleUpvote,
    markAnswered,
    togglePin,
    dismissQuestion,
    resetNewQuestionCount,
  } = useQuestionWall({ sessionId, role });

  const [draft, setDraft] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset unread when teacher opens this component
  useEffect(() => {
    if (role === "teacher") {
      resetNewQuestionCount();
    }
  }, [role, resetNewQuestionCount]);

  // Track scroll position for auto-scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }, []);

  // Auto-scroll to bottom when new questions arrive
  useEffect(() => {
    if (isAtBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [questions.length]);

  const handleSubmit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed.length < MIN_CHARS || trimmed.length > MAX_CHARS) return;
    await submitQuestion(trimmed);
    setDraft("");
  };

  const filteredQuestions = useMemo(() => {
    if (role !== "teacher" || activeFilter === "all") return questions;
    if (activeFilter === "unanswered") return questions.filter((q) => !q.is_answered);
    if (activeFilter === "pinned") return questions.filter((q) => q.is_pinned);
    return questions;
  }, [questions, activeFilter, role]);

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unanswered", label: "Unanswered" },
    { key: "pinned", label: "Pinned" },
  ];

  if (!questionsEnabled && role === "student") {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center gap-2">
        <MessageSquarePlus className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Question wall is paused</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        {role === "student" ? (
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Ask a Question</h3>
            <div className="flex items-center gap-1 text-xs text-primary">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Anonymous</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Question Wall</h3>
              {newQuestionCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 min-w-[18px] flex items-center justify-center">
                  {newQuestionCount}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Student input */}
      {role === "student" && questionsEnabled && (
        <div className="px-4 py-3 border-b border-border space-y-2 shrink-0">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Type your question…"
            className="min-h-[60px] resize-none text-sm bg-muted/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            aria-label="Type your question"
          />
          <div className="flex items-center justify-between">
            <span className={cn("text-xs", draft.length >= MAX_CHARS ? "text-destructive" : draft.length < MIN_CHARS && draft.length > 0 ? "text-amber-500" : "text-muted-foreground")}>
              {draft.length}/{MAX_CHARS}
              {draft.length > 0 && draft.length < MIN_CHARS && " (min 5)"}
            </span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!draft.trim() || draft.trim().length < MIN_CHARS || isSubmitting}
              className="text-xs"
            >
              {isSubmitting ? "Sending…" : "Ask Anonymously"}
            </Button>
          </div>
        </div>
      )}

      {/* Teacher filter tabs */}
      {role === "teacher" && (
        <div className="flex gap-1 px-4 py-2 border-b border-border shrink-0">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full transition-colors",
                activeFilter === tab.key
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Questions list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-thin"
        aria-live="polite"
        aria-label="Questions list"
      >
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <MessageSquarePlus className="w-8 h-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {role === "student"
                ? "No questions yet. Be the first to ask!"
                : "No questions from students yet"}
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              role={role}
              onUpvote={toggleUpvote}
              onMarkAnswered={markAnswered}
              onPin={togglePin}
              onDismiss={dismissQuestion}
            />
          ))
        )}
      </div>
    </div>
  );
}
