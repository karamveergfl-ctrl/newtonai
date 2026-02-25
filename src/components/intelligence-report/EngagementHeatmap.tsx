import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EngagementHeatmapItem } from "@/types/liveSession";

interface EngagementHeatmapProps {
  heatmapData: EngagementHeatmapItem[];
  totalSlides: number;
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-teal-600/80 border-teal-500/40";
  if (score >= 60) return "bg-teal-700/60 border-teal-600/30";
  if (score >= 40) return "bg-amber-600/50 border-amber-500/30";
  if (score >= 20) return "bg-orange-600/50 border-orange-500/30";
  return "bg-red-600/50 border-red-500/30";
}

export function EngagementHeatmap({ heatmapData, totalSlides }: EngagementHeatmapProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const allZero = heatmapData.every((d) => d.engagement_score === 0);

  if (allZero || heatmapData.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">🔥 Engagement Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Not enough data to calculate engagement
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">🔥 Engagement Heatmap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {heatmapData.map((item) => (
            <button
              key={item.slide_index}
              onClick={() =>
                setExpandedIndex(expandedIndex === item.slide_index ? null : item.slide_index)
              }
              className={`relative rounded-lg border p-2.5 h-20 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${scoreColor(item.engagement_score)}`}
            >
              <span className="text-[10px] font-mono text-foreground/60">
                Slide {item.slide_index + 1}
              </span>
              <p className="text-xs font-medium mt-0.5 line-clamp-2 text-foreground/90">
                {item.slide_title || `Slide ${item.slide_index + 1}`}
              </p>

              {expandedIndex === item.slide_index && (
                <div className="absolute inset-0 rounded-lg bg-background/95 border border-border p-2 z-10 flex flex-col justify-center gap-0.5 text-[10px] animate-fade-in">
                  <span>👆 {item.pulse_responses} pulse responses</span>
                  <span>📝 {item.annotations} annotations</span>
                  <span>❓ {item.questions_asked} questions</span>
                  <span className="font-semibold mt-0.5">Score: {Math.round(item.engagement_score)}/100</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground pt-1">
          <span>Low</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-2.5 rounded-sm bg-red-600/60" />
            <div className="w-4 h-2.5 rounded-sm bg-orange-600/60" />
            <div className="w-4 h-2.5 rounded-sm bg-amber-600/60" />
            <div className="w-4 h-2.5 rounded-sm bg-teal-700/70" />
            <div className="w-4 h-2.5 rounded-sm bg-teal-600/90" />
          </div>
          <span>High</span>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          Based on pulse responses, annotations, and questions
        </p>
      </CardContent>
    </Card>
  );
}
