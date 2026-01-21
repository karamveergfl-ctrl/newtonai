import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRazorpay } from '@/hooks/useRazorpay';
import { Loader2, Lock, ShieldCheck, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentButtonProps {
  planName: 'pro' | 'ultra';
  billingCycle: 'monthly' | 'yearly';
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  onSuccess?: () => void;
  onPaymentStart?: () => void;
  onPaymentEnd?: () => void;
  disabled?: boolean;
  discountPercent?: number;
  redeemCodeId?: string | null;
}

const steps = [
  { icon: ShieldCheck, label: 'Verifying account' },
  { icon: CreditCard, label: 'Creating order' },
  { icon: Lock, label: 'Opening payment' },
];

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  planName,
  billingCycle,
  children,
  className,
  variant = 'default',
  onSuccess,
  onPaymentStart,
  onPaymentEnd,
  disabled = false,
  discountPercent = 0,
  redeemCodeId = null,
}) => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-advance animation for visual feedback
  useEffect(() => {
    if (!showProgress) {
      setCurrentStep(0);
      return;
    }
  }, [showProgress]);

  const handleProgress = (value: number, _message: string) => {
    // Map progress values to steps
    if (value >= 70) {
      setCurrentStep(2);
    } else if (value >= 40) {
      setCurrentStep(1);
    } else {
      setCurrentStep(0);
    }
    
    // Close overlay when payment window opens
    if (value >= 90) {
      setShowProgress(false);
      onPaymentStart?.();
    }
  };

  const handleSuccess = () => {
    setShowProgress(false);
    onPaymentEnd?.();
    onSuccess?.();
    navigate('/payment/success');
  };

  const handleFailure = () => {
    setShowProgress(false);
    onPaymentEnd?.();
    navigate('/payment/failure');
  };

  const handleModalClose = () => {
    // Modal was closed without completing payment - reset UI state
    onPaymentEnd?.();
  };

  const { isLoading, isScriptLoaded, initiatePayment } = useRazorpay(handleSuccess, handleFailure, handleModalClose);

  const handleClick = async () => {
    console.log('PaymentButton clicked', { planName, billingCycle, isScriptLoaded, isLoading });
    
    setShowProgress(true);
    setCurrentStep(0);
    setIsCheckingAuth(true);
    
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth session check:', session ? 'logged in' : 'not logged in');
    
    if (!session) {
      setShowProgress(false);
      navigate('/auth?redirect=/pricing');
      setIsCheckingAuth(false);
      return;
    }

    setIsCheckingAuth(false);
    console.log('Calling initiatePayment...', { discountPercent, redeemCodeId });
    initiatePayment(planName, billingCycle, handleProgress, discountPercent, redeemCodeId ?? undefined);
  };

  const isDisabled = isLoading || isCheckingAuth || !isScriptLoaded || disabled;

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        className={className}
        variant={variant}
      >
        {children}
      </Button>

      <AnimatePresence>
        {showProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
              className="bg-card border border-border rounded-2xl p-8 shadow-2xl w-[90%] max-w-sm mx-4"
            >
              <div className="flex flex-col items-center">
                {/* Animated Logo/Icon */}
                <motion.div
                  className="relative mb-6"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-8 w-8 text-primary" />
                    </motion.div>
                  </div>
                  {/* Pulse ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                  />
                </motion.div>

                {/* Steps indicator */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isComplete = index < currentStep;
                    
                    return (
                      <motion.div
                        key={step.label}
                        className="flex flex-col items-center"
                        initial={false}
                        animate={{
                          scale: isActive ? 1.1 : 1,
                          opacity: isComplete ? 0.5 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                            isActive 
                              ? 'bg-primary text-primary-foreground' 
                              : isComplete 
                                ? 'bg-primary/20 text-primary' 
                                : 'bg-muted text-muted-foreground'
                          }`}
                          animate={isActive ? { 
                            boxShadow: ['0 0 0 0 rgba(var(--primary), 0)', '0 0 0 8px rgba(var(--primary), 0.1)', '0 0 0 0 rgba(var(--primary), 0)']
                          } : {}}
                          transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                        >
                          <Icon className="h-5 w-5" />
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Current step label */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium text-foreground mb-2"
                  >
                    {steps[currentStep]?.label}...
                  </motion.p>
                </AnimatePresence>

                {/* Animated dots */}
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{ 
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
