import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { User, AlertCircle, CheckCircle } from 'lucide-react';
import { useUpdateUserProfile } from '@/hooks/queries';
import type { User as UserType } from '@/types/user';

interface SettingsDialogProps {
  user: UserType | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserSettings {
  userNickname: string;
  profilePictureUrl: string;
  language: string;
  timezone: string;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語 (Japanese)' },
  { value: 'zh', label: '中文 (Chinese)' },
  { value: 'ko', label: '한국어 (Korean)' },
];

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'GMT', label: 'GMT (Greenwich Mean Time)' },
  { value: 'EST', label: 'EST (Eastern Standard Time)' },
  { value: 'CST', label: 'CST (Central Standard Time)' },
  { value: 'PST', label: 'PST (Pacific Standard Time)' },
  { value: 'CET', label: 'CET (Central European Time)' },
  { value: 'JST', label: 'JST (Japan Standard Time)' },
  { value: 'KST', label: 'KST (Korea Standard Time)' },
];

export function SettingsDialog({ user, isOpen, onOpenChange }: SettingsDialogProps) {
  const updateUserProfileMutation = useUpdateUserProfile();
  
  const [settings, setSettings] = useState<UserSettings>({
    userNickname: user?.userNickname || '',
    profilePictureUrl: user?.profilePictureUrl || '',
    language: user?.language || 'en',
    timezone: user?.timezone || 'UTC',
  });

  const [imageError, setImageError] = useState(false);

  // Update settings when user data changes
  useEffect(() => {
    if (user) {
      setSettings({
        userNickname: user.userNickname || '',
        profilePictureUrl: user.profilePictureUrl || '',
        language: user.language || 'en',
        timezone: user.timezone || 'UTC',
      });
      setImageError(false);
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateUserProfileMutation.mutateAsync(settings);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Error is handled by React Query and shown in UI
    }
  };

  const handleReset = () => {
    setSettings({
      userNickname: user?.userNickname || '',
      profilePictureUrl: user?.profilePictureUrl || '',
      language: user?.language || 'en',
      timezone: user?.timezone || 'UTC',
    });
    setImageError(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Current Profile Section */}
          <div className="flex items-center bg-gray-100 justify-center rounded-xl px-6 py-4">
            {/* Profile Picture */}
            <div className="flex flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center overflow-hidden relative">
                {user?.profilePictureUrl && !imageError ? (
                  <Image
                    src={user.profilePictureUrl}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-500" />
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className=" text-sm text-gray-400">
                  Current Profile
                </div>
                <div className="font-medium text-gray-900">
                  {user?.userNickname || 'Anonymous User'}
                </div>
              </div>
            </div>
          </div>

          {/* Settings Form */}
          <div className="space-y-4">
            {/* Nickname */}
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                placeholder="Enter your nickname"
                value={settings.userNickname}
                onChange={(e) => setSettings(prev => ({ ...prev, userNickname: e.target.value }))}
              />
            </div>

            {/* Profile Image URL */}
            <div className="space-y-2">
              <Label htmlFor="profileUrl">Profile Image URL</Label>
              <Input
                id="profileUrl"
                placeholder="https://example.com/image.jpg"
                value={settings.profilePictureUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, profilePictureUrl: e.target.value }))}
              />
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={settings.language}
                onValueChange={(value: string) => setSettings(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger className="w-full bg-gray-200 border-0 hover:bg-gray-100 focus:bg-gray-100 h-10">
                  <SelectValue placeholder="Select a language..." />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Time Zone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value: string) => setSettings(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger className="w-full bg-gray-200 border-0 hover:bg-gray-100 focus:bg-gray-100 h-10">
                  <SelectValue placeholder="Select a timezone..." />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          {/* Error Display */}
          {updateUserProfileMutation.error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mb-3 w-full">
              <AlertCircle className="w-4 h-4" />
              <span>
                {updateUserProfileMutation.error instanceof Error 
                  ? updateUserProfileMutation.error.message 
                  : 'Failed to update profile. Please try again.'}
              </span>
            </div>
          )}

          {/* Success Display */}
          {updateUserProfileMutation.isSuccess && (
            <div className="flex items-center gap-2 text-green-600 text-sm mb-3 w-full">
              <CheckCircle className="w-4 h-4" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <div className="flex justify-between items-center w-full">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={updateUserProfileMutation.isPending}
            >
              Reset to Current
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateUserProfileMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateUserProfileMutation.isPending}
              >
                {updateUserProfileMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
