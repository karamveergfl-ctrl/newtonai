import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { generateCredentialPDF } from "@/lib/smartboardCredentialPdf";
import { toast } from "sonner";

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: "You do not have permission to add boards for this school.",
  institution_not_found: "That school could not be found.",
  limit_reached: "This school has used all board slots on its plan. Raise the plan limit first.",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institutionId: string;
  institutionName: string;
  onCreated: () => void;
}

export function AddBoardModal({ open, onOpenChange, institutionId, institutionName, onCreated }: Props) {
  const [boardName, setBoardName] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ boardName: string; code: string } | null>(null);

  const reset = () => {
    setBoardName("");
    setGrade("");
    setSubject("");
    setCreated(null);
  };

  const handleCreate = async () => {
    if (!boardName.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("sb_create_board", {
      p_institution_id: institutionId,
      p_board_name: boardName.trim(),
      p_grade_level: grade.trim() || null,
      p_subject_focus: subject.trim() || null,
    });
    setSaving(false);

    const result = data as {
      success?: boolean;
      error?: string;
      activation_code?: string;
      board_name?: string;
      board?: { activation_code?: string; board_name?: string };
    } | null;
    if (error || !result?.success) {
      const code = result?.error ?? "";
      toast.error(ERROR_MESSAGES[code] ?? error?.message ?? "Could not create this board.");
      return;
    }

    setCreated({
      boardName: result.board?.board_name ?? result.board_name ?? boardName.trim(),
      code: result.board?.activation_code ?? result.activation_code ?? "",
    });
    onCreated();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>SmartBoard created</DialogTitle>
              <DialogDescription>
                Enter this code once on the classroom board. It stays signed in afterwards.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border border-border bg-muted/50 p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Activation code</p>
              <p className="mt-2 font-mono text-3xl font-bold tracking-[3px]">{created.code}</p>
              <p className="mt-3 text-sm text-muted-foreground">{created.boardName}</p>
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                variant="outline"
                onClick={() =>
                  generateCredentialPDF({
                    institutionName,
                    boardName: created.boardName,
                    activationCode: created.code,
                  })
                }
              >
                <Download className="mr-2 h-4 w-4" aria-hidden="true" /> Download credential PDF
              </Button>
              <Button
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add a SmartBoard</DialogTitle>
              <DialogDescription>Create a classroom board and generate its activation code.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sb-board-name">Board name</Label>
                <Input
                  id="sb-board-name"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="Class 6A — Science Lab"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="sb-grade">Grade level</Label>
                  <Input id="sb-grade" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Class 6" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sb-subject">Subject focus</Label>
                  <Input id="sb-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Science" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving || !boardName.trim()}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />} Create board
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AddBoardModal;