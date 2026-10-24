import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/db';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { ThemeToggle } from '../components/ThemeToggle';
import { Github, KeyRound } from 'lucide-react';

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [github, setGithub] = useState(user?.githubUsername || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!user) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    const updatedUser = {
      ...user,
      name: name.trim(),
      githubUsername: github.trim() || null,
    };

    db.saveUser(updatedUser);
    refreshUser();
    setIsSaving(false);
    setMessage('Profile updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const currentHash = await hashPassword(currentPassword, user.passwordSalt);
      if (currentHash !== user.passwordHash) {
        setPasswordError('Incorrect current password.');
        return;
      }

      const newSalt = crypto.randomUUID();
      const newHash = await hashPassword(newPassword, newSalt);

      const updatedUser = {
        ...user,
        passwordHash: newHash,
        passwordSalt: newSalt,
      };

      db.saveUser(updatedUser);
      refreshUser();
      setCurrentPassword('');
      setNewPassword('');
      setPasswordSuccess('Password changed successfully!');
      setTimeout(() => setPasswordSuccess(''), 3500);
    } catch {
      setPasswordError('Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your credentials, theme, and GitHub integration.</p>
      </div>

      {/* Personal Info Form */}
      <form onSubmit={handleSaveProfile}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your profile name and public details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <div className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm p-3 rounded-md border border-emerald-500/20" role="status">
                {message}
              </div>
            )}
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                value={user.email}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Email is tied to your account identity.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">GitHub Username</label>
              <div className="relative">
                <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  className="pl-10"
                  placeholder="e.g. alex-demo"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                />
              </div>
              {github && (
                <p className="text-xs text-muted-foreground">
                  Linked profile:{' '}
                  <a 
                    href={`https://github.com/${github}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    https://github.com/{github}
                  </a>
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Theme Preference</span>
              <ThemeToggle />
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handleChangePassword}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Change Password
            </CardTitle>
            <CardDescription>
              Passwords are salted and hashed using SHA-256 via Web Crypto API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordError && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20" role="alert">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm p-3 rounded-md border border-emerald-500/20" role="status">
                {passwordSuccess}
              </div>
            )}
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="New Password (min 8 characters)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-6">
            <Button type="submit" disabled={isChangingPassword || !currentPassword || !newPassword}>
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">User ID</span>
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{user.id}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Registered</span>
            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
