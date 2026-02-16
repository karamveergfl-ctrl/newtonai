import { Info } from "lucide-react";

export function ContentDisclaimer() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/50 text-sm text-muted-foreground">
      <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
      <p>
        AI-generated learning insights are reviewed for accuracy and educational usefulness. 
        Content is designed as a study aid and should be verified against authoritative academic sources.
      </p>
    </div>
  );
}
