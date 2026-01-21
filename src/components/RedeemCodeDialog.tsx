import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Gift, Loader2, CheckCircle, XCircle, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface RedeemCodeDialogProps {
  trigger?: React.ReactNode;
  onCodeRedeemed?: (codeId: string, discountPercent: number) => void;
}

interface ValidatedCode {
  code_id: string;
  discount_percent: number;
  description: string | null;
}

export function RedeemCodeDialog({ trigger, onCodeRedeemed }: RedeemCodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validatedCode, setValidatedCode] = useState<ValidatedCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleValidateCode = async () => {
    if (!code.trim()) {
      setError("Please enter a code");
      return;
    }

    setIsValidating(true);
    setError(null);
    setValidatedCode(null);

    try {
      const { data, error: rpcError } = await supabase.rpc("validate_redeem_code", {
        p_code: code.trim().toUpperCase(),
      });

      if (rpcError) {
        throw rpcError;
      }

      const result = data as { success: boolean; error?: string; code_id?: string; discount_percent?: number; description?: string };

      if (!result.success) {
        setError(result.error || "Invalid code");
        return;
      }

      setValidatedCode({
        code_id: result.code_id!,
        discount_percent: result.discount_percent!,
        description: result.description || null,
      });

      // Notify parent component
      if (onCodeRedeemed) {
        onCodeRedeemed(result.code_id!, result.discount_percent!);
      }

      toast({
        title: "🎉 Code Applied!",
        description: `You'll get ${result.discount_percent}% off your first payment!`,
      });
    } catch (err: any) {
      console.error("Error validating code:", err);
      setError("Failed to validate code. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setCode("");
      setError(null);
      setValidatedCode(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Gift className="h-4 w-4" />
            Redeem Code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Redeem Code
          </DialogTitle>
          <DialogDescription>
            Enter a promo code to get a discount on your subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Input Section */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter code (e.g., WELCOME20)"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
                setValidatedCode(null);
              }}
              className={cn(
                "flex-1 uppercase tracking-wider font-mono",
                validatedCode && "border-green-500 focus-visible:ring-green-500"
              )}
              disabled={isValidating || !!validatedCode}
            />
            <Button
              onClick={handleValidateCode}
              disabled={isValidating || !code.trim() || !!validatedCode}
              className="shrink-0"
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Apply"
              )}
            </Button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
              >
                <XCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {validatedCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-full bg-green-500/20">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-300">
                      Code Applied Successfully!
                    </p>
                    {validatedCode.description && (
                      <p className="text-sm text-green-600/80 dark:text-green-400/80">
                        {validatedCode.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Discount Badge */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg mt-3"
                >
                  <Percent className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {validatedCode.discount_percent}% OFF
                  </span>
                </motion.div>

                <p className="text-xs text-center text-muted-foreground mt-3">
                  This discount will be applied to your first payment.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Note */}
          {!validatedCode && !error && (
            <p className="text-xs text-muted-foreground">
              Promo codes are case-insensitive and can only be used once per account.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
