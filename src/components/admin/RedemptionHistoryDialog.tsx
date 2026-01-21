import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface RedemptionRecord {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  discount_percent: number;
  redeemed_at: string;
}

interface RedemptionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codeId: string | null;
  codeName: string;
}

export function RedemptionHistoryDialog({
  open,
  onOpenChange,
  codeId,
  codeName,
}: RedemptionHistoryDialogProps) {
  const [loading, setLoading] = useState(true);
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);

  useEffect(() => {
    if (open && codeId) {
      fetchRedemptions();
    }
  }, [open, codeId]);

  const fetchRedemptions = async () => {
    if (!codeId) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-redeem-codes`
      );
      url.searchParams.set("action", "history");
      url.searchParams.set("code_id", codeId);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch history");

      const data = await res.json();
      setRedemptions(data.redemptions || []);
    } catch (err) {
      console.error("Failed to fetch redemption history:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Redemption History: {codeName}</DialogTitle>
          <DialogDescription>
            Users who have redeemed this code
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : redemptions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No redemptions yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Redeemed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {redemptions.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.user_name || "N/A"}
                  </TableCell>
                  <TableCell>{r.user_email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{r.discount_percent}%</Badge>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(r.redeemed_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
