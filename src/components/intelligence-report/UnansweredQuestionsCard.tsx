import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import type { UnansweredQuestion } from "@/types/liveSession";

interface UnansweredQuestionsCardProps {
  questions: UnansweredQuestion[];
}

export function UnansweredQuestionsCard({ questions }: UnansweredQuestionsCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">❓ Top Unanswered Questions</CardTitle>
        <p className="text-[10px] text-muted-foreground">Consider addressing these next class</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {questions.length === 0 ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-400">All questions were addressed!</span>
          </div>
        ) : (
          questions.map((q) => {
            const isOpen = expandedId === q.question_id;
            return (
              <div key={q.question_id} className="rounded-lg bg-muted/30 p-2.5">
                <div className="flex items-start gap-2.5">
                  <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] shrink-0 mt-0.5">
                    ▲ {q.upvotes}
                  </Badge>
                  <p className="text-xs flex-1">{q.content}</p>
                </div>

                {q.suggested_answer && (
                  <div className="mt-1.5 ml-10">
                    <button
                      onClick={() => setExpandedId(isOpen ? null : q.question_id)}
                      className="text-[10px] text-primary flex items-center gap-1 hover:underline"
                    >
                      Suggested answer {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {isOpen && (
                      <div className="mt-1 text-[11px] text-muted-foreground bg-muted/50 rounded p-2 animate-fade-in">
                        {q.suggested_answer}
                        <Button variant="ghost" size="sm" className="h-5 text-[9px] mt-1 opacity-50" disabled>
                          Add to next class notes →
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
