import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Link } from "lucide-react";
import { toast } from "sonner";

interface InviteCodeCardProps {
  code: string;
  className?: string;
}

export function InviteCodeCard({ code, className }: InviteCodeCardProps) {
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
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Invite Code</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <code className="text-2xl font-mono font-bold tracking-widest text-primary">{code}</code>
          <Button variant="ghost" size="icon" onClick={copyCode} className="shrink-0">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={copyLink} className="mt-2 gap-2">
          <Link className="h-3 w-3" />
          Copy Invite Link
        </Button>
      </CardContent>
    </Card>
  );
}
