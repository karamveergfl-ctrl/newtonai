import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Loader2,
  History,
  Bell,
  Settings,
  BarChart3,
  LogOut
} from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { GenerationHistory } from "@/components/profile/GenerationHistory";
import { UserNotifications } from "@/components/profile/UserNotifications";
import { SettingsPanel } from "@/components/profile/SettingsPanel";
import { UsageTab } from "@/components/profile/UsageTab";
import { useUserNotifications } from "@/hooks/useUserNotifications";
import { AppLayout } from "@/components/AppLayout";

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  subscription_tier: string;
  language_preference: string | null;
  timezone: string | null;
  email_notifications: boolean | null;
  theme_preference: string | null;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { unreadCount } = useUserNotifications();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [email, setEmail] = useState("");
  
  const currentTab = searchParams.get("tab") || "settings";

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setEmail(session.user.email || "");

      const { data, error } = await supabase
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

      if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          bio: data.bio,
          subscription_tier: data.subscription_tier,
          language_preference: data.language_preference,
          timezone: data.timezone,
          email_notifications: data.email_notifications,
          theme_preference: data.theme_preference,
          created_at: data.created_at,
        });
      }

      setLoading(false);
    };

    fetchProfile();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (loading || !profile) {
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
    <AppLayout showFooter={false}>
      <SEOHead
        title="Profile"
        description="Manage your NewtonAI profile, view usage statistics, and track your study credits."
        canonicalPath="/profile"
        breadcrumbs={breadcrumbs}
        noIndex={true}
      />
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <h1 className="text-xl font-semibold text-foreground">Profile</h1>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 group"
        >
          <ProfileHeader
            userId={profile.id}
            fullName={profile.full_name}
            avatarUrl={profile.avatar_url}
            subscriptionTier={profile.subscription_tier}
            createdAt={profile.created_at}
            onNameChange={(name) => setProfile(prev => prev ? { ...prev, full_name: name } : prev)}
            onAvatarChange={(url) => setProfile(prev => prev ? { ...prev, avatar_url: url } : prev)}
          />
        </motion.div>

        {/* Tabbed Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <TabsList className="w-full grid grid-cols-4 mb-6">
              <TabsTrigger value="settings" className="gap-1.5">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5 relative">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="usage" className="gap-1.5">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Usage</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="mt-0">
              <SettingsPanel
                profile={profile}
                email={email}
                onProfileUpdate={(updates) => setProfile(prev => prev ? { ...prev, ...updates } : prev)}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <GenerationHistory />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <UserNotifications />
            </TabsContent>

            <TabsContent value="usage" className="mt-0">
              <UsageTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Profile;
