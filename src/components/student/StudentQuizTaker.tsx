import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAssignments } from "@/hooks/useAssignments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Trophy } from "lucide-react";

interface StudentQuizTakerProps {
  assignmentId: string;
  onComplete: (score: number, total: number) => void;
  onCancel: () => void;
  existingSubmission?: { score: number | null; answers: any; status: string } | null;
}

export function StudentQuizTaker({ assignmentId, onComplete, onCancel, existingSubmission }: StudentQuizTakerProps) {
  const { submitAssignment } = useAssignments();
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

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
      // If already submitted, show review
      if (existingSubmission) {
        setAnswers(existingSubmission.answers || {});
        setReviewMode(true);
      }
      setLoading(false);
    };
    fetchQuiz();
  }, [assignmentId, existingSubmission]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const result = await submitAssignment(assignmentId, answers);
    setSubmitting(false);
    if (result?.score !== undefined) {
      onComplete(result.score, questions.length);
    } else {
      onComplete(0, questions.length);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
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
                        disabled={reviewMode}
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
