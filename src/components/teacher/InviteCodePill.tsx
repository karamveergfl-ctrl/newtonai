import { useState } from "react";
import { Copy, Check, Link } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InviteCodePillProps {
  code: string;
  className?: string;
}

export function InviteCodePill({ code, className }: InviteCodePillProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/join-class?code=${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={copyCode}
        className="glass rounded-full px-4 py-1.5 flex items-center gap-2 group cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-[var(--shadow-glow)]"
      >
        <code className="text-sm font-mono font-bold tracking-[0.2em] text-primary">
          {code}
        </code>
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </button>
      <button
        onClick={copyLink}
        className="glass rounded-full p-1.5 cursor-pointer transition-all duration-200 hover:border-primary/40 hover:text-primary text-muted-foreground"
        title="Copy invite link"
      >
        <Link className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
