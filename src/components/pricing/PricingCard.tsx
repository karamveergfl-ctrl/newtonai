import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Loader2, Sparkles, Zap, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PaymentButton } from '@/components/PaymentButton';
import { CurrencyCode, DISPLAY_PRICING } from '@/lib/currencyUtils';

interface PricingCardProps {
  plan: {
    name: string;
    description: string;
    features: string[];
    cta: string;
    popular?: boolean;
  };
  index: number;
  isYearly: boolean;
  currency: CurrencyCode;
  isCurrentPlan: boolean;
  isVerifying: boolean;
  onPaymentStart: () => void;
  onPaymentEnd: () => void;
  onPaymentSuccess: () => void;
  discountPercent: number;
  redeemCodeId: string | null;
  disabled: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  index,
  isYearly,
  currency,
  isCurrentPlan,
  isVerifying,
  onPaymentStart,
  onPaymentEnd,
  onPaymentSuccess,
  discountPercent,
  redeemCodeId,
  disabled,
}) => {
  const planKey = plan.name.toLowerCase() as 'free' | 'pro' | 'ultra';
  const isPaid = planKey !== 'free';
  
  // Get prices from centralized config
  const getDisplayPrice = (type: 'weeklyMonthly' | 'weeklyYearly' | 'monthly' | 'yearly') => {
    if (!isPaid) return currency === 'INR' ? '₹0' : '$0';
    return DISPLAY_PRICING[planKey as 'pro' | 'ultra'][type][currency];
  };
  
  const getSavings = () => {
    if (!isPaid) return null;
    return DISPLAY_PRICING[planKey as 'pro' | 'ultra'].yearlySavings[currency];
  };

  const weeklyPrice = isPaid 
    ? (isYearly ? getDisplayPrice('weeklyYearly') : getDisplayPrice('weeklyMonthly'))
    : getDisplayPrice('monthly');
    
  const billingPrice = isPaid 
    ? (isYearly ? getDisplayPrice('yearly') : getDisplayPrice('monthly'))
    : null;

  const getPlanIcon = () => {
    switch (planKey) {
      case 'pro': return <Zap className="h-5 w-5" />;
      case 'ultra': return <Crown className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };

  const getPlanGradient = () => {
    switch (planKey) {
      case 'pro': return 'from-primary/10 via-primary/5 to-transparent';
      case 'ultra': return 'from-amber-500/10 via-orange-500/5 to-transparent';
      default: return 'from-muted/50 to-transparent';
    }
  };

  const getBorderClass = () => {
    if (plan.popular) return 'border-primary shadow-lg shadow-primary/20';
    if (planKey === 'ultra') return 'border-amber-500/50';
    return 'border-border';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: 0.2 + index * 0.15,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        y: -8, 
        scale: plan.popular ? 1.02 : 1.03,
      }}
      className="relative"
    >
      <Card className={`relative h-full overflow-visible ${getBorderClass()} ${plan.popular ? 'scale-[1.02] z-10' : ''}`}>
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-b ${getPlanGradient()} rounded-lg pointer-events-none`} />
        
        {/* Verifying Payment Overlay */}
        <AnimatePresence>
          {isVerifying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-card/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 rounded-lg"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mb-4"
              >
                <Loader2 className="h-8 w-8 text-primary" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Please complete your payment in the popup window
              </p>
              <div className="w-full space-y-3 opacity-50">
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
              </div>
              <motion.div 
                className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Waiting for confirmation...
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Popular Badge */}
        {plan.popular && (
          <motion.div 
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, type: "spring" }}
          >
            <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1.5 rounded-full shadow-lg">
              Most Popular
            </span>
          </motion.div>
        )}
        
        {/* Current Plan Badge */}
        {isCurrentPlan && (
          <motion.div 
            className="absolute -top-3 right-4 z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
              Current Plan
            </Badge>
          </motion.div>
        )}

        <CardHeader className="pb-4 relative z-[1]">
          {/* Plan Name with Icon */}
          <div className="flex items-center gap-2 mb-1">
            <div className={`p-1.5 rounded-lg ${planKey === 'pro' ? 'bg-primary/10 text-primary' : planKey === 'ultra' ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'}`}>
              {getPlanIcon()}
            </div>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
          </div>
          <CardDescription className="text-sm">{plan.description}</CardDescription>
          
          {/* Price Display */}
          <div className="mt-6">
            {/* Weekly Rate (smaller) */}
            <div className="flex items-baseline gap-1">
              <motion.span 
                className="text-3xl font-bold"
                key={`${isYearly}-${currency}`}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {weeklyPrice}
              </motion.span>
              <span className="text-muted-foreground text-sm">
                {isPaid ? '/week' : '/forever'}
              </span>
            </div>
            
            {/* Billing Summary Box */}
            {isPaid && (
              <motion.div 
                className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                key={`${isYearly}-billing-${currency}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {isYearly ? 'Billed annually' : 'Billed monthly'}
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    {billingPrice}
                    <span className="text-xs text-muted-foreground font-normal">
                      {isYearly ? '/yr' : '/mo'}
                    </span>
                  </span>
                </div>
                {isYearly && getSavings() && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 pt-2 border-t border-border/50"
                  >
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                      {getSavings()}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative z-[1] pb-4">
          <ul className="space-y-2.5">
            {plan.features.map((feature, featureIndex) => (
              <motion.li 
                key={feature} 
                className="flex items-start gap-2 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 + featureIndex * 0.03 }}
              >
                <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${planKey === 'ultra' ? 'text-amber-500' : 'text-primary'}`} />
                <span className="text-muted-foreground">{feature}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="relative z-[1] pt-2">
          {!isPaid ? (
            <Link to="/auth" className="w-full">
              <Button 
                className="w-full h-11" 
                variant="outline"
                disabled={isCurrentPlan}
              >
                {isCurrentPlan ? "Current Plan" : plan.cta}
              </Button>
            </Link>
          ) : (
            <PaymentButton
              planName={planKey as 'pro' | 'ultra'}
              billingCycle={isYearly ? 'yearly' : 'monthly'}
              className={`w-full h-11 font-medium ${planKey === 'ultra' ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0' : ''}`}
              variant="default"
              onSuccess={onPaymentSuccess}
              onPaymentStart={onPaymentStart}
              onPaymentEnd={onPaymentEnd}
              disabled={isCurrentPlan || disabled}
              discountPercent={discountPercent}
              redeemCodeId={redeemCodeId}
            >
              {isCurrentPlan ? (
                "Current Plan"
              ) : (
                <span className="flex items-center gap-2">
                  {plan.cta}
                  <span className="text-xs opacity-80">
                    • {billingPrice}/{isYearly ? 'yr' : 'mo'}
                  </span>
                </span>
              )}
            </PaymentButton>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};
