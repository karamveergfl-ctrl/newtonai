import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, ChevronRight, Radio, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { ClassWithStats } from "@/hooks/useClasses";

interface ClassCardProps {
  classData: ClassWithStats & { last_session_date?: string | null };
}

const subjectColors: Record<string, string> = {
  math: "border-l-blue-500",
  mathematics: "border-l-blue-500",
  physics: "border-l-cyan-500",
  science: "border-l-teal-500",
  chemistry: "border-l-emerald-500",
  biology: "border-l-green-500",
  english: "border-l-amber-500",
  history: "border-l-orange-500",
  geography: "border-l-rose-500",
  computer: "border-l-violet-500",
  programming: "border-l-violet-500",
  default: "border-l-primary",
};

function getSubjectBorderColor(subject: string | null): string {
  if (!subject) return subjectColors.default;
  const key = subject.toLowerCase();
  for (const [k, v] of Object.entries(subjectColors)) {
    if (key.includes(k)) return v;
  }
  return subjectColors.default;
}

export function ClassCard({ classData }: ClassCardProps) {
  const navigate = useNavigate();
  const borderColor = getSubjectBorderColor(classData.subject);

  return (
    <Card
      className={cn(
        "cursor-pointer interactive-card group border-l-4 overflow-hidden",
        borderColor
      )}
      onClick={() => navigate(`/teacher/classes/${classData.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-1">{classData.name}</CardTitle>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </div>
        {classData.subject && (
          <Badge variant="secondary" className="w-fit text-xs">{classData.subject}</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50">
            <Users className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{classData.student_count || 0} students</span>
          </div>
          {classData.academic_year && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="text-xs">{classData.academic_year}</span>
            </div>
          )}
        </div>

        {/* Last session date */}
        {classData.last_session_date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Last session {formatDistanceToNow(new Date(classData.last_session_date), { addSuffix: true })}</span>
          </div>
        )}

        {classData.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{classData.description}</p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/teacher/classes/${classData.id}`);
            }}
          >
            Enter Classroom
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/teacher/classes/${classData.id}/live`);
            }}
          >
            <Radio className="h-3 w-3" />
            Go Live
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
