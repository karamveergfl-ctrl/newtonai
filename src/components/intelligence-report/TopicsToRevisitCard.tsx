import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TopicToRevisit } from "@/types/liveSession";

interface TopicsToRevisitCardProps {
  topics: TopicToRevisit[];
  aiFailed?: boolean;
}

const priorityConfig = {
  high: { label: "HIGH", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  medium: { label: "MEDIUM", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  low: { label: "LOW", className: "bg-muted text-muted-foreground border-border" },
};

const priorityOrder = { high: 0, medium: 1, low: 2 };

export function TopicsToRevisitCard({ topics, aiFailed }: TopicsToRevisitCardProps) {
  const sorted = [...topics].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">📚 Topics to Revisit Next Class</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {aiFailed && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-xs text-amber-400">
            AI analysis unavailable — showing raw data only
          </div>
        )}

        {sorted.length === 0 ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-400">Great session! No topics flagged for review</span>
          </div>
        ) : (
          sorted.map((topic, i) => {
            const config = priorityConfig[topic.priority];
            return (
              <div key={i}>
                {i > 0 && <Separator className="mb-2" />}
                <div className={cn("flex items-start gap-2.5", 
                  topic.priority === "high" && "border-l-4 border-l-red-500 pl-3",
                  topic.priority === "medium" && "border-l-4 border-l-amber-500 pl-3",
                  topic.priority === "low" && "border-l-4 border-l-muted-foreground pl-3"
                )}>
                  <Badge variant="outline" className={`text-[9px] shrink-0 mt-0.5 ${config.className}`}>
                    {config.label}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{topic.topic}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{topic.reason}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
