import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { LogIn, UserPlus, Sparkles, BookOpen, Brain, Layers } from "lucide-react";
import Logo from "@/components/Logo";

interface SignInRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnTo?: string;
}

export function SignInRequiredModal({ open, onOpenChange, returnTo }: SignInRequiredModalProps) {
  const navigate = useNavigate();

  const handleSignIn = () => {
    const returnPath = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
    navigate(`/auth${returnPath}`);
    onOpenChange(false);
  };

  const handleSignUp = () => {
    const returnPath = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
    navigate(`/auth${returnPath}`);
    onOpenChange(false);
  };

  const handleClose = () => {
    navigate("/");
    onOpenChange(false);
  };

  const features = [
    { icon: BookOpen, label: "AI Notes", color: "text-teal-500" },
    { icon: Brain, label: "Smart Quiz", color: "text-purple-500" },
    { icon: Layers, label: "Flashcards", color: "text-blue-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-border/50 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="text-center space-y-4 pb-2">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            <Logo size="md" />
          </motion.div>

          {/* Sparkle Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
            className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.div>

          <DialogTitle className="text-xl font-bold text-foreground">
            Sign in to continue
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm max-w-xs mx-auto">
            Create a free account to access AI-powered study tools and boost your learning.
          </DialogDescription>
        </DialogHeader>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex justify-center gap-2 py-4"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50"
              >
                <Icon className={`w-3.5 h-3.5 ${feature.color}`} />
                <span className="text-xs font-medium text-foreground">{feature.label}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
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
        </motion.div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="text-center text-xs text-muted-foreground pt-2"
        >
          Free forever • No credit card required
        </motion.p>
      </DialogContent>
    </Dialog>
  );
}
