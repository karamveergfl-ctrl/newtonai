import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Megaphone, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  classId: string;
}

export function ClassAnnouncementInput({ classId }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [pinned, setPinned] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }

    const { error } = await supabase
      .from("class_announcements" as any)
      .insert({ class_id: classId, teacher_id: user.id, title: title.trim(), message: message.trim(), is_pinned: pinned } as any);

    setSending(false);
    if (error) {
      toast.error("Failed to post announcement");
    } else {
      toast.success("Announcement posted!");
      setTitle("");
      setMessage("");
      setPinned(false);
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5 mb-4" onClick={() => setOpen(true)}>
        <Megaphone className="h-3.5 w-3.5" /> Post Announcement
      </Button>
    );
  }

  return (
    <Card className="border-border/50 mb-4">
      <CardContent className="pt-4 pb-3 space-y-3">
        <Input placeholder="Announcement title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="Message to students..." value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch id="pin" checked={pinned} onCheckedChange={setPinned} />
            <Label htmlFor="pin" className="text-xs">Pin to top</Label>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSend} disabled={sending || !title.trim() || !message.trim()}>
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Send className="h-3.5 w-3.5 mr-1" /> Post</>}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
