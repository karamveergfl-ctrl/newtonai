import { cn } from "@/lib/utils";
import { subjectsList } from "./toolPromoData";

interface ToolPageSubjectsProps {
  title?: string;
  className?: string;
}

export function ToolPageSubjects({ title = "Works for All Subjects", className }: ToolPageSubjectsProps) {
  return (
    <div className={cn("w-full", className)}>
      <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-8">
        {title}
      </h2>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
        {subjectsList.map((subject) => (
          <div
            key={subject.name}
            className="flex flex-col items-center justify-center p-3 md:p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-200 cursor-default"
          >
            <span className="text-2xl md:text-3xl mb-2">
              {subject.icon}
            </span>
            <span className="text-xs md:text-sm font-medium text-foreground text-center leading-tight">
              {subject.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}