import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import SOSButton from '@/components/SOSButton';
import TrustedContacts from '@/components/TrustedContacts';
import QuickActions from '@/components/QuickActions';
import SafetyStatus from '@/components/SafetyStatus';
import AlertHistory from '@/components/AlertHistory';
import { JourneyTracking } from '@/components/JourneyTracking';
import { ThemeToggle } from '@/components/ThemeToggle';
import ThreatPrediction from '@/components/ThreatPrediction';
import LocationTrackingMap from '@/components/LocationTrackingMap';
import UnsafeZoneMap from '@/components/UnsafeZoneMap';
import WomenHelpNetwork from '@/components/WomenHelpNetwork';
import SilentEvidenceCollection from '@/components/SilentEvidenceCollection';
import StealthMode from '@/components/StealthMode';
import { LogOut, User, Settings } from 'lucide-react';
import Logo from '@/components/Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[Dashboard] Auth state - loading:', loading, 'user:', user ? 'present' : 'null');
    if (!loading && !user) {
      console.log('[Dashboard] No user, redirecting to /auth');
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    console.log('[Dashboard] Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Logo size="lg" className="animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your safety dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[Dashboard] Loading complete but no user, returning null');
    return null;
  }

  console.log('[Dashboard] Rendering dashboard for user:', user.id);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b-2 border-border/50 shadow-sm backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
          <Logo size="md" showText={true} />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-primary/10 transition-colors"
                  title="Account menu"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-foreground">Account</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive cursor-pointer focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6 pb-32 max-w-7xl">
        {/* Welcome Section */}
        <div className="animate-slide-up mb-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                Welcome back! 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your safety dashboard - everything you need in one place
              </p>
            </div>
          </div>
        </div>

        {/* Safety Status - Priority Section */}
        <div className="animate-slide-up">
          <SafetyStatus />
        </div>

        {/* Quick Actions - Easy Access */}
        <div className="animate-slide-up-delay-1">
          <QuickActions />
        </div>

        {/* Map and Journey Tracking - Side by Side on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up-delay-1">
          {/* Location Tracking Map */}
          <div>
            <LocationTrackingMap />
          </div>

          {/* Journey Tracking */}
          <div>
            <JourneyTracking />
          </div>
        </div>

        {/* Unsafe Zone Intelligence Map */}
        <div className="animate-slide-up-delay-2">
          <UnsafeZoneMap />
        </div>

        {/* Women-to-Women Help Network */}
        <div className="animate-slide-up-delay-2">
          <WomenHelpNetwork />
        </div>

        {/* Silent Evidence Collection */}
        <div className="animate-slide-up-delay-3">
          <SilentEvidenceCollection />
        </div>

        {/* Stealth Mode & E2E Encryption */}
        <div className="animate-slide-up-delay-3">
          <StealthMode />
        </div>

        {/* AI Threat Prediction */}
        <div className="animate-slide-up-delay-2">
          <ThreatPrediction />
        </div>

        {/* Trusted Contacts and Alert History - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up-delay-2">
          {/* Trusted Contacts */}
          <div>
            <TrustedContacts />
          </div>

          {/* Alert History */}
          <div>
            <AlertHistory />
          </div>
        </div>
      </main>

      {/* Floating SOS Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <SOSButton size="large" />
      </div>
    </div>
  );
};

export default Dashboard;
