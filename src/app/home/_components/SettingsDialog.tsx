import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
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
import { User, Plus, AlertCircle } from 'lucide-react';
import { useUpdateUserProfile } from '@/hooks/queries';
import type { User as UserType } from '@/types/user';
import DefaultCatiUserImage from '@/../public/images/default-cati-user.webp';

interface SettingsDialogProps {
  user: UserType | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserSettings {
  userNickname: string;
  profilePictureFile: File | null;
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
    profilePictureFile: null,
    language: user?.language || 'en',
    timezone: user?.timezone || 'UTC',
  });

  const [imageError, setImageError] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Update settings when user data changes
  useEffect(() => {
    if (user) {
      setSettings({
        userNickname: user.userNickname || '',
        profilePictureFile: null,
        language: user.language || 'en',
        timezone: user.timezone || 'UTC',
      });
      setImageError(false);
      setPreviewUrl(null);
    }
  }, [user]);

  // Cleanup preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileUpload = (file: File) => {
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Please select an image smaller than 2MB',
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', {
        description: 'Please select an image file',
      });
      return;
    }

    setSettings(prev => ({ ...prev, profilePictureFile: file }));

    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create new preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleSave = async () => {
    const toastId = toast.loading('Updating profile...', {
      description: 'Please wait while we save your changes',
    });

    try {
      const updateData = {
        userNickname: settings.userNickname,
        language: settings.language,
        timezone: settings.timezone,
        ...(settings.profilePictureFile && { profilePictureFile: settings.profilePictureFile }),
      };

      await updateUserProfileMutation.mutateAsync(updateData);

      toast.success('Profile updated successfully!', {
        id: toastId,
        description: 'Your profile settings have been saved',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update profile:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile. Please try again.';

      toast.error('Failed to update profile', {
        id: toastId,
        description: errorMessage,
      });
    }
  };

  const handleReset = () => {
    setSettings({
      userNickname: user?.userNickname || '',
      profilePictureFile: null,
      language: user?.language || 'en',
      timezone: user?.timezone || 'UTC',
    });
    setImageError(false);

    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Current Profile Section */}
          <div className="flex items-center bg-gray-100 justify-center rounded-xl px-6 py-4">
            {/* Profile Picture */}
            <div className="flex flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center overflow-hidden relative">
                <Image
                  src={user?.profilePictureUrl || DefaultCatiUserImage}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
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

            {/* Profile Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="profileImage">Profile Image (Avatar)</Label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
                  }`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => document.getElementById('profileImageInput')?.click()}
              >
                <input
                  id="profileImageInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />

                <div className="flex flex-col items-center justify-center text-center">
                  {previewUrl ? (
                    <div className="flex flex-col items-center">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded-full mb-2"
                      />
                      <p className="text-sm text-gray-600">Click to change image</p>
                    </div>
                  ) : (
                    <>
                      <Plus className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Drag and drop image (max size 2 MB)
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        or click to browse
                      </p>
                    </>
                  )}
                </div>
              </div>
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
          <div className="flex justify-between items-center w-full">
            <div className=" ml-auto flex gap-2">
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
