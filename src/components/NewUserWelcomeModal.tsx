import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Video, 
  FileText, 
  Brain, 
  Mic, 
  PenTool, 
  Clock,
  ArrowRight,
  Crown,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NewUserWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

const freePlanFeatures = [
  { icon: Video, label: '20 Video Explanations', sublabel: 'per month', color: 'text-blue-400' },
  { icon: Brain, label: '3 Quizzes, Flashcards & Maps', sublabel: 'per month', color: 'text-purple-400' },
  { icon: FileText, label: '2 AI Notes & Summaries', sublabel: 'per month', color: 'text-green-400' },
  { icon: Mic, label: '1 AI Podcast', sublabel: 'per month', color: 'text-orange-400' },
  { icon: PenTool, label: '5 Homework Helps', sublabel: 'per day', color: 'text-pink-400' },
  { icon: Clock, label: '20 min Transcription', sublabel: 'per month', color: 'text-cyan-400' },
];

const upgradeHighlights = [
  'Unlimited video explanations',
  'Unlimited homework help',
  'Up to 900 min transcription',
  'Priority AI processing',
];

export function NewUserWelcomeModal({ isOpen, onClose, userName }: NewUserWelcomeModalProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleGetStarted = () => {
    onClose();
    navigate('/');
  };

  const handleViewPlans = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <AnimatePresence mode="wait">
          {currentStep === 0 ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              {/* Header */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 mb-4"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Welcome{userName ? `, ${userName}` : ''}! 🎉
                </h2>
                <p className="text-muted-foreground">
                  Your AI study companion is ready
                </p>
              </div>

              {/* Free Plan Badge */}
              <div className="flex justify-center mb-6">
                <Badge variant="secondary" className="px-4 py-2 text-sm bg-green-500/10 text-green-500 border-green-500/20">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Free Plan Activated
                </Badge>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {freePlanFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/50"
                  >
                    <feature.icon className={`w-5 h-5 ${feature.color} flex-shrink-0 mt-0.5`} />
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight">{feature.label}</p>
                      <p className="text-xs text-muted-foreground">{feature.sublabel}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => setCurrentStep(1)} 
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="ghost" onClick={handleGetStarted} className="text-muted-foreground">
                  Skip & Start Studying
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upgrade"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              {/* Header */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 mb-4"
                >
                  <Crown className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Want More Power? 💪
                </h2>
                <p className="text-muted-foreground">
                  Upgrade to unlock unlimited features
                </p>
              </div>

              {/* Upgrade Benefits */}
              <div className="space-y-3 mb-6">
                {upgradeHighlights.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-600/10 border border-primary/20"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              {/* Pricing Teaser */}
              <div className="text-center mb-6 p-4 rounded-lg bg-card/50 border border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Pro plans starting at</p>
                <p className="text-2xl font-bold text-foreground">₹149<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleViewPlans} 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-500/90 hover:to-orange-600/90"
                >
                  View All Plans
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="ghost" onClick={handleGetStarted} className="text-muted-foreground">
                  Start with Free Plan
                </Button>
              </div>

              {/* Back Button */}
              <button 
                onClick={() => setCurrentStep(0)}
                className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
              >
                ← Back to features
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
