import React from 'react';
import { Button } from '@/components/ui/button';
import { useRazorpay } from '@/hooks/useRazorpay';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface PaymentButtonProps {
  planName: 'pro' | 'ultra';
  billingCycle: 'monthly' | 'yearly';
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  onSuccess?: () => void;
  disabled?: boolean;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  planName,
  billingCycle,
  children,
  className,
  variant = 'default',
  onSuccess,
  disabled = false,
}) => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(false);

  const handleSuccess = () => {
    onSuccess?.();
    navigate('/payment/success');
  };

  const handleFailure = () => {
    navigate('/payment/failure');
  };

  const { isLoading, isScriptLoaded, initiatePayment } = useRazorpay(handleSuccess, handleFailure);

  const handleClick = async () => {
    setIsCheckingAuth(true);
    
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Redirect to auth with return URL
      navigate('/auth?redirect=/pricing');
      setIsCheckingAuth(false);
      return;
    }

    setIsCheckingAuth(false);
    initiatePayment(planName, billingCycle);
  };

  const isDisabled = isLoading || isCheckingAuth || !isScriptLoaded || disabled;

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled}
      className={className}
      variant={variant}
    >
      {(isLoading || isCheckingAuth) && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {isLoading ? 'Processing...' : isCheckingAuth ? 'Checking...' : children}
    </Button>
  );
};
