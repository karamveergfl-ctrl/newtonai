import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface UseRazorpayReturn {
  isLoading: boolean;
  isScriptLoaded: boolean;
  initiatePayment: (
    planName: 'pro' | 'ultra', 
    billingCycle: 'monthly' | 'yearly', 
    onProgress?: (progress: number, message: string) => void,
    discountPercent?: number,
    redeemCodeId?: string | null
  ) => Promise<void>;
}

export const useRazorpay = (onSuccess?: () => void, onFailure?: () => void, onModalClose?: () => void): UseRazorpayReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const { toast } = useToast();

  // Load Razorpay script
  useEffect(() => {
    if (window.Razorpay) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      toast({
        title: 'Error',
        description: 'Failed to load payment gateway. Please refresh and try again.',
        variant: 'destructive',
      });
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove the script as it might be used by other components
    };
  }, [toast]);

  const initiatePayment = useCallback(async (
    planName: 'pro' | 'ultra',
    billingCycle: 'monthly' | 'yearly',
    onProgress?: (progress: number, message: string) => void,
    discountPercent: number = 0,
    redeemCodeId: string | null = null
  ) => {
    if (!isScriptLoaded) {
      toast({
        title: 'Please wait',
        description: 'Payment gateway is loading...',
      });
      return;
    }

    setIsLoading(true);
    onProgress?.(20, 'Verifying your account...');

    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to continue with the purchase.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      onProgress?.(40, 'Creating secure order...');

      // Create order with discount info
      const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay-create-order', {
        body: { 
          plan_name: planName, 
          billing_cycle: billingCycle,
          discount_percent: discountPercent,
          redeem_code_id: redeemCodeId,
        },
      });

      if (orderError || !orderData) {
        console.error('Order creation error:', orderError);
        throw new Error(orderError?.message || 'Failed to create order');
      }

      onProgress?.(70, 'Initializing payment gateway...');

      const planLabels = {
        pro: 'Pro Plan',
        ultra: 'Ultra Plan',
      };

      const options: RazorpayOptions = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'newtonAI',
        description: `${planLabels[planName]} - ${billingCycle === 'yearly' ? 'Annual' : 'Monthly'} Subscription`,
        order_id: orderData.order_id,
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay-verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_name: planName,
                billing_cycle: billingCycle,
              },
            });

            if (verifyError || !verifyData?.success) {
              console.error('Payment verification error:', verifyError);
              toast({
                title: 'Payment verification failed',
                description: 'Please contact support if money was deducted.',
                variant: 'destructive',
              });
              onFailure?.();
              return;
            }

            toast({
              title: '🎉 Payment successful!',
              description: `Welcome to ${planLabels[planName]}! Your subscription is now active.`,
            });
            onSuccess?.();
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: 'Payment verification failed',
              description: 'Please contact support if money was deducted.',
              variant: 'destructive',
            });
            onFailure?.();
          }
        },
        prefill: {
          email: session.user.email,
        },
        theme: {
          color: '#7c3aed',
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            onModalClose?.();
          },
        },
      };

      onProgress?.(90, 'Opening payment window...');

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        toast({
          title: 'Payment failed',
          description: response.error.description || 'Please try again.',
          variant: 'destructive',
        });
        onFailure?.();
      });
      razorpay.open();
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast({
        title: 'Payment error',
        description: error.message || 'Failed to initiate payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isScriptLoaded, toast, onSuccess, onFailure, onModalClose]);

  return {
    isLoading,
    isScriptLoaded,
    initiatePayment,
  };
};
