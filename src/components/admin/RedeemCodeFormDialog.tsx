import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface RedeemCodeFormData {
  code: string;
  discount_percent: number;
  description: string;
  max_uses: number | null;
  valid_from: Date;
  valid_until: Date | null;
  is_active: boolean;
}

interface RedeemCodeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RedeemCodeFormData) => Promise<void>;
  initialData?: Partial<RedeemCodeFormData>;
  isEditing?: boolean;
}

export function RedeemCodeFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false,
}: RedeemCodeFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RedeemCodeFormData>({
    code: "",
    discount_percent: 10,
    description: "",
    max_uses: null,
    valid_from: new Date(),
    valid_until: null,
    is_active: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || "",
        discount_percent: initialData.discount_percent || 10,
        description: initialData.description || "",
        max_uses: initialData.max_uses ?? null,
        valid_from: initialData.valid_from ? new Date(initialData.valid_from) : new Date(),
        valid_until: initialData.valid_until ? new Date(initialData.valid_until) : null,
        is_active: initialData.is_active ?? true,
      });
    } else {
      setFormData({
        code: "",
        discount_percent: 10,
        description: "",
        max_uses: null,
        valid_from: new Date(),
        valid_until: null,
        is_active: true,
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        code: formData.code.toUpperCase(),
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Redeem Code" : "Create New Redeem Code"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the redeem code settings below."
              : "Create a new discount code for users."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              placeholder="e.g., SUMMER25"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              required
              disabled={isEditing}
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount %</Label>
              <Input
                id="discount"
                type="number"
                min="1"
                max="100"
                value={formData.discount_percent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount_percent: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_uses">Max Uses (empty = unlimited)</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={formData.max_uses ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_uses: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g., Summer sale discount"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valid From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.valid_from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.valid_from
                      ? format(formData.valid_from, "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.valid_from}
                    onSelect={(date) =>
                      setFormData({ ...formData, valid_from: date || new Date() })
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Valid Until (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.valid_until && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.valid_until
                      ? format(formData.valid_until, "PPP")
                      : "No expiry"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.valid_until || undefined}
                    onSelect={(date) =>
                      setFormData({ ...formData, valid_until: date || null })
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="is_active">Active</Label>
              <p className="text-sm text-muted-foreground">
                Code can be redeemed by users
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Code"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
