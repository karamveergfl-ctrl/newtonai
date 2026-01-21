import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Loader2, Gift, X, Infinity as InfinityIcon } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { PaymentButton } from "@/components/PaymentButton";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RedeemCodeDialog } from "@/components/RedeemCodeDialog";
import { useRedeemCode } from "@/hooks/useRedeemCode";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Feature comparison data for the table
const featureLimits = [
  { name: "Educational Videos", free: "20/mo", pro: "Unlimited", ultra: "Unlimited" },
  { name: "AI Flashcards", free: "3/mo", pro: "90/mo", ultra: "Unlimited" },
  { name: "AI Quizzes", free: "3/mo", pro: "90/mo", ultra: "Unlimited" },
  { name: "Mind Maps", free: "3/mo", pro: "90/mo", ultra: "Unlimited" },
  { name: "Lecture Notes", free: "2/mo", pro: "20/mo", ultra: "Unlimited" },
  { name: "AI Summary", free: "2/mo", pro: "20/mo", ultra: "Unlimited" },
  { name: "AI Podcast", free: "1/mo", pro: "15/mo", ultra: "Unlimited" },
  { name: "Live Transcription", free: "20 min/mo", pro: "900 min/mo", ultra: "Unlimited" },
  { name: "Homework Help", free: "5/day", pro: "Unlimited", ultra: "Unlimited" },
  { name: "AI Chat", free: "3/day", pro: "Unlimited", ultra: "Unlimited" },
];

