import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Share2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ClassQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteCode: string;
  className: string;
}

export function ClassQRModal({ open, onOpenChange, inviteCode, className }: ClassQRModalProps) {
  const joinLink = `${window.location.origin}/join-class?code=${inviteCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(joinLink);
    toast.success("Invite link copied!");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success("Invite code copied!");
  };

  const shareWhatsApp = () => {
    const text = `Join my class "${className}" on NewtonAI!\n\nUse code: ${inviteCode}\nOr click: ${joinLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader>
          <DialogTitle>Share Class — {className}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="p-4 bg-white rounded-xl">
            <QRCodeSVG value={joinLink} size={200} level="M" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Invite Code</p>
            <button
              onClick={copyCode}
              className="text-3xl font-mono font-bold tracking-[0.3em] text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              {inviteCode}
            </button>
          </div>
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={copyLink}>
              <Copy className="h-3.5 w-3.5" /> Copy Link
            </Button>
            <Button variant="outline" className="flex-1 gap-1.5" onClick={shareWhatsApp}>
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
