import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { User } from 'lucide-react';
import type { User as UserType } from '@/types/user';

interface SettingsDialogProps {
  user: UserType | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: UserSettings) => void;
}

interface UserSettings {
  nickname: string;
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

export function SettingsDialog({ user, isOpen, onOpenChange, onSave }: SettingsDialogProps) {
  const [settings, setSettings] = useState<UserSettings>({
    nickname: user?.nickname || user?.name || '',
    profilePictureUrl: user?.profilePictureUrl || '',
    language: user?.language || 'en',
    timezone: user?.timezone || 'UTC',
  });

  const handleSave = () => {
    onSave(settings);
    onOpenChange(false);
  };

  const handleReset = () => {
    setSettings({
      nickname: user?.nickname || user?.name || '',
      profilePictureUrl: user?.profilePictureUrl || '',
      language: user?.language || 'en',
      timezone: user?.timezone || 'UTC',
    });
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
                {user?.profilePictureUrl ? (
                  <>
                    <img
                      src={user.profilePictureUrl}
                      alt="Profile"
                      className="w-full h-full object-cover absolute inset-0"
                      onError={(e) => {
                        // Hide the image and show fallback
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <User className="w-8 h-8 text-gray-500" />
                  </>
                ) : (
                  <User className="w-8 h-8 text-gray-500" />
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className=" text-sm text-gray-400">
                  Current Profile
                </div>
                <div className=" font-medium text-gray-900">
                  {user?.nickname || user?.name || 'Anonymous User'}
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
                value={settings.nickname}
                onChange={(e) => setSettings(prev => ({ ...prev, nickname: e.target.value }))}
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
          <div className="flex justify-between items-center w-full">
            <Button
              variant="outline"
              onClick={handleReset}
            >
              Reset to Current
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
