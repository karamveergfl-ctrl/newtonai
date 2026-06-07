import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, ChevronRight, Radio, Calendar, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { ClassWithStats } from "@/hooks/useClasses";

interface ClassCardProps {
  classData: ClassWithStats & { last_session_date?: string | null };
  onDelete?: (classId: string) => Promise<boolean> | boolean;
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

export function ClassCard({ classData, onDelete }: ClassCardProps) {
  const navigate = useNavigate();
  const borderColor = getSubjectBorderColor(classData.subject);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canConfirm = confirmText.trim().toLowerCase() === classData.name.trim().toLowerCase();

  const handleDelete = async () => {
    if (!onDelete || !canConfirm) return;
    setDeleting(true);
    try {
      const ok = await onDelete(classData.id);
      if (ok) {
        setDeleteOpen(false);
        setConfirmText("");
      }
    } finally {
      setDeleting(false);
    }
  };

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
          <div className="flex items-center gap-1 shrink-0">
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${classData.name}`}
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmText("");
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
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

      {onDelete && (
        <AlertDialog open={deleteOpen} onOpenChange={(o) => { if (!deleting) setDeleteOpen(o); }}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete “{classData.name}”?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the class, its enrollments, materials, and session history.
                {(classData.student_count ?? 0) > 0 && (
                  <> {classData.student_count} student{classData.student_count === 1 ? "" : "s"} will lose access.</>
                )} This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor={`confirm-${classData.id}`} className="text-sm">
                Type <span className="font-semibold text-foreground">{classData.name}</span> to confirm
              </Label>
              <Input
                id={`confirm-${classData.id}`}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={classData.name}
                autoComplete="off"
                disabled={deleting}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={!canConfirm || deleting}
                onClick={(e) => { e.preventDefault(); handleDelete(); }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting…</>) : "Delete class"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
