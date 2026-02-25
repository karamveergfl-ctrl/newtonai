import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { ConceptCheckAnalysis } from "@/types/liveSession";

interface ConceptCheckReportCardProps {
  analysis: ConceptCheckAnalysis[];
}

function CircleProgress({ percentage }: { percentage: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 70 ? "text-green-500" : percentage >= 40 ? "text-amber-500" : "text-red-500";

  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
        <circle
          cx="22" cy="22" r={radius} fill="none" strokeWidth="3"
          stroke="currentColor"
          className={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${color}`}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

export function ConceptCheckReportCard({ analysis }: ConceptCheckReportCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const needsReviewCount = analysis.filter((a) => a.needs_review).length;
  const avgCorrect = analysis.length > 0
    ? Math.round(analysis.reduce((s, a) => s + a.correct_percentage, 0) / analysis.length)
    : 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">⚡ Concept Check Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {analysis.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No concept checks were run this session</p>
        ) : (
          <>
            {analysis.map((check) => (
              <button
                key={check.check_id}
                onClick={() => setExpandedId(expandedId === check.check_id ? null : check.check_id)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors text-left"
              >
                <CircleProgress percentage={check.correct_percentage} />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs ${expandedId === check.check_id ? "" : "line-clamp-2"}`}>
                    {check.question}
                  </p>
                  {check.needs_review ? (
                    <p className="text-[10px] text-amber-400 mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Most chose: {check.most_common_wrong_answer}
                    </p>
                  ) : (
                    <p className="text-[10px] text-green-400 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Class understood this well
                    </p>
                  )}
                </div>
              </button>
            ))}

            <div className="border-t border-border/50 pt-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Total: {analysis.length}</span>
              <span>Avg correct: {avgCorrect}%</span>
              <span className={needsReviewCount > 0 ? "text-amber-400" : ""}>
                Review needed: {needsReviewCount}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
