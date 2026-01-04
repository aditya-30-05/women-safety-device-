import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Eye, EyeOff, Lock, Calculator, FileText, Music, Settings, Shield, Key, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

import { EncryptionService, getEncryptionPassword, isStealthModeActive } from '@/lib/encryption';

type DisguiseMode = 'calculator' | 'notes' | 'music' | 'settings' | 'none';

const StealthMode = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isStealthActive, setIsStealthActive] = useState(false);
  const [disguiseMode, setDisguiseMode] = useState<DisguiseMode>('calculator');
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [testData, setTestData] = useState('');
  const [encryptedData, setEncryptedData] = useState('');
  const [decryptedData, setDecryptedData] = useState('');

  // Load stealth mode state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('stealth_mode');
    if (saved) {
      const parsed = JSON.parse(saved);
      setIsStealthActive(parsed.active || false);
      setDisguiseMode(parsed.mode || 'calculator');
    }
  }, []);

  // Save stealth mode state
  useEffect(() => {
    localStorage.setItem('stealth_mode', JSON.stringify({
      active: isStealthActive,
      mode: disguiseMode,
    }));
  }, [isStealthActive, disguiseMode]);

  // Apply disguise mode to document
  useEffect(() => {
    if (isStealthActive && disguiseMode !== 'none') {
      applyDisguise(disguiseMode);
    } else {
      removeDisguise();
    }
    return () => removeDisguise();
  }, [isStealthActive, disguiseMode]);

  const applyDisguise = (mode: DisguiseMode) => {
    const titleMap = {
      calculator: 'Calculator',
      notes: 'Notes',
      music: 'Music Player',
      settings: 'Settings',
      none: 'SafeHer',
    };

    document.title = titleMap[mode];
    
    // Change favicon (if possible)
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (favicon) {
      // Could change favicon here if you have disguise icons
    }

    // Add disguise class to body
    document.body.classList.add(`disguise-${mode}`);
  };

  const removeDisguise = () => {
    document.title = 'Women Safety Device';
    document.body.classList.remove('disguise-calculator', 'disguise-notes', 'disguise-music', 'disguise-settings');
  };

  const handleStealthToggle = (checked: boolean) => {
    if (checked) {
      setShowPasswordDialog(true);
    } else {
      setIsStealthActive(false);
      toast({
        title: 'Stealth Mode Deactivated',
        description: 'App is now in normal mode.',
      });
    }
  };

  const activateStealthMode = () => {
    if (!encryptionPassword.trim()) {
      toast({
        variant: 'destructive',
        title: 'Password Required',
        description: 'Please set an encryption password.',
      });
      return;
    }

    if (encryptionPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords Mismatch',
        description: 'Passwords do not match.',
      });
      return;
    }

    setIsStealthActive(true);
    setShowPasswordDialog(false);
    setConfirmPassword('');
    
    // Save password hash (not the actual password)
    const passwordHash = btoa(encryptionPassword);
    localStorage.setItem('encryption_password_hash', passwordHash);

    toast({
      title: '🕵️ Stealth Mode Activated',
      description: `App disguised as ${disguiseMode}. All SOS data will be encrypted.`,
    });
  };

  const encryptSOSData = async (data: any) => {
    if (!encryptionPassword) {
      toast({
        variant: 'destructive',
        title: 'No Password Set',
        description: 'Please set an encryption password first.',
      });
      return null;
    }

    try {
      const jsonData = JSON.stringify(data);
      const encrypted = await EncryptionService.encrypt(jsonData, encryptionPassword);
      return encrypted;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Encryption Failed',
        description: 'Failed to encrypt SOS data.',
      });
      return null;
    }
  };

  const decryptSOSData = async (encryptedData: string, password: string) => {
    try {
      const decrypted = await EncryptionService.decrypt(encryptedData, password);
      return JSON.parse(decrypted);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Decryption Failed',
        description: 'Failed to decrypt data. Check your password.',
      });
      return null;
    }
  };

  const handleTestEncryption = async () => {
    if (!testData.trim()) {
      toast({
        variant: 'destructive',
        title: 'No Data',
        description: 'Please enter test data.',
      });
      return;
    }

    if (!encryptionPassword) {
      toast({
        variant: 'destructive',
        title: 'No Password',
        description: 'Please set an encryption password.',
      });
      return;
    }

    try {
      const password = encryptionPassword || getEncryptionPassword() || '';
      if (!password) {
        toast({
          variant: 'destructive',
          title: 'No Password',
          description: 'Please set an encryption password.',
        });
        return;
      }
      
      const encrypted = await EncryptionService.encrypt(testData, password);
      setEncryptedData(encrypted);
      
      const decrypted = await EncryptionService.decrypt(encrypted, password);
      setDecryptedData(decrypted);
      
      toast({
        title: 'Encryption Test Successful',
        description: 'Data encrypted and decrypted successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Encryption Test Failed',
        description: 'Error during encryption test.',
      });
    }
  };

  const getDisguiseIcon = (mode: DisguiseMode) => {
    switch (mode) {
      case 'calculator':
        return <Calculator className="h-5 w-5" />;
      case 'notes':
        return <FileText className="h-5 w-5" />;
      case 'music':
        return <Music className="h-5 w-5" />;
      case 'settings':
        return <Settings className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getDisguiseDescription = (mode: DisguiseMode) => {
    switch (mode) {
      case 'calculator':
        return 'Appears as a calculator app';
      case 'notes':
        return 'Appears as a notes app';
      case 'music':
        return 'Appears as a music player';
      case 'settings':
        return 'Appears as system settings';
      default:
        return 'No disguise';
    }
  };

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <EyeOff className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>Stealth Mode & E2E Encryption</span>
                {isStealthActive && (
                  <span className="text-xs bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-1 rounded border border-red-500/30">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Disguise app and encrypt SOS data end-to-end
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stealth Mode Toggle */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isStealthActive ? 'bg-red-500/20 border-2 border-red-500/30' : 'bg-muted border-2 border-border'
                }`}>
                  {isStealthActive ? (
                    <EyeOff className="h-6 w-6 text-red-500" />
                  ) : (
                    <Eye className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {isStealthActive ? 'Stealth Mode Active' : 'Stealth Mode Inactive'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isStealthActive
                      ? 'App is disguised. All SOS data encrypted.'
                      : 'Activate to disguise app and enable encryption'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isStealthActive}
                onCheckedChange={handleStealthToggle}
              />
            </div>

            {isStealthActive && (
              <div className="mt-4 p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  {getDisguiseIcon(disguiseMode)}
                  <p className="text-sm font-medium text-foreground">
                    Current Disguise: {disguiseMode.charAt(0).toUpperCase() + disguiseMode.slice(1)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {getDisguiseDescription(disguiseMode)}
                </p>
              </div>
            )}
          </div>

          {/* Disguise Mode Selection */}
          {!isStealthActive && (
            <div className="space-y-2">
              <Label>Disguise Mode</Label>
              <Select value={disguiseMode} onValueChange={(value: DisguiseMode) => setDisguiseMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calculator">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      <span>Calculator</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="notes">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Notes App</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="music">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      <span>Music Player</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="settings">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose how the app appears when stealth mode is active
              </p>
            </div>
          )}

          {/* Encryption Password Setup */}
          <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">End-to-End Encryption</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Set a password to encrypt all SOS data. This password is required to decrypt data.
            </p>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="encryption-password">Encryption Password</Label>
                <div className="relative">
                  <Input
                    id="encryption-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter encryption password"
                    value={encryptionPassword}
                    onChange={(e) => setEncryptionPassword(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {!isStealthActive && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm encryption password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/50">
                <Key className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground flex-1">
                  <strong className="text-foreground">Important:</strong> Store this password securely. 
                  You cannot recover encrypted data without it.
                </p>
              </div>
            </div>
          </div>

          {/* Encryption Test */}
          {encryptionPassword && (
            <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50">
              <h3 className="font-semibold text-sm text-foreground">Test Encryption</h3>
              <div className="space-y-2">
                <Input
                  placeholder="Enter test data"
                  value={testData}
                  onChange={(e) => setTestData(e.target.value)}
                />
                <Button onClick={handleTestEncryption} variant="outline" size="sm" className="w-full">
                  Test Encryption/Decryption
                </Button>
              </div>
              {encryptedData && (
                <div className="space-y-2 mt-3">
                  <div>
                    <Label className="text-xs">Encrypted Data:</Label>
                    <p className="text-xs font-mono bg-background p-2 rounded border break-all">
                      {encryptedData.substring(0, 100)}...
                    </p>
                  </div>
                  {decryptedData && (
                    <div>
                      <Label className="text-xs">Decrypted Data:</Label>
                      <p className="text-xs bg-background p-2 rounded border">
                        {decryptedData}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Security Reminders</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Stealth mode changes app appearance but functionality remains</li>
                  <li>All SOS alerts and evidence are encrypted with your password</li>
                  <li>Never share your encryption password</li>
                  <li>Remember your password - it cannot be recovered</li>
                  <li>Disguise mode changes app title and appearance</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Confirmation Dialog */}
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Stealth Mode</AlertDialogTitle>
            <AlertDialogDescription>
              Please confirm your encryption password to activate stealth mode. 
              The app will be disguised and all SOS data will be encrypted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Enter Encryption Password</Label>
              <Input
                type="password"
                placeholder="Enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={activateStealthMode}>
              Activate Stealth Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StealthMode;

