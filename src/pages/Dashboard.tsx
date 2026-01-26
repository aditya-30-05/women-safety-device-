import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import SOSButton from '@/components/SOSButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import ParentDashboard from '@/components/ParentDashboard';
import WomanDashboard from '@/components/WomanDashboard';
import RoleGate from '@/components/RoleGate';
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
  const { user, signOut, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user) {
      // Handle role-based dashboard redirection
      if (location.pathname === '/dashboard') {
        const targetPath = userRole === 'parent' ? '/dashboard/monitoring' : '/dashboard/safety';
        navigate(targetPath, { replace: true });
      } else if (location.pathname === '/dashboard/monitoring' && userRole !== 'parent' && userRole !== 'admin') {
        navigate('/dashboard/safety', { replace: true });
      } else if (location.pathname === '/dashboard/safety' && userRole === 'parent') {
        navigate('/dashboard/monitoring', { replace: true });
      }
    }
  }, [user, loading, userRole, location.pathname, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Logo size="lg" className="animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your safety dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      {/* Shared Header */}
      <header className="sticky top-0 z-50 glass-card border-b-2 border-border/50 shadow-sm backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
          <Logo size="md" showText={true} />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-colors">
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
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Role-Specific Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6 pb-32 max-w-7xl">
        <div className="animate-slide-up mb-2">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Welcome back! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Role: <span className="capitalize font-semibold text-primary">{userRole}</span>
          </p>
        </div>

        {userRole === 'parent' ? (
          <RoleGate allowedRoles={['parent']}>
            <ParentDashboard />
          </RoleGate>
        ) : (
          <RoleGate allowedRoles={['woman']}>
            <WomanDashboard />
          </RoleGate>
        )}
      </main>

      {/* Floating SOS Button - Strict Isolation */}
      <RoleGate allowedRoles={['woman']} contentOnly>
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <SOSButton size="large" />
        </div>
      </RoleGate>
    </div>
  );
};

export default Dashboard;
