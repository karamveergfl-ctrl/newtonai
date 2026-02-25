import { useStudentReport } from "@/hooks/useStudentReport";
import { ReportGeneratingState } from "./ReportGeneratingState";
import { UnderstandingScoreRing } from "./UnderstandingScoreRing";
import { TopicScoreList } from "./TopicScoreList";
import { KnowledgeGapCard } from "./KnowledgeGapCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

interface StudentReportPageProps {
  sessionId: string;
}

function scoreMessage(score: number) {
  if (score >= 80) return "Excellent session! You understood most of this.";
  if (score >= 60) return "Good session! A few areas to review.";
  if (score >= 40) return "Some challenging topics today — let's review.";
  return "Tough session — but that's okay! Let's fill the gaps.";
}

export function StudentReportPage({ sessionId }: StudentReportPageProps) {
  const { report, videoResults, status, isLoading, activeGapIndex, setActiveGap, fetchReport } =
    useStudentReport({ sessionId });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (status === "generating" || status === "idle") {
    return <ReportGeneratingState role="student" />;
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <p className="text-sm text-destructive">Report generation failed</p>
        <Button variant="outline" size="sm" onClick={() => fetchReport()} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </Button>
      </div>
    );
  }

  if (!report) return null;

  const gaps = report.knowledge_gaps;
  const hasGaps = gaps.length > 0;

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Class Report 📊</h2>
        <Link to={`/session-notes/${sessionId}`}>
          <Button variant="outline" size="sm" className="text-xs h-7">
            View Notes
          </Button>
        </Link>
      </div>

      {/* Score Hero */}
      <Card className="border-border/50">
        <CardContent className="py-6 flex flex-col items-center gap-3">
          <UnderstandingScoreRing score={report.understanding_score} size="large" />
          <p className="text-sm text-center text-muted-foreground max-w-xs">
            {scoreMessage(report.understanding_score)}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasGaps
              ? `${gaps.length} knowledge gap${gaps.length > 1 ? "s" : ""} identified`
              : "No gaps found! 🎉"}
          </p>
        </CardContent>
      </Card>

      {/* Topic Breakdown */}
      <TopicScoreList topicScores={report.topic_scores} />

      {/* Knowledge Gaps */}
      {hasGaps ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">📚 Topics to Review</p>
          {gaps.map((gap, i) => {
            const gapFlashcards = report.revision_flashcards.filter(
              (fc) => fc.slide_index === gap.slide_index
            );
            const video = videoResults.find((v) => v.topic === gap.topic) ?? null;
            // Default first HIGH gap expanded
            const isExpanded = activeGapIndex === null
              ? i === gaps.findIndex((g) => g.severity === "high") || (i === 0 && !gaps.some((g) => g.severity === "high"))
              : activeGapIndex === i;

            return (
              <KnowledgeGapCard
                key={i}
                gap={gap}
                flashcards={gapFlashcards}
                videoResult={video}
                isExpanded={isExpanded}
                onToggle={() => setActiveGap(isExpanded ? null : i)}
              />
            );
          })}
        </div>
      ) : (
        <Card className="border-border/50 border-green-500/20">
          <CardContent className="py-6 text-center space-y-2">
            <p className="text-lg">🎉 Great work!</p>
            <p className="text-sm text-muted-foreground">No knowledge gaps detected.</p>
            <p className="text-xs text-muted-foreground">You can still review your session notes:</p>
            <Link to={`/session-notes/${sessionId}`}>
              <Button variant="outline" size="sm" className="text-xs mt-1">
                View Session Notes →
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