const plans = [
  {
    name: "Free",
    inrWeeklyMonthly: "₹0",
    inrWeeklyYearly: "₹0",
    inrMonthly: "₹0",
    inrYearly: "₹0",
    description: "Perfect for getting started",
    features: [
      "20 educational videos/month",
      "3 flashcards, quizzes, mind maps/month",
      "2 lecture notes & summaries/month",
      "1 AI podcast/month",
      "20 min transcription/month",
      "5 homework help/day",
      "3 AI chat messages/day",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    inrWeeklyMonthly: "₹175",
    inrWeeklyYearly: "₹125",
    inrMonthly: "₹699",
    inrYearly: "₹6,499",
    yearlySavings: "Save ₹1,889",
    description: "Best for students",
    features: [
      "Unlimited educational videos",
      "90 flashcards, quizzes, mind maps/month",
      "20 lecture notes & summaries/month",
      "15 AI podcasts/month",
      "900 min live transcription/month",
      "Unlimited homework help",
      "Unlimited AI chat",
      "Priority support",
    ],
    cta: "Subscribe Now",
    popular: true,
  },
  {
    name: "Ultra",
    inrWeeklyMonthly: "₹325",
    inrWeeklyYearly: "₹231",
    inrMonthly: "₹1,299",
    inrYearly: "₹11,999",
    yearlySavings: "Save ₹3,589",
    description: "For power learners",
    features: [
      "Everything unlimited",
      "Unlimited flashcards & quizzes",
      "Unlimited mind maps",
      "Unlimited lecture notes & summaries",
      "Unlimited AI podcasts",
      "Unlimited live transcription",
      "Unlimited homework help & AI chat",
      "Team collaboration",
      "Dedicated support",
    ],
    cta: "Subscribe Now",
    popular: false,
  },
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [verifyingPlanName, setVerifyingPlanName] = useState<string | null>(null);
  const { redeemCode, applyCode, clearCode, calculateDiscountedAmount } = useRedeemCode();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setCurrentPlan(profile.subscription_tier);
        }
      }
    };
    
    checkAuth();
  }, []);

  const handlePaymentStart = (planName: string) => {
    setIsVerifyingPayment(true);
    setVerifyingPlanName(planName);
  };

  const handlePaymentSuccess = async () => {
    // Keep verifying state while refreshing
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setCurrentPlan(profile.subscription_tier);
      }
    }
    setIsVerifyingPayment(false);
    setVerifyingPlanName(null);
  };

  const handlePaymentEnd = () => {
    setIsVerifyingPayment(false);
    setVerifyingPlanName(null);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Floating gradient blobs */}
      <motion.div
        className="fixed top-20 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl pointer-events-none"
        animate={{
          x: [0, 30, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed bottom-20 -right-32 w-80 h-80 rounded-full bg-gradient-to-bl from-secondary/20 to-accent/10 blur-3xl pointer-events-none"
        animate={{
          x: [0, -40, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      
      <Header />

      <main className="container mx-auto px-4 py-16 relative z-10">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            Choose Your Plan
          </motion.div>
          
          <motion.h1 
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Choose the plan that fits your learning needs. Upgrade or downgrade anytime.
          </motion.p>
          
          {/* Billing Toggle */}
          <motion.div 
            className="flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {isYearly && (
              <motion.span 
                className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring" }}
              >
                Best Value
              </motion.span>
            )}
          </motion.div>

          {/* Redeem Code Section */}
          <motion.div
            className="flex items-center justify-center gap-3 mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {redeemCode.isValidated ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20"
              >
                <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {redeemCode.discountPercent}% discount applied!
                </span>
                <button
                  onClick={clearCode}
                  className="ml-1 p-1 rounded-full hover:bg-green-500/20 transition-colors"
                >
                  <X className="h-3 w-3 text-green-600 dark:text-green-400" />
                </button>
              </motion.div>
            ) : (
              <RedeemCodeDialog
                trigger={
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Gift className="h-4 w-4" />
                    Have a promo code?
                  </button>
                }
                onCodeRedeemed={(codeId, discountPercent) => {
                  applyCode(codeId, discountPercent);
                }}
              />
            )}
          </motion.div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const planKey = plan.name.toLowerCase();
            const isCurrentPlan = currentPlan === planKey;
            const isThisPlanVerifying = isVerifyingPayment && verifyingPlanName === planKey;
            
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 50, rotateX: -10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.2 + index * 0.15,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  y: -10, 
                  scale: plan.popular ? 1.02 : 1.05,
                  rotateX: 5,
                  rotateY: index === 0 ? -5 : index === 2 ? 5 : 0,
                }}
                style={{ transformStyle: "preserve-3d", perspective: 1000 }}
              >
                <Card 
                  className={`relative h-full overflow-visible ${plan.popular ? 'border-primary shadow-lg shadow-primary/20 scale-105' : ''}`}
                >
                  {/* Skeleton Overlay for Verifying Payment */}
                  <AnimatePresence>
                    {isThisPlanVerifying && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 bg-card/95 backdrop-blur-sm flex flex-col items-center justify-center p-6"
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
                        
                        {/* Skeleton content preview */}
                        <div className="w-full space-y-3 opacity-50">
                          <Skeleton className="h-4 w-3/4 mx-auto" />
                          <Skeleton className="h-4 w-1/2 mx-auto" />
                          <div className="space-y-2 mt-4">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-5/6" />
                            <Skeleton className="h-3 w-4/5" />
                          </div>
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

                  {plan.popular && (
                    <motion.div 
                      className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, type: "spring" }}
                    >
                      <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </motion.div>
                  )}
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
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <motion.span 
                        className="text-4xl font-bold"
                        key={isYearly ? 'yearly' : 'monthly'}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {plan.name === "Free" ? "₹0" : (isYearly ? plan.inrWeeklyYearly : plan.inrWeeklyMonthly)}
                      </motion.span>
                      <span className="text-muted-foreground ml-2">
                        {plan.name === "Free" ? "/forever" : "/week"}
                      </span>
                    </div>
                    {plan.name !== "Free" && (
                      <motion.div 
                        className="mt-2 space-y-1"
                        key={isYearly ? 'yearly-note' : 'monthly-note'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-sm text-muted-foreground">
                          Billed {isYearly ? 'annually' : 'monthly'} at{' '}
                          <span className="font-semibold text-foreground">
                            {isYearly ? plan.inrYearly : plan.inrMonthly}
                          </span>
                          {isYearly ? '/year' : '/month'}
                        </p>
                        {isYearly && plan.yearlySavings && (
                          <motion.span 
                            className="inline-block bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold px-2 py-1 rounded-full"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring" }}
                          >
                            {plan.yearlySavings}
                          </motion.span>
                        )}
                      </motion.div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <motion.li 
                          key={feature} 
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 + featureIndex * 0.05 }}
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + index * 0.1 + featureIndex * 0.05, type: "spring" }}
                          >
                            <Check className="h-5 w-5 text-primary" />
                          </motion.div>
                          <span>{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {plan.name === "Free" ? (
                      <Link to="/auth" className="w-full">
                        <Button 
                          className="w-full" 
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
                        className="w-full"
                        variant="default"
                        onSuccess={handlePaymentSuccess}
                        onPaymentStart={() => handlePaymentStart(planKey)}
                        onPaymentEnd={handlePaymentEnd}
                        disabled={isCurrentPlan || isVerifyingPayment}
                        discountPercent={redeemCode.discountPercent}
                        redeemCodeId={redeemCode.codeId}
                      >
                        {isCurrentPlan ? "Current Plan" : plan.cta}
                      </PaymentButton>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <motion.div
          className="mt-20 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-center mb-8">
            Complete Feature Comparison
          </h2>
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Feature</TableHead>
                  <TableHead className="text-center font-semibold">Free</TableHead>
                  <TableHead className="text-center font-semibold text-primary">Pro</TableHead>
                  <TableHead className="text-center font-semibold">Ultra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureLimits.map((feature, index) => (
                  <TableRow key={feature.name} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                    <TableCell className="font-medium">{feature.name}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{feature.free}</TableCell>
                    <TableCell className="text-center">
                      {feature.pro === "Unlimited" ? (
                        <span className="inline-flex items-center gap-1 text-primary font-medium">
                          <InfinityIcon className="h-4 w-4" /> Unlimited
                        </span>
                      ) : (
                        <span className="text-foreground font-medium">{feature.pro}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                        <InfinityIcon className="h-4 w-4" /> Unlimited
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        {/* Payment Methods Info */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <p className="text-sm text-muted-foreground mb-4">
            Secure payments powered by Razorpay
          </p>
          <div className="flex items-center justify-center gap-4 text-muted-foreground/60">
            <span className="text-xs">UPI</span>
            <span className="text-xs">•</span>
            <span className="text-xs">Cards</span>
            <span className="text-xs">•</span>
            <span className="text-xs">Net Banking</span>
            <span className="text-xs">•</span>
            <span className="text-xs">Wallets</span>
          </div>
        </motion.div>

        {/* Enterprise CTA */}
        <motion.div
          className="mt-16 text-center p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <h3 className="text-2xl font-bold mb-2">Need a Custom Solution?</h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Get custom API access, bulk licensing, and dedicated support for your educational institution or enterprise.
          </p>
          <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <Link to="/enterprise">Contact Enterprise Sales</Link>
          </Button>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
