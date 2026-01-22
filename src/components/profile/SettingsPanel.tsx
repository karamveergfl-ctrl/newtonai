import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  Save
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { Link, useNavigate } from 'react-router-dom';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const languages = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
  { value: 'pt', label: 'Portuguese' },
];

type ProfileType = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  language_preference: string | null;
  timezone: string | null;
  email_notifications: boolean | null;
  theme_preference: string | null;
  subscription_tier?: string;
};

interface SettingsPanelProps {
  profile: ProfileType;
  email: string;
  onProfileUpdate: (updates: Partial<ProfileType>) => void;
}

// Indicator dot component
const IndicatorDot = ({ color }: { color: 'blue' | 'orange' | 'green' }) => {
  const colors = {
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500',
  };
  return (
    <span className={`w-3 h-3 rounded-full ${colors[color]} shrink-0`} />
  );
};

// Row item component for consistent styling
const SettingRow = ({ 
  label, 
  value, 
  onClick, 
  action,
  showArrow = true,
  className = ""
}: { 
  label: string; 
  value?: React.ReactNode;
  onClick?: () => void;
  action?: React.ReactNode;
  showArrow?: boolean;
  className?: string;
}) => (
  <div 
    className={`flex items-center justify-between py-3 ${onClick ? 'cursor-pointer hover:bg-muted/50 -mx-4 px-4 rounded-lg transition-colors' : ''} ${className}`}
    onClick={onClick}
  >
    <span className="text-foreground">{label}</span>
    <div className="flex items-center gap-2 text-muted-foreground">
      {value}
      {action}
      {showArrow && onClick && <ChevronRight className="h-4 w-4" />}
    </div>
  </div>
);

