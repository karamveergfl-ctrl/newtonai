import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
import { useCredits } from "@/hooks/useCredits";
import { FEATURE_NAMES } from "@/lib/creditConfig";
import { UsageDashboard } from "@/components/UsageDashboard";
import { UsageTrendsChart } from "@/components/UsageTrendsChart";
import SEOHead from "@/components/SEOHead";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  ChevronRight, 
  Globe, 
  History, 
  Bell, 
  Settings, 
  Gift, 
  CreditCard,
  LogOut,
  Crown,
  Sparkles,
  Coins,
  TrendingUp,
  TrendingDown,
  Play,
  Wallet,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { RedeemCodeDialog } from "@/components/RedeemCodeDialog";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, formatDistanceToNow } from "date-fns";

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  feature_name: string | null;
  ad_duration: number | null;
  created_at: string;
}

interface Subscription {
  id: string;
  plan_name: string;
  billing_cycle: string;
  status: string;
  current_period_end: string | null;
  created_at: string;
}

const languages = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "auto", label: "Automatic" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { usage, subscription, loading: usageLoading } = useFeatureUsage();
  const { credits, isPremium } = useCredits();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMoreUsage, setShowMoreUsage] = useState(false);
  const [showCreditHistory, setShowCreditHistory] = useState(false);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [lifetimeStats, setLifetimeStats] = useState({ earned: 0, spent: 0 });
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    language_preference: "auto",
  });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      // Fetch profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
        return;
      }

      if (profile) {
        setFormData({
          full_name: profile.full_name || "",
          email: session.user.email || "",
          language_preference: profile.language_preference || "auto",
        });
      }

      // Fetch user credits for lifetime stats
      const { data: creditsData } = await supabase
        .from("user_credits")
        .select("lifetime_earned, lifetime_spent")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (creditsData) {
        setLifetimeStats({
          earned: creditsData.lifetime_earned,
          spent: creditsData.lifetime_spent,
        });
      }

      // Fetch active subscription
      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionData) {
        setActiveSubscription(subscriptionData);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [navigate, toast]);

  const fetchTransactions = async () => {
    if (!userId) return;
    setLoadingTransactions(true);
    
    const { data, error } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setTransactions(data);
    }
    setLoadingTransactions(false);
  };

  const handleToggleCreditHistory = () => {
    if (!showCreditHistory && transactions.length === 0) {
      fetchTransactions();
    }
    setShowCreditHistory(!showCreditHistory);
  };

  const getTransactionLabel = (tx: CreditTransaction) => {
    if (tx.type === "signup_bonus") return "Welcome Bonus";
    if (tx.type === "ad_reward") return `Watched ${tx.ad_duration}s video`;
    if (tx.type === "feature_use" && tx.feature_name) {
      return FEATURE_NAMES[tx.feature_name] || tx.feature_name;
    }
    return tx.type;
  };

  const handleCancelSubscription = async () => {
    if (!activeSubscription || !userId) return;
    
    setCancellingSubscription(true);
    
    try {
      // Update subscription status to cancelled
      const { error: subError } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("id", activeSubscription.id);

      if (subError) throw subError;

      // Update profile to free tier (but keep access until period ends)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ subscription_tier: "free" })
        .eq("id", userId);

      if (profileError) throw profileError;

      setActiveSubscription(prev => prev ? { ...prev, status: "cancelled" } : null);
      
      toast({
        title: "Subscription cancelled",
        description: "You'll retain access until your current billing period ends.",
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        language_preference: formData.language_preference,
      })
      .eq("id", session.user.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Profile updated successfully",
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const formatLimit = (limit: number, unit: string) => {
    if (limit === -1) return "Unlimited";
    if (unit === "minutes_per_month") return `${limit} min Per Month`;
    if (unit === "per_day") return `${limit} Per Day`;
    return `${limit} Per Month`;
  };

  const displayedUsage = showMoreUsage ? usage : usage.slice(0, 6);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Profile", href: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Profile"
        description="Manage your NewtonAI profile, view usage statistics, and track your study credits."
        canonicalPath="/profile"
        breadcrumbs={breadcrumbs}
        noIndex={true}
      />
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {formData.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Your Name"
                    className="text-lg font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                  />
                  <p className="text-sm text-muted-foreground">
                    ID: {userId?.slice(0, 10)}...
                  </p>
                </div>
              </div>

              {/* Subscription Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-foreground">NewtonAI</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    subscription.tier === "free" 
                      ? "bg-muted text-muted-foreground" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {subscription.tier === "free" ? "Basic" : subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/pricing")}
                  className="gap-1"
                >
                  {subscription.tier === "free" ? (
                    <>
                      <Crown className="h-3.5 w-3.5" />
                      UPGRADE
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      MANAGE
                    </>
                  )}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Usage Stats */}
              <div className="space-y-3">
                {displayedUsage.map((feature, index) => (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{feature.icon}</span>
                      <span className="text-sm font-medium text-foreground">{feature.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {feature.limit === -1 ? (
                        <span className="text-xs text-primary font-medium">Unlimited</span>
                      ) : (
                        <>
                          <Progress 
                            value={getUsagePercentage(feature.used, feature.limit)} 
                            className="w-16 h-1.5"
                          />
                          <span className="text-xs text-muted-foreground min-w-[80px] text-right">
                            {feature.used}/{formatLimit(feature.limit, feature.unit)}
                          </span>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Pro Answer - locked for free */}
                {subscription.tier === "free" && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-between opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✨</span>
                      <span className="text-sm font-medium text-foreground">Pro Answer</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Upgrade to Unlock</span>
                  </motion.div>
                )}
              </div>

              {/* More Usage Toggle */}
              {usage.length > 6 && (
                <button
                  onClick={() => setShowMoreUsage(!showMoreUsage)}
                  className="w-full mt-4 text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-1"
                >
                  {showMoreUsage ? "Less usage" : "More usage"}
                  <ChevronRight className={cn("h-4 w-4 transition-transform", showMoreUsage && "rotate-90")} />
                </button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Credit Balance & History Section */}
        <motion.div
          id="credit-history-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-primary font-semibold mb-3 px-1 flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Study Credits
          </h2>
          <Card className="border-0 bg-card/50 overflow-hidden">
            <CardContent className="p-0">
              {/* Credit Summary */}
              <div className="p-4 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-yellow-500/20">
                      <Wallet className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Available Balance</p>
                      <p className="text-2xl font-bold">
                        {isPremium ? "∞" : credits} <span className="text-sm font-normal text-muted-foreground">SC</span>
                      </p>
                    </div>
                  </div>
                  {isPremium && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                
                {/* Lifetime Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-lg font-bold">{lifetimeStats.earned}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Total Earned</p>
                  </div>
                  <div className="p-2 bg-orange-500/10 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400">
                      <TrendingDown className="h-3 w-3" />
                      <span className="text-lg font-bold">{lifetimeStats.spent}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </div>
                </div>
              </div>

              {/* Toggle History */}
              <button
                onClick={handleToggleCreditHistory}
                className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors border-t"
              >
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Transaction History</span>
                </div>
                <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", showCreditHistory && "rotate-90")} />
              </button>

              {/* Transaction List */}
              {showCreditHistory && (
                <div className="border-t">
                  {loadingTransactions ? (
                    <div className="p-8 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No transactions yet
                    </div>
                  ) : (
                    <ScrollArea className="h-64">
                      <div className="divide-y divide-border/50">
                        {transactions.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-muted/30">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-1.5 rounded-full",
                                tx.amount > 0 ? "bg-green-500/10" : "bg-orange-500/10"
                              )}>
                                {tx.amount > 0 ? (
                                  tx.type === "ad_reward" ? (
                                    <Play className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                                  )
                                ) : (
                                  <TrendingDown className="h-3.5 w-3.5 text-orange-500" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{getTransactionLabel(tx)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <span className={cn(
                              "text-sm font-semibold",
                              tx.amount > 0 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
                            )}>
                              {tx.amount > 0 ? "+" : ""}{tx.amount} SC
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Usage Dashboard Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mb-6"
        >
          <UsageDashboard usage={usage} subscription={subscription} />
        </motion.div>

        {/* Usage Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="mb-6"
        >
          <UsageTrendsChart />
        </motion.div>

        {/* Preference Section */}
        <motion.div
          id="language-settings"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <h2 className="text-primary font-semibold mb-3 px-1">Preference</h2>
          <Card className="border-0 bg-card/50">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Answer Language</span>
                </div>
                <Select
                  value={formData.language_preference}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, language_preference: value }))}
                >
                  <SelectTrigger className="w-28 h-8 border-0 bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Management Section */}
        {(activeSubscription || subscription.tier !== "free") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-6"
          >
            <h2 className="text-primary font-semibold mb-3 px-1 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Subscription
            </h2>
            <Card className="border-0 bg-card/50 overflow-hidden">
              <CardContent className="p-0">
                {/* Current Plan */}
                <div className="p-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/20">
                        <Crown className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Current Plan</p>
                        <p className="text-xl font-bold capitalize">
                          {activeSubscription?.plan_name || subscription.tier} 
                          {activeSubscription?.billing_cycle && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              ({activeSubscription.billing_cycle})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      className={cn(
                        "border-0",
                        activeSubscription?.status === "active" 
                          ? "bg-green-500/10 text-green-600" 
                          : activeSubscription?.status === "cancelled"
                          ? "bg-orange-500/10 text-orange-600"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {activeSubscription?.status === "active" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {activeSubscription?.status === "cancelled" && <AlertCircle className="h-3 w-3 mr-1" />}
                      {activeSubscription?.status || "Active"}
                    </Badge>
                  </div>

                  {/* Expiry Date */}
                  {activeSubscription?.current_period_end && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {activeSubscription.status === "cancelled" ? "Access until: " : "Renews on: "}
                        <span className="font-medium text-foreground">
                          {format(new Date(activeSubscription.current_period_end), "MMM d, yyyy")}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Subscription Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate("/pricing")}
                      className="flex-1"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {subscription.tier === "pro" ? "Upgrade to Ultra" : "Change Plan"}
                    </Button>
                    
                    {activeSubscription?.status === "active" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your {activeSubscription.plan_name} subscription? 
                              You'll retain access to premium features until {activeSubscription.current_period_end 
                                ? format(new Date(activeSubscription.current_period_end), "MMMM d, yyyy")
                                : "the end of your billing period"
                              }.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleCancelSubscription}
                              disabled={cancellingSubscription}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {cancellingSubscription && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                              Cancel Subscription
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>

                {/* Payment History Link */}
                <button
                  onClick={() => navigate("/pricing")}
                  className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors border-t"
                >
                  <div className="flex items-center gap-3">
                    <History className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">View Payment History</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h2 className="text-primary font-semibold mb-3 px-1">Management</h2>
          <Card className="border-0 bg-card/50">
            <CardContent className="p-0 divide-y divide-border/50">
              <MenuItem 
                icon={History} 
                label="History" 
                onClick={() => {
                  setShowCreditHistory(!showCreditHistory);
                  if (!showCreditHistory && transactions.length === 0) {
                    fetchTransactions();
                  }
                  // Scroll to credit history section
                  setTimeout(() => {
                    document.getElementById('credit-history-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }} 
              />
              <MenuItem 
                icon={Bell} 
                label="Notifications" 
                onClick={() => {
                  toast({
                    title: "Notifications",
                    description: "In-app notifications are enabled. You'll receive updates on new features and offers.",
                  });
                }} 
              />
              <MenuItem 
                icon={Settings} 
                label="Settings" 
                onClick={() => {
                  document.getElementById('language-settings')?.scrollIntoView({ behavior: 'smooth' });
                }} 
              />
              <RedeemCodeDialog 
                trigger={
                  <button
                    className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Gift className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">Redeem Code</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                }
                onCodeRedeemed={() => {
                  toast({
                    title: "Code Saved!",
                    description: "Your discount will be applied at checkout.",
                  });
                }}
              />
              {subscription.tier === "free" && (
                <MenuItem icon={CreditCard} label="Subscribe to Pro" onClick={() => navigate("/pricing")} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </motion.div>

        {/* Sign Out & Delete Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-2"
        >
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 text-muted-foreground hover:text-destructive transition-colors px-1"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Log out</span>
          </button>
          
          <DeleteAccountDialog userEmail={formData.email} />
        </motion.div>
      </div>
    </div>
  );
};

interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

function MenuItem({ icon: Icon, label, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

export default Profile;
