import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvatarUpload } from './AvatarUpload';
import { Crown, Sparkles, Check, X, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ProfileHeaderProps {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  subscriptionTier: string;
  createdAt: string;
  onNameChange: (name: string) => void;
  onAvatarChange: (url: string) => void;
}

export function ProfileHeader({
  userId,
  fullName,
  avatarUrl,
  subscriptionTier,
  createdAt,
  onNameChange,
  onAvatarChange,
}: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(fullName || '');
  const [saving, setSaving] = useState(false);

  const getTierBadge = () => {
    const tier = subscriptionTier?.toLowerCase();
    if (tier === 'ultra') {
      return (
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
          <Crown className="h-3 w-3 mr-1" />
          Ultra
        </Badge>
      );
    }
    if (tier === 'pro' || tier === 'premium') {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
          <Sparkles className="h-3 w-3 mr-1" />
          Pro
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        Free
      </Badge>
    );
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName.trim() })
        .eq('id', userId);

      if (error) throw error;

      onNameChange(editName.trim());
      setIsEditing(false);
      toast.success('Name updated!');
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditName(fullName || '');
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-4 p-6 bg-card rounded-xl border border-border">
      <AvatarUpload
        userId={userId}
        currentAvatarUrl={avatarUrl}
        fullName={fullName}
        onAvatarChange={onAvatarChange}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 w-48"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave} disabled={saving}>
                <Check className="h-4 w-4 text-green-500" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold truncate">{fullName || 'User'}</h2>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:opacity-100"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </>
          )}
          {getTierBadge()}
        </div>
        <p className="text-sm text-muted-foreground">
          Member since {format(new Date(createdAt), 'MMMM yyyy')}
        </p>
      </div>
    </div>
  );
}
