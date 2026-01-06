import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFeatureUsage, FEATURE_LABELS } from "@/hooks/useFeatureUsage";
import { 
  ArrowLeft, 
  User, 
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
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMoreUsage, setShowMoreUsage] = useState(false);
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
      setLoading(false);
    };

    fetchProfile();
  }, [navigate, toast]);

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

  return (
    <div className="min-h-screen bg-background">
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

        {/* Preference Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
              <MenuItem icon={History} label="History" onClick={() => {}} />
              <MenuItem icon={Bell} label="Notifications" onClick={() => {}} />
              <MenuItem icon={Settings} label="Settings" onClick={() => {}} />
              <MenuItem icon={Gift} label="Redeem Code" onClick={() => {}} />
              <MenuItem icon={CreditCard} label="My subscription" onClick={() => navigate("/pricing")} />
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

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 text-muted-foreground hover:text-destructive transition-colors px-1"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Log out</span>
          </button>
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
