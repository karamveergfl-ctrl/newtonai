import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRazorpay } from '@/hooks/useRazorpay';
import { Loader2, Lock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
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
}

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
}) => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const handleProgress = (value: number, message: string) => {
    setProgress(value);
    setStatusMessage(message);
    // Notify parent when payment gateway opens (progress >= 90)
    if (value >= 90) {
      onPaymentStart?.();
    }
  };

  const handleSuccess = () => {
    setShowProgress(false);
    setProgress(0);
    onPaymentEnd?.();
    onSuccess?.();
    navigate('/payment/success');
  };

  const handleFailure = () => {
    setShowProgress(false);
    setProgress(0);
    onPaymentEnd?.();
    navigate('/payment/failure');
  };

  const { isLoading, isScriptLoaded, initiatePayment } = useRazorpay(handleSuccess, handleFailure);

  const handleClick = async () => {
    console.log('PaymentButton clicked', { planName, billingCycle, isScriptLoaded, isLoading });
    
    setShowProgress(true);
    setProgress(10);
    setStatusMessage('Verifying your account...');
    setIsCheckingAuth(true);
    
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth session check:', session ? 'logged in' : 'not logged in');
    
    if (!session) {
      // Redirect to auth with return URL
      setShowProgress(false);
      navigate('/auth?redirect=/pricing');
      setIsCheckingAuth(false);
      return;
    }

    setIsCheckingAuth(false);
    console.log('Calling initiatePayment...');
    initiatePayment(planName, billingCycle, handleProgress);
  };

  const handleCancel = () => {
    setShowProgress(false);
    setProgress(0);
    onPaymentEnd?.();
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
        {(isLoading || isCheckingAuth) && !showProgress && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {isLoading && !showProgress ? 'Processing...' : isCheckingAuth && !showProgress ? 'Checking...' : children}
      </Button>

      <AnimatePresence>
        {showProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative bg-card border border-border rounded-2xl p-8 shadow-2xl w-[90%] max-w-md mx-4"
            >
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="flex flex-col items-center space-y-6">
                <div className="flex items-center space-x-2 text-primary">
                  <Lock className="h-5 w-5" />
                  <span className="font-semibold">Secure Payment</span>
                </div>

                <div className="w-full space-y-3">
                  <div className="relative">
                    <Progress 
                      value={progress} 
                      className="h-3 bg-muted"
                    />
                    <motion.div
                      className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      style={{ width: '50%' }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <motion.p
                      key={statusMessage}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-muted-foreground"
                    >
                      {statusMessage}
                    </motion.p>
                    <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Please wait, do not close this window</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
