import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ReportGeneratingStateProps {
  role: "teacher" | "student";
  estimatedSeconds?: number;
}

export function ReportGeneratingState({ role, estimatedSeconds = 30 }: ReportGeneratingStateProps) {
  const [remaining, setRemaining] = useState(estimatedSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const title = role === "teacher"
    ? "Analysing your class session..."
    : "Building your personal report...";

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="border-border/50 bg-card max-w-md w-full">
        <CardContent className="pt-8 pb-6 flex flex-col items-center gap-5 text-center">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
          </div>

          <div className="space-y-1.5">
            <p className="text-lg font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">
              This usually takes about {estimatedSeconds} seconds
            </p>
          </div>

          {/* Indeterminate progress bar */}
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden relative">
            <div className="absolute inset-0 report-indeterminate-bar" />
          </div>

          <p className="text-xs text-muted-foreground">
            {remaining > 0
              ? `Ready in approximately ${remaining}s`
              : "Almost there..."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
