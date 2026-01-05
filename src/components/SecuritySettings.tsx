import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shield, Key, Smartphone, Lock, AlertTriangle, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logSecurityEvent } from '@/lib/security';
import { supabase } from '@/integrations/supabase/client';

const SecuritySettings = () => {
  const { user, isMFAEnabled, enableMFA, verifyMFA, updatePassword, checkPermission } = useAuth();
  const { toast } = useToast();
  const [showMFADialog, setShowMFADialog] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  interface SecurityLog {
    event_type: string;
    user_id: string;
    severity: string;
    timestamp: string;
    ip_address?: string;
  }

  interface Session {
    id: string;
    user_id: string;
    device_info?: { name: string };
    ip_address: string;
    last_activity: string;
  }

  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);

  useEffect(() => {
    loadSecurityLogs();
    loadActiveSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadSecurityLogs = async () => {
    if (!user) return;
    try {
      const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
      const userLogs = logs.filter((log: SecurityLog) => log.user_id === user.id);
      setSecurityLogs(userLogs.slice(-10).reverse()); // Last 10 logs
    } catch (error) {
      console.error('Error loading security logs:', error);
    }
  };

  const loadActiveSessions = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('user_sessions' as any)
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('last_activity', { ascending: false });

      if (data) {
        setActiveSessions((data as unknown) as Session[]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const handleEnableMFA = async () => {
    const { error } = await enableMFA();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'MFA Setup Failed',
        description: error.message,
      });
    } else {
      setShowMFADialog(true);
      toast({
        title: 'MFA Enabled',
        description: 'Please verify with the code sent to your device.',
      });
    }
  };

  const handleVerifyMFA = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code.',
      });
      return;
    }

    const { error } = await verifyMFA(mfaCode);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error.message,
      });
    } else {
      setShowMFADialog(false);
      setMfaCode('');
      toast({
        title: 'MFA Verified',
        description: 'Multi-factor authentication is now active.',
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill in all password fields.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords Mismatch',
        description: 'Passwords do not match.',
      });
      return;
    }

    const { error } = await updatePassword(newPassword);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Password Update Failed',
        description: error.message,
      });
    } else {
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
      await logSecurityEvent('password_changed', user?.id || null, {}, 'medium');
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!user) return;
    try {
      await supabase
        .from('user_sessions' as any)
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      await loadActiveSessions();
      toast({
        title: 'Session Revoked',
        description: 'The session has been terminated.',
      });
      await logSecurityEvent('session_revoked', user.id, { sessionId }, 'low');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to revoke session.',
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600/20 text-red-700 dark:text-red-400 border-red-600/30';
      case 'high':
        return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30';
      default:
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30';
    }
  };

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div>Security Settings</div>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Manage your account security and authentication
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Multi-Factor Authentication */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Multi-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">
                    {isMFAEnabled
                      ? 'MFA is enabled for your account'
                      : 'Add an extra layer of security'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isMFAEnabled ? (
                  <Badge className="bg-success/20 text-success border-success/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Button onClick={handleEnableMFA} size="sm" variant="outline">
                    Enable MFA
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Key className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Change Password</p>
                <p className="text-xs text-muted-foreground">Update your account password</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleUpdatePassword} className="w-full" disabled={!newPassword || !confirmPassword}>
                <Lock className="h-4 w-4 mr-2" />
                Update Password
              </Button>
            </div>
          </div>

          {/* Active Sessions */}
          {activeSessions.length > 0 && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Active Sessions ({activeSessions.length})</p>
                  <p className="text-xs text-muted-foreground">Manage your active login sessions</p>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {session.device_info?.name || 'Unknown Device'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.ip_address} • {new Date(session.last_activity).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revokeSession(session.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Logs */}
          {securityLogs.length > 0 && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Recent Security Events</p>
                  <p className="text-xs text-muted-foreground">Your account activity log</p>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                {securityLogs.map((log, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-background/50 border border-border/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground">{log.event_type}</p>
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                        {log.ip_address && (
                          <p className="text-xs text-muted-foreground">IP: {log.ip_address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Recommendations */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Security Recommendations</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  {!isMFAEnabled && <li>Enable multi-factor authentication for better security</li>}
                  <li>Use a strong, unique password</li>
                  <li>Review and revoke unused sessions regularly</li>
                  <li>Monitor security logs for suspicious activity</li>
                  <li>Never share your password or MFA codes</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MFA Verification Dialog */}
      <Dialog open={showMFADialog} onOpenChange={setShowMFADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Multi-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from your authenticator app to complete MFA setup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <Input
                type="text"
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <Button onClick={handleVerifyMFA} className="w-full" disabled={mfaCode.length !== 6}>
              Verify & Enable MFA
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SecuritySettings;

