import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopicScore } from "@/types/liveSession";

interface TopicScoreListProps {
  topicScores: TopicScore[];
}

function scoreBarColor(score: number) {
  if (score >= 80) return "bg-teal-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function borderAccent(score: number | null) {
  if (score === null) return "";
  if (score >= 70) return "border-l-2 border-l-green-500/60";
  if (score < 50) return "border-l-2 border-l-red-500/60";
  return "";
}

function pulseEmoji(status: string | null) {
  if (status === "got_it") return "😊";
  if (status === "slightly_lost") return "😐";
  if (status === "lost") return "😕";
  return "—";
}

function checkIcon(correct: boolean | null) {
  if (correct === true) return <span className="text-green-500">✓</span>;
  if (correct === false) return <span className="text-red-500">✗</span>;
  return <span className="text-muted-foreground">—</span>;
}

export function TopicScoreList({ topicScores }: TopicScoreListProps) {
  if (topicScores.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Your Topic Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Not enough activity to calculate topic scores
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Your Topic Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {topicScores.map((ts) => (
          <div key={ts.slide_index} className={`flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors ${borderAccent(ts.score)}`}>
            <span className="text-[10px] font-mono text-muted-foreground w-6 shrink-0 text-center">
              {ts.slide_index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{ts.slide_title || `Slide ${ts.slide_index + 1}`}</p>
              {ts.score !== null ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                    <div className={`h-full rounded-full ${scoreBarColor(ts.score)} transition-all duration-500`} style={{ width: `${ts.score}%` }} />
                  </div>
                  <span className="text-[10px] font-medium tabular-nums w-7 text-right">{ts.score}%</span>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground">No data</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <span title="Pulse">{pulseEmoji(ts.indicators.pulse_status)}</span>
              <span title="Concept check">{checkIcon(ts.indicators.concept_check_correct)}</span>
              <span title="Annotations" className={ts.indicators.has_annotations ? "text-teal-400" : "text-muted-foreground/40"}>📝</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
