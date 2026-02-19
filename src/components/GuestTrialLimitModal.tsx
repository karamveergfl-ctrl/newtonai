import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserPlus, LogIn, Save, Sparkles, Shield, RefreshCw } from "lucide-react";
import Logo from "@/components/Logo";

interface GuestTrialLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GuestTrialLimitModal({ open, onOpenChange }: GuestTrialLimitModalProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const returnPath = `?returnTo=${encodeURIComponent(location.pathname)}`;

  const handleSignUp = () => {
    navigate(`/auth${returnPath}`);
    onOpenChange(false);
  };

  const handleSignIn = () => {
    navigate(`/auth${returnPath}`);
    onOpenChange(false);
  };

  const benefits = [
    { icon: Save, label: "Save study materials" },
    { icon: RefreshCw, label: "Unlimited AI tools" },
    { icon: Shield, label: "Sync across devices" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="text-center space-y-4 pb-2">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            <Logo size="md" />
          </motion.div>

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
            className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.div>

          <DialogTitle className="text-xl font-bold text-foreground">
            Save Your Progress — Create Your Free Account
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm max-w-xs mx-auto">
            You've used your free trial. Sign up to continue learning and keep your generated notes, quizzes, and insights.
          </DialogDescription>
        </DialogHeader>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-2.5 py-4"
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted/50 border border-border/50"
              >
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">{benefit.label}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="space-y-3 pt-2"
        >
          <Button
            onClick={handleSignUp}
            className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create Free Account
          </Button>

          <Button
            onClick={handleSignIn}
            variant="outline"
            className="w-full h-11 text-base font-medium border-border hover:bg-muted/50"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>

          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            Maybe Later
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="text-center text-xs text-muted-foreground pt-1"
        >
          Free forever • No credit card required
        </motion.p>
      </DialogContent>
    </Dialog>
  );
}
