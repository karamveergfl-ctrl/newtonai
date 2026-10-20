import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export type SendKind = "quiz" | "flashcards";
export type AssignmentKind = "quiz" | "flashcards" | "test";

interface QuizQ { question: string; options: string[]; correctIndex: number; explanation?: string }
interface Card { front: string; back: string }

/** Converts generated study content into the JSON stored in assignments.content. */
export function buildAssignmentContent(
  type: AssignmentKind,
  data: { questions?: QuizQ[]; cards?: Card[] },
) {
  if (type === "flashcards") {
    const cards = data.cards ?? (data.questions ?? []).map((q) => ({ front: q.question, back: q.options[q.correctIndex] ?? "" }));
    return { cards: cards.map((c) => ({ front: c.front, back: c.back })) };
  }
  const questions = data.questions ?? [];
  return {
    questions: questions.map((q) => ({
      question: q.question,
      options: q.options,
      correct_answer: q.options[q.correctIndex] ?? "",
      explanation: q.explanation ?? null,
    })),
  };
}

interface Props {
  kind: SendKind;
  defaultTitle: string;
  questions?: QuizQ[];
  cards?: Card[];
}

/** "Send to Class" button + dialog. Renders nothing for non-teachers. */
export function SendToClassButton({ kind, defaultTitle, questions, cards }: Props) {
  const { isTeacher } = useUserRole();
  const [open, setOpen] = useState(false);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState(defaultTitle);
  const [type, setType] = useState<AssignmentKind>(kind);
  const [dueDate, setDueDate] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [publishAt, setPublishAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(defaultTitle);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("classes").select("id, name").eq("teacher_id", user.id).eq("is_active", true).order("name");
      setClasses(data || []);
    })();
  }, [open, defaultTitle]);

  if (!isTeacher) return null;
  const hasContent = (questions?.length ?? 0) > 0 || (cards?.length ?? 0) > 0;
  // Flashcards can't become a graded quiz (no options)
  const canQuiz = (questions?.length ?? 0) > 0;

  const submit = async () => {
    if (selected.length === 0) return toast.error("Choose at least one class");
    if (!title.trim()) return toast.error("Add a title");
    const limit = timeLimit ? parseInt(timeLimit, 10) : null;
    if (limit !== null && (isNaN(limit) || limit < 1 || limit > 600)) return toast.error("Time limit must be 1–600 minutes");
    if (mode === "schedule" && !publishAt) return toast.error("Pick when to publish");
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const content = buildAssignmentContent(type, { questions, cards });
      const total = type === "flashcards" ? null : (content as { questions: unknown[] }).questions.length;
      const rows = selected.map((class_id) => ({
        class_id,
        teacher_id: user.id,
        title: title.trim().slice(0, 200),
        assignment_type: type,
        content,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        time_limit_minutes: type === "flashcards" ? null : limit,
        is_published: true,
        publish_at: mode === "schedule" ? new Date(publishAt).toISOString() : null,
        max_score: total,
      }));
      const { error } = await supabase.from("assignments").insert(rows);
      if (error) throw error;
      toast.success(`Sent to ${selected.length} class${selected.length > 1 ? "es" : ""}${mode === "schedule" ? " (scheduled)" : ""}`);
      setOpen(false);
      setSelected([]);
    } catch (e) {
      toast.error("Couldn't send: " + (e instanceof Error ? e.message : "unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1 h-8 md:h-9 text-xs md:text-sm" disabled={!hasContent} onClick={() => setOpen(true)}>
        <Send className="w-3 h-3 md:w-4 md:h-4" />
        <span className="hidden sm:inline">Send to Class</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="z-[80] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send to Class</DialogTitle>
            <DialogDescription>Students in the chosen classes will see this in their class page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Classes</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto rounded-md border border-border p-2">
                {classes.length === 0 ? <p className="text-xs text-muted-foreground">No active classes yet.</p> : classes.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selected.includes(c.id)} onCheckedChange={(v) => setSelected((s) => v ? [...s, c.id] : s.filter((x) => x !== c.id))} />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="stc-title">Title</Label>
              <Input id="stc-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </div>
            <div>
              <Label>Type</Label>
              <RadioGroup value={type} onValueChange={(v) => setType(v as AssignmentKind)} className="flex gap-4 mt-2">
                {(["quiz", "flashcards", "test"] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm capitalize">
                    <RadioGroupItem value={t} disabled={t !== "flashcards" && !canQuiz} /> {t === "flashcards" ? "Flashcards" : t === "quiz" ? "Quiz" : "Test"}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="stc-due">Due date</Label>
                <Input id="stc-due" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="stc-limit">Time limit (min)</Label>
                <Input id="stc-limit" type="number" min={1} max={600} placeholder="Optional" disabled={type === "flashcards"} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>When</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as "now" | "schedule")} className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="now" /> Publish now</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="schedule" /> Schedule</label>
              </RadioGroup>
              {mode === "schedule" && (
                <Input className="mt-2" type="datetime-local" aria-label="Publish at" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
