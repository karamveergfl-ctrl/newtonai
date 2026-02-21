import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, ChevronRight } from "lucide-react";
import type { ClassWithStats } from "@/hooks/useClasses";

interface ClassCardProps {
  classData: ClassWithStats;
}

export function ClassCard({ classData }: ClassCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/30 group"
      onClick={() => navigate(`/teacher/classes/${classData.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-1">{classData.name}</CardTitle>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </div>
        {classData.subject && (
          <Badge variant="secondary" className="w-fit">{classData.subject}</Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{classData.student_count || 0} students</span>
          </div>
          {classData.academic_year && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{classData.academic_year}</span>
            </div>
          )}
        </div>
        {classData.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{classData.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
