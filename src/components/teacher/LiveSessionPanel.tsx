import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAssignments } from "@/hooks/useAssignments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Radio, Zap, Clock, Users, StopCircle, Eye } from "lucide-react";
import { SessionResultsPanel } from "./SessionResultsPanel";

interface LiveSession {
  id: string;
  class_id: string;
  title: string;
  content_source: string;
  content_text: string | null;
  content_title: string | null;
  assignment_id: string | null;
  time_limit_minutes: number;
  status: string;
  started_at: string;
  quiz_started_at: string | null;
  quiz_ended_at: string | null;
}

interface LiveSessionPanelProps {
  classId: string;
  session: LiveSession;
  onUpdate: () => void;
}

export function LiveSessionPanel({ classId, session, onUpdate }: LiveSessionPanelProps) {
  const { createAssignment } = useAssignments(classId);
  const [generating, setGenerating] = useState(false);
  const [ending, setEnding] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Quiz settings
  const [numQuestions, setNumQuestions] = useState("5");
  const [difficulty, setDifficulty] = useState("medium");
  const [timeLimit, setTimeLimit] = useState("5");

  // Poll submission count during quiz
  useEffect(() => {
    if (session.status !== "quiz_active" || !session.assignment_id) return;
    const poll = async () => {
      const { count } = await supabase
        .from("assignment_submissions")
        .select("*", { count: "exact", head: true })
        .eq("assignment_id", session.assignment_id!);
      setSubmissionCount(count || 0);
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [session.status, session.assignment_id]);

  // Countdown timer
  useEffect(() => {
    if (session.status !== "quiz_active" || !session.quiz_started_at) return;
    const endTime = new Date(session.quiz_started_at).getTime() + session.time_limit_minutes * 60 * 1000;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) handleEndQuiz();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session.status, session.quiz_started_at, session.time_limit_minutes]);

  const handleGenerateQuiz = async () => {
    if (!session.content_text) { toast.error("No content to generate quiz from"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: {
          content: session.content_text,
          numQuestions: parseInt(numQuestions),
          difficulty,
        },
      });
      if (error || !data?.questions) throw new Error("Quiz generation failed");

      const dueDate = new Date(Date.now() + parseInt(timeLimit) * 60 * 1000).toISOString();

      const newAssignment = await createAssignment({
        class_id: classId,
        title: `Live Quiz: ${session.title}`,
        description: `Timed quiz from live session — ${parseInt(timeLimit)} minutes`,
        assignment_type: "quiz",
        content: { questions: data.questions },
        due_date: dueDate,
        max_score: data.questions.length,
        is_published: true,
      });

      if (!newAssignment) throw new Error("Failed to create assignment");

      await supabase.from("live_sessions" as any).update({
        assignment_id: newAssignment.id,
        status: "quiz_active",
        time_limit_minutes: parseInt(timeLimit),
        quiz_started_at: new Date().toISOString(),
      } as any).eq("id", session.id);

      toast.success("Quiz published! Students can see it now.");
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate quiz");
    } finally {
      setGenerating(false);
    }
  };

  const handleEndQuiz = useCallback(async () => {
    setEnding(true);
    await supabase.from("live_sessions" as any).update({
      status: "completed",
      quiz_ended_at: new Date().toISOString(),
    } as any).eq("id", session.id);
    toast.success("Quiz ended!");
    onUpdate();
    setEnding(false);
  }, [session.id, onUpdate]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (showResults && session.status === "completed") {
    return (
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => setShowResults(false)} className="mb-2">
          ← Back to class
        </Button>
        <SessionResultsPanel sessionId={session.id} sessionTitle={session.title} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <Card className="border-border/50 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-amber-500/5 overflow-hidden">
        <CardContent className="py-4 px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <Radio className="h-5 w-5 text-red-500" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{session.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] h-5">
                    {session.content_source === "youtube" ? "YouTube" : session.content_source === "pdf" ? "PDF/PPT" : "Text"}
                  </Badge>
                  <Badge variant={session.status === "quiz_active" ? "destructive" : session.status === "completed" ? "secondary" : "default"} className="text-[10px] h-5">
                    {session.status === "teaching" ? "Teaching" : session.status === "quiz_active" ? "Quiz Live" : "Completed"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {session.status === "teaching" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" className="gap-1.5">
                      <Zap className="h-3.5 w-3.5" /> Generate Quiz
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Questions</Label>
                        <Select value={numQuestions} onValueChange={setNumQuestions}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[5, 6, 7, 8, 10].map((n) => <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Difficulty</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Time Limit</Label>
                        <Select value={timeLimit} onValueChange={setTimeLimit}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[3, 5, 7, 10, 15].map((n) => <SelectItem key={n} value={String(n)}>{n} min</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" className="w-full" onClick={handleGenerateQuiz} disabled={generating}>
                        {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Zap className="h-3.5 w-3.5 mr-1.5" />}
                        {generating ? "Generating..." : "Generate & Publish"}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {session.status === "quiz_active" && (
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums text-red-500">{timeLeft !== null ? formatTime(timeLeft) : "--:--"}</p>
                    <p className="text-[10px] text-muted-foreground">remaining</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-lg font-bold">{submissionCount}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">submitted</p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={handleEndQuiz} disabled={ending}>
                    <StopCircle className="h-3.5 w-3.5 mr-1" /> End
                  </Button>
                </div>
              )}

              {session.status === "completed" && (
                <Button size="sm" variant="secondary" onClick={() => setShowResults(true)}>
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> View Results
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
