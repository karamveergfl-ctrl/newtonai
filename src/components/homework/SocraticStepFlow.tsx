import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, ArrowRight, Lightbulb, Brain, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SocraticStep {
  type: "concept_question" | "step_question" | "confirmation" | "final_solution";
  aiMessage: string;
  options?: string[];
  studentChoice?: string;
  isCorrect?: boolean;
}

interface SocraticStepFlowProps {
  problemText: string;
  language?: string;
  onComplete?: (fullSolution: string) => void;
  onPracticeMore?: () => void;
}

export function SocraticStepFlow({ problemText, language = "en", onComplete, onPracticeMore }: SocraticStepFlowProps) {
  const [steps, setSteps] = useState<SocraticStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [practiceProblems, setPracticeProblems] = useState<string[]>([]);
  const [loadingPractice, setLoadingPractice] = useState(false);

  const callAI = useCallback(async (prompt: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Not authenticated");

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newton-chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: prompt,
          language,
        }),
      }
    );

    if (!response.ok) throw new Error("AI request failed");
    const data = await response.json();
    return data.response || data.content || "";
  }, [language]);

  const startSocraticFlow = useCallback(async () => {
    setIsLoading(true);
    try {
      const prompt = `You are a Socratic tutor. A student has submitted this problem:

"${problemText}"

Your task: Identify the core concept being tested. Then ask the student: "What concept do you think this problem is testing?" Provide exactly 4 concept options as a JSON array.

Respond in this exact JSON format (no markdown, just raw JSON):
{
  "message": "I've read your problem. Before I show you the solution, let me guide you through it. What concept do you think this problem is testing?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctOption": "The correct concept name"
}`;

      const result = await callAI(prompt);
      const parsed = JSON.parse(result.replace(/```json?\n?/g, "").replace(/```/g, "").trim());

      setSteps([{
        type: "concept_question",
        aiMessage: parsed.message,
        options: parsed.options,
      }]);
    } catch (error) {
      toast.error("Failed to start guided mode. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [problemText, callAI]);

  const handleOptionSelect = useCallback(async (stepIndex: number, choice: string) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], studentChoice: choice };
    setSteps(updatedSteps);
    setIsLoading(true);

    try {
      const currentStep = updatedSteps[stepIndex];
      const stepNumber = steps.filter(s => s.type === "step_question").length + 1;

      let prompt: string;

      if (currentStep.type === "concept_question") {
        prompt = `Problem: "${problemText}"
The student chose concept: "${choice}"

Confirm or gently correct their choice. Then present Step 1 of the solution as a question with 3 options.

Respond as JSON:
{
  "confirmation": "Your response about their concept choice",
  "isCorrect": true/false,
  "stepQuestion": "What should we do first?",
  "options": ["Option A", "Option B", "Option C"],
  "correctOption": "The correct option text"
}`;
      } else {
        prompt = `Problem: "${problemText}"
Previous steps: ${JSON.stringify(updatedSteps.map(s => ({ type: s.type, choice: s.studentChoice })))}
The student chose: "${choice}" for step ${stepNumber}.

Confirm or correct, show the work for this step. Then either:
- Present the next step as a question (if more steps remain)
- Show the final complete solution (if this was the last step)

Respond as JSON:
{
  "confirmation": "Feedback on their choice with the worked step",
  "isCorrect": true/false,
  "isLastStep": false,
  "stepQuestion": "Next step question (if not last)",
  "options": ["A", "B", "C"],
  "correctOption": "correct option",
  "finalSolution": "Complete worked solution (only if isLastStep=true)"
}`;
      }

      const result = await callAI(prompt);
      const parsed = JSON.parse(result.replace(/```json?\n?/g, "").replace(/```/g, "").trim());

      // Add confirmation step
      const newSteps = [...updatedSteps, {
        type: "confirmation" as const,
        aiMessage: parsed.confirmation,
        isCorrect: parsed.isCorrect,
      }];

      if (parsed.isLastStep && parsed.finalSolution) {
        newSteps.push({
          type: "final_solution" as const,
          aiMessage: parsed.finalSolution,
        });
        setIsComplete(true);
        onComplete?.(parsed.finalSolution);
      } else if (parsed.stepQuestion) {
        newSteps.push({
          type: "step_question" as const,
          aiMessage: parsed.stepQuestion,
          options: parsed.options,
        });
      }

      setSteps(newSteps);
    } catch (error) {
      toast.error("Failed to process your answer. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [steps, problemText, callAI, onComplete]);

  const handlePracticeSimilar = useCallback(async () => {
    setLoadingPractice(true);
    try {
      const prompt = `Based on this problem: "${problemText}"

Generate exactly 3 similar practice problems at the same difficulty level. Return as JSON:
{ "problems": ["Problem 1 text", "Problem 2 text", "Problem 3 text"] }`;

      const result = await callAI(prompt);
      const parsed = JSON.parse(result.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      setPracticeProblems(parsed.problems || []);
    } catch {
      toast.error("Failed to generate practice problems.");
    } finally {
      setLoadingPractice(false);
    }
  }, [problemText, callAI]);

  // Auto-start on mount
  if (steps.length === 0 && !isLoading) {
    startSocraticFlow();
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {step.type === "confirmation" ? (
              <Card className={cn(
                "border-l-4",
                step.isCorrect ? "border-l-green-500 bg-green-500/5" : "border-l-amber-500 bg-amber-500/5"
              )}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start gap-2">
                    {step.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    )}
                    <MarkdownRenderer content={step.aiMessage} className="text-sm" />
                  </div>
                </CardContent>
              </Card>
            ) : step.type === "final_solution" ? (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-primary">Complete Solution</span>
                  </div>
                  <MarkdownRenderer content={step.aiMessage} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2 mb-4">
                    <Brain className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <MarkdownRenderer content={step.aiMessage} className="text-sm" />
                  </div>
                  {step.options && !step.studentChoice && (
                    <div className="grid gap-2">
                      {step.options.map((option, oi) => (
                        <Button
                          key={oi}
                          variant="outline"
                          className="justify-start text-left h-auto py-3 px-4 whitespace-normal"
                          onClick={() => handleOptionSelect(index, option)}
                          disabled={isLoading}
                        >
                          <span className="font-semibold mr-2 text-primary">
                            {String.fromCharCode(65 + oi)}.
                          </span>
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}
                  {step.studentChoice && (
                    <div className="mt-2 px-4 py-2 bg-muted/50 rounded-lg text-sm">
                      <span className="text-muted-foreground">Your answer: </span>
                      <span className="font-medium">{step.studentChoice}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {isLoading && (
        <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Newton is thinking...</span>
        </div>
      )}

      {isComplete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-3 pt-2">
          <Button onClick={handlePracticeSimilar} disabled={loadingPractice} className="gap-2">
            {loadingPractice ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Practice Similar Problems
          </Button>
        </motion.div>
      )}

      {practiceProblems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Practice Problems
          </h3>
          {practiceProblems.map((problem, i) => (
            <Card key={i} className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => onPracticeMore?.()}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-primary">{i + 1}.</span>
                  <MarkdownRenderer content={problem} className="text-sm" />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </div>
  );
}
