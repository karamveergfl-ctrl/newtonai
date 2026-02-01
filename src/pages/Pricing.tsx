// Static page - no framer-motion
import { Button } from "@/components/ui/button";
import { Sparkles, Gift, X, Infinity as InfinityIcon, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { RedeemCodeDialog } from "@/components/RedeemCodeDialog";
import { useRedeemCode } from "@/hooks/useRedeemCode";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { detectCurrency, CurrencyCode, CURRENCY_NAMES, CURRENCY_SYMBOLS, CURRENCY_FLAGS } from "@/lib/currencyUtils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { PricingCard } from "@/components/pricing/PricingCard";
import { AdBanner } from "@/components/AdBanner";

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

// Static feature list (currency-independent)
const planFeatures = {
  free: [
    "20 educational videos/month",
    "3 flashcards, quizzes, mind maps/month",
    "2 lecture notes & summaries/month",
    "1 AI podcast/month",
    "20 min transcription/month",
    "5 homework help/day",
    "3 AI chat messages/day",
  ],
  pro: [
    "Unlimited educational videos",
    "90 flashcards, quizzes, mind maps/month",
    "20 lecture notes & summaries/month",
    "15 AI podcasts/month",
    "900 min live transcription/month",
    "Unlimited homework help",
    "Unlimited AI chat",
    "Priority support",
  ],
  ultra: [
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
};

const plans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    features: planFeatures.free,
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    description: "Best for students",
    features: planFeatures.pro,
    cta: "Subscribe Now",
    popular: true,
  },
  {
    name: "Ultra",
    description: "For power learners",
    features: planFeatures.ultra,
    cta: "Go Ultra",
    popular: false,
  },
];

const Pricing = () => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Pricing", href: "/pricing" },
  ];

  const [isYearly, setIsYearly] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [verifyingPlanName, setVerifyingPlanName] = useState<string | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [isAutoDetected, setIsAutoDetected] = useState(true);
  const { redeemCode, applyCode, clearCode } = useRedeemCode();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      
      if (session) {
        // Fetch profile including preferred_currency
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier, preferred_currency')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setCurrentPlan(profile.subscription_tier);
          
          // Priority: Supabase profile > localStorage > auto-detect
          if (profile.preferred_currency && CURRENCY_NAMES[profile.preferred_currency as CurrencyCode]) {
            setCurrency(profile.preferred_currency as CurrencyCode);
            setIsAutoDetected(false);
          } else {
            const savedCurrency = localStorage.getItem('preferred_currency') as CurrencyCode | null;
            if (savedCurrency && CURRENCY_NAMES[savedCurrency]) {
              setCurrency(savedCurrency);
              setIsAutoDetected(false);
            } else {
              setCurrency(detectCurrency(session.user.email));
            }
          }
        }
      } else {
        // Not logged in - use localStorage or auto-detect
        const savedCurrency = localStorage.getItem('preferred_currency') as CurrencyCode | null;
        if (savedCurrency && CURRENCY_NAMES[savedCurrency]) {
          setCurrency(savedCurrency);
          setIsAutoDetected(false);
        } else {
          setCurrency(detectCurrency(null));
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

  const handleCurrencyChange = async (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    setIsAutoDetected(false);
    localStorage.setItem('preferred_currency', newCurrency);
    
    // Sync to Supabase profile if logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase
        .from('profiles')
        .update({ preferred_currency: newCurrency })
        .eq('id', session.user.id);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SEOHead
        title="Pricing"
        description="Choose the perfect NewtonAI plan for your learning needs. Free, Pro, and Ultra plans with AI flashcards, quizzes, summaries, and more."
        canonicalPath="/pricing"
        breadcrumbs={breadcrumbs}
        keywords="NewtonAI pricing, student discount, AI study tools pricing, flashcard generator cost"
      />
      
      {/* Static gradient blobs */}
      <div className="fixed top-20 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 -right-32 w-80 h-80 rounded-full bg-gradient-to-bl from-secondary/20 to-accent/10 blur-3xl pointer-events-none" />
      
      <Header />

      <main className="container mx-auto px-4 py-12 sm:py-16 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
            <Sparkles className="w-4 h-4" />
            Choose Your Plan
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your learning needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8">
          {/* Billing Toggle */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-muted/50 border border-border">
            <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {isYearly && (
              <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                Save 25%
              </span>
            )}
          </div>
          
          {/* Currency Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted/50 border border-border hover:bg-muted/80 transition-colors text-sm">
                <span className="text-base">{CURRENCY_FLAGS[currency]}</span>
                <span className="font-medium">{CURRENCY_SYMBOLS[currency]} {currency}</span>
                {isAutoDetected && (
                  <span className="text-xs text-muted-foreground">(auto)</span>
                )}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56 bg-popover">
              {(Object.keys(CURRENCY_NAMES) as CurrencyCode[]).map((code) => (
                <DropdownMenuItem 
                  key={code} 
                  onClick={() => handleCurrencyChange(code)}
                  className={`flex items-center gap-3 cursor-pointer ${currency === code ? 'bg-primary/10' : ''}`}
                >
                  <span className="text-lg">{CURRENCY_FLAGS[code]}</span>
                  <div className="flex-1">
                    <span className="font-medium">{CURRENCY_SYMBOLS[code]} {code}</span>
                    <span className="text-xs text-muted-foreground ml-2">{CURRENCY_NAMES[code]}</span>
                  </div>
                  {currency === code && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Redeem Code Section */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {redeemCode.isValidated ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
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
            </div>
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
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const planKey = plan.name.toLowerCase();
            const isCurrentPlan = currentPlan === planKey;
            const isThisPlanVerifying = isVerifyingPayment && verifyingPlanName === planKey;
            
            return (
              <PricingCard
                key={plan.name}
                plan={plan}
                index={index}
                isYearly={isYearly}
                currency={currency}
                isCurrentPlan={isCurrentPlan}
                isVerifying={isThisPlanVerifying}
                onPaymentStart={() => handlePaymentStart(planKey)}
                onPaymentEnd={handlePaymentEnd}
                onPaymentSuccess={handlePaymentSuccess}
                discountPercent={redeemCode.discountPercent}
                redeemCodeId={redeemCode.codeId}
                disabled={isVerifyingPayment}
              />
            );
          })}
        </div>


        {/* Feature Comparison Table */}
        <div className="mt-20 max-w-4xl mx-auto">
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
                  <TableHead className="text-center font-semibold text-amber-500">Ultra</TableHead>
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
                      <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                        <InfinityIcon className="h-4 w-4" /> Unlimited
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Currency & Payment Info */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border mb-4">
            <span className="text-lg">{CURRENCY_FLAGS[currency]}</span>
            <span className="text-sm text-muted-foreground">
              Prices shown in {CURRENCY_NAMES[currency]} ({currency})
            </span>
          </div>
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
        </div>

        <AdBanner />

        {/* Enterprise CTA */}
        <div className="mt-16 text-center p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20">
          <h3 className="text-2xl font-bold mb-2">Need a Custom Solution?</h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Get custom API access, bulk licensing, and dedicated support for your educational institution or enterprise.
          </p>
          <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <Link to="/enterprise">Contact Enterprise Sales</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
