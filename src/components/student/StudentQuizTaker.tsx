import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAssignments } from "@/hooks/useAssignments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Trophy, Timer } from "lucide-react";

interface StudentQuizTakerProps {
  assignmentId: string;
  onComplete: (score: number, total: number) => void;
  onCancel: () => void;
  existingSubmission?: { score: number | null; answers: any; status: string } | null;
}

function formatClock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function StudentQuizTaker({ assignmentId, onComplete, onCancel, existingSubmission }: StudentQuizTakerProps) {
  const { submitAssignment } = useAssignments();
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const submittedRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    const fetchQuiz = async () => {
      const { data } = await supabase
        .from("assignments")
        .select("content, time_limit_minutes")
        .eq("id", assignmentId)
        .single();
      const content = data?.content as any;
      if (content?.questions) {
        setQuestions(content.questions);
      }
      // If already submitted, show review
      if (existingSubmission) {
        setAnswers(existingSubmission.answers || {});
        setReviewMode(true);
      } else if (data?.time_limit_minutes) {
        setTimeLeft(data.time_limit_minutes * 60);
      }
      setLoading(false);
    };
    fetchQuiz();
  }, [assignmentId, existingSubmission]);

  const handleSubmit = async () => {
    if (submitting || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const result = await submitAssignment(assignmentId, answersRef.current);
    if (!result) submittedRef.current = false;
    setSubmitting(false);
    if (result?.score !== undefined) {
      onComplete(result.score, questions.length);
    } else {
      onComplete(0, questions.length);
    }
  };

  // Countdown; auto-submit at zero
  const hasTimer = timeLeft !== null;
  useEffect(() => {
    if (!hasTimer || reviewMode) return;
    const t = setInterval(() => setTimeLeft((v) => (v === null ? v : Math.max(0, v - 1))), 1000);
    return () => clearInterval(t);
  }, [hasTimer, reviewMode]);
  useEffect(() => {
    if (timeLeft === 0 && !reviewMode) void handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, reviewMode]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {timeLeft !== null && !reviewMode && (
        <div className={`sticky top-2 z-10 ml-auto w-fit flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold bg-card shadow ${timeLeft <= 60 ? "border-destructive text-destructive" : "border-border"}`} role="timer" aria-live="polite">
          <Timer className="h-4 w-4" /> {formatClock(timeLeft)}
        </div>
      )}
      {reviewMode && existingSubmission?.status === "graded" && (
        <Card className="border-border/50 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
          <CardContent className="py-4 text-center">
            <Trophy className="h-6 w-6 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{existingSubmission.score}/{questions.length}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round(((existingSubmission.score ?? 0) / questions.length) * 100)}% — Review Mode
            </p>
          </CardContent>
        </Card>
      )}

      {questions.map((q, i) => {
        const correctAnswer = q.correct_answer;
        const studentAnswer = answers[String(i)];
        const isCorrect = reviewMode && studentAnswer?.toLowerCase().trim() === correctAnswer?.toLowerCase().trim();
        const isWrong = reviewMode && studentAnswer && !isCorrect;

        return (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`border-border/50 ${isWrong ? "border-destructive/30" : isCorrect ? "border-green-500/30" : ""}`}>
              <CardContent className="py-4">
                <div className="flex items-start gap-2 mb-3">
                  <Badge variant="outline" className="text-[10px] shrink-0">Q{i + 1}</Badge>
                  <p className="text-sm font-medium">{q.question}</p>
                  {reviewMode && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                  {reviewMode && isWrong && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                </div>
                <div className="grid gap-2">
                  {(q.options || []).map((opt: string, j: number) => {
                    const selected = answers[String(i)] === opt;
                    const isCorrectOpt = reviewMode && opt.toLowerCase().trim() === correctAnswer?.toLowerCase().trim();

                    return (
                      <button
                        key={j}
                        onClick={() => !reviewMode && setAnswers(prev => ({ ...prev, [String(i)]: opt }))}
                        disabled={reviewMode || submitting}
                        className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                          reviewMode && isCorrectOpt
                            ? "border-green-500 bg-green-500/10 font-medium"
                            : reviewMode && selected && !isCorrectOpt
                            ? "border-destructive bg-destructive/10"
                            : selected
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
        );
      })}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">Back</Button>
        {!reviewMode && (
          <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Submit</>}
          </Button>
        )}
      </div>
    </div>
  );
}