export function SettingsPanel({ profile, email, onProfileUpdate }: SettingsPanelProps) {
  const { setTheme, theme } = useTheme();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
  const [nicknameValue, setNicknameValue] = useState(profile.full_name || '');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [formData, setFormData] = useState({
    email_notifications: profile.email_notifications ?? true,
    language_preference: profile.language_preference || 'en',
    theme_preference: profile.theme_preference || 'system',
  });

  // Check if Google is connected
  useEffect(() => {
    const checkGoogleConnection = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.app_metadata?.providers?.includes('google')) {
        setGoogleConnected(true);
      }
    };
    checkGoogleConnection();
  }, []);

  const handleCopyId = () => {
    navigator.clipboard.writeText(profile.id.slice(0, 10));
    toast.success('ID copied to clipboard');
  };

  const handleNicknameSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: nicknameValue })
        .eq('id', profile.id);

      if (error) throw error;

      onProfileUpdate({ full_name: nicknameValue });
      setNicknameDialogOpen(false);
      toast.success('Nickname updated!');
    } catch (error) {
      toast.error('Failed to update nickname');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEmailNotifications = async (checked: boolean) => {
    setFormData(prev => ({ ...prev, email_notifications: checked }));
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email_notifications: checked })
        .eq('id', profile.id);

      if (error) throw error;
      onProfileUpdate({ email_notifications: checked });
      toast.success(checked ? 'Email notifications enabled' : 'Email notifications disabled');
    } catch (error) {
      toast.error('Failed to update notification settings');
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    setFormData(prev => ({ ...prev, theme_preference: newTheme }));
    setTheme(newTheme);
    try {
      await supabase
        .from('profiles')
        .update({ theme_preference: newTheme })
        .eq('id', profile.id);
      onProfileUpdate({ theme_preference: newTheme });
    } catch (error) {
      console.error('Failed to save theme preference');
    }
  };

  const handleLanguageChange = async (value: string) => {
    setFormData(prev => ({ ...prev, language_preference: value }));
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ language_preference: value })
        .eq('id', profile.id);

      if (error) throw error;
      onProfileUpdate({ language_preference: value });
      toast.success('Language preference updated!');
    } catch (error) {
      toast.error('Failed to update language');
    }
  };

  const handleGoogleConnect = async () => {
    if (googleConnected) {
      toast.info('To unlink Google, please contact support');
      return;
    }
    
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profile?tab=settings`,
      },
    });
    
    if (error) {
      toast.error('Failed to connect Google account');
    }
  };

  const displayId = profile.id.slice(0, 10) + '...';

  return (
    <div className="space-y-4">
      {/* Account Section */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <IndicatorDot color="blue" />
              <h3 className="font-semibold">Account</h3>
            </div>
          </div>
          <div className="px-4 divide-y divide-border">
            <SettingRow 
              label="ID" 
              value={<span className="font-mono text-sm">{displayId}</span>}
              action={
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyId}>
                  <Copy className="h-4 w-4" />
                </Button>
              }
              showArrow={false}
            />
            <SettingRow 
              label="Email" 
              value={<span className="text-sm">{email}</span>}
              showArrow={true}
              onClick={() => toast.info('Email changes are not supported yet')}
            />
            <SettingRow 
              label="Password" 
              showArrow={true}
              onClick={() => toast.info('Password reset email will be sent to your email')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Section */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <IndicatorDot color="orange" />
              <h3 className="font-semibold">Profile</h3>
            </div>
          </div>
          <div className="px-4 divide-y divide-border">
            <Dialog open={nicknameDialogOpen} onOpenChange={setNicknameDialogOpen}>
              <DialogTrigger asChild>
                <div>
                  <SettingRow 
                    label="Nickname" 
                    value={<span className="text-sm">{profile.full_name || 'Not set'}</span>}
                    showArrow={true}
                    onClick={() => setNicknameDialogOpen(true)}
                  />
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Nickname</DialogTitle>
                  <DialogDescription>
                    Update your display name. This will be shown across the app.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input
                    id="nickname"
                    value={nicknameValue}
                    onChange={(e) => setNicknameValue(e.target.value)}
                    placeholder="Enter your nickname"
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleNicknameSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between py-3">
              <span className="text-foreground">Profile Picture</span>
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {profile.full_name?.charAt(0) || email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plan Section */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <IndicatorDot color="orange" />
              <h3 className="font-semibold">Subscription Plan</h3>
            </div>
          </div>
          <div className="px-4">
            <div className="flex items-center justify-between py-3">
              <span className="text-foreground capitalize">
                {profile.subscription_tier === 'free' ? 'Free Plan' : `${profile.subscription_tier} Plan`}
              </span>
              <Button variant="link" className="text-primary p-0 h-auto" asChild>
                <Link to="/pricing">Manage Subscription</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Section */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <IndicatorDot color="blue" />
              <h3 className="font-semibold">Preferences</h3>
            </div>
          </div>
          <div className="px-4 divide-y divide-border">
            <div className="flex items-center justify-between py-3">
              <span className="text-foreground">Theme</span>
              <div className="flex gap-1">
                {['light', 'dark', 'system'].map((t) => (
                  <Button
                    key={t}
                    variant={formData.theme_preference === t ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleThemeChange(t)}
                    className="capitalize text-xs px-3"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-foreground">AI Response Language</span>
              <Select value={formData.language_preference} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications Settings */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <IndicatorDot color="blue" />
              <h3 className="font-semibold">Email Notifications Settings</h3>
            </div>
          </div>
          <div className="px-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive study tips and updates via email</p>
              </div>
              <Switch
                checked={formData.email_notifications}
                onCheckedChange={handleToggleEmailNotifications}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts Section */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <IndicatorDot color="green" />
              <h3 className="font-semibold">Connected Accounts</h3>
            </div>
          </div>
          <div className="px-4 divide-y divide-border">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Are you on Google?</p>
                <p className="text-sm text-muted-foreground">Connect your NewtonAI account with Google to log in easily</p>
              </div>
              <Button 
                variant="link" 
                className={googleConnected ? "text-primary" : "text-muted-foreground"}
                onClick={handleGoogleConnect}
              >
                {googleConnected ? 'Connected' : 'Connect'}
              </Button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Are you on Apple?</p>
                <p className="text-sm text-muted-foreground">Connect your NewtonAI account with Apple to log in easily</p>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                className="rounded-full h-10 w-10 border-muted-foreground/30"
                onClick={() => toast.info('Apple sign-in coming soon!')}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </Button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Are you on Discord?</p>
                <p className="text-sm text-muted-foreground">Connect your NewtonAI account with Discord to log in easily</p>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                className="rounded-full h-10 w-10 border-muted-foreground/30"
                onClick={() => toast.info('Discord sign-in coming soon!')}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Section */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <DeleteAccountDialog userEmail={email} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
