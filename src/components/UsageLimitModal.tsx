import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UsageLimitModalProps {
  open: boolean;
  onClose: () => void;
  featureName: string;
  currentUsage: number;
  limit: number;
}

export function UsageLimitModal({ open, onClose, featureName, currentUsage, limit }: UsageLimitModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center"
          >
            <Lock className="h-8 w-8 text-destructive" />
          </motion.div>
          <DialogTitle className="text-center">Usage Limit Reached</DialogTitle>
          <DialogDescription className="text-center">
            You've used all {limit} of your free {featureName} for this period.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{currentUsage}/{limit}</p>
            <p className="text-sm text-muted-foreground">Uses consumed</p>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={() => {
                onClose();
                navigate("/pricing");
              }}
              className="w-full bg-gradient-to-r from-primary to-secondary"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Pro users get unlimited access to all features
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
