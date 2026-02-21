import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAssignments } from "@/hooks/useAssignments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, CheckCircle2, Loader2 } from "lucide-react";

interface LiveQuizTakerProps {
  assignmentId: string;
  quizStartedAt: string;
  timeLimitMinutes: number;
  onComplete: (score: number, total: number) => void;
}

export function LiveQuizTaker({ assignmentId, quizStartedAt, timeLimitMinutes, onComplete }: LiveQuizTakerProps) {
  const { submitAssignment } = useAssignments();
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      const { data } = await supabase
        .from("assignments")
        .select("content")
        .eq("id", assignmentId)
        .single();
      const content = data?.content as any;
      if (content?.questions) {
        setQuestions(content.questions);
      }
      setLoading(false);
    };
    fetchQuiz();
  }, [assignmentId]);

  const handleSubmit = useCallback(async () => {
    if (submitted || submitting) return;
    setSubmitting(true);
    const result = await submitAssignment(assignmentId, answers);
    setSubmitting(false);
    setSubmitted(true);
    if (result?.score !== undefined) {
      onComplete(result.score, questions.length);
    } else {
      onComplete(0, questions.length);
    }
  }, [answers, assignmentId, submitAssignment, submitted, submitting, questions.length, onComplete]);

  // Countdown
  useEffect(() => {
    const endTime = new Date(quizStartedAt).getTime() + timeLimitMinutes * 60 * 1000;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0 && !submitted) handleSubmit();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [quizStartedAt, timeLimitMinutes, handleSubmit, submitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Timer header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className={`border-border/50 ${timeLeft <= 60 ? "bg-destructive/5 border-destructive/30" : "bg-primary/5"}`}>
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Live Quiz</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{Object.keys(answers).length}/{questions.length} answered</span>
              <span className={`text-xl font-bold tabular-nums ${timeLeft <= 60 ? "text-destructive" : ""}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Questions */}
      {questions.map((q, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Card className="border-border/50">
            <CardContent className="py-4">
              <p className="text-sm font-medium mb-3">
                <Badge variant="outline" className="mr-2 text-[10px]">Q{i + 1}</Badge>
                {q.question}
              </p>
              <div className="grid gap-2">
                {(q.options || []).map((opt: string, j: number) => {
                  const selected = answers[String(i)] === opt;
                  return (
                    <button
                      key={j}
                      onClick={() => setAnswers((prev) => ({ ...prev, [String(i)]: opt }))}
                      disabled={submitted}
                      className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                        selected
                          ? "border-primary bg-primary/10 font-medium"
                          : "border-border/50 hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <span className="text-muted-foreground mr-2 text-xs">{String.fromCharCode(65 + j)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Submit */}
      {!submitted && (
        <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
          ) : (
            <><CheckCircle2 className="h-4 w-4 mr-2" /> Submit Quiz</>
          )}
        </Button>
      )}
    </div>
  );
}
