import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Shield, AlertTriangle } from 'lucide-react';
import Logo from '@/components/Logo';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { validatePasswordStrength, getRateLimitRemaining } from '@/lib/security';
import { seedDemoData } from '@/lib/demo-seed';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine((pwd) => validatePasswordStrength(pwd).isStrong, {
      message: 'Password does not meet security requirements'
    }),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long')
});
const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rateLimitRemaining, setRateLimitRemaining] = useState(5);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const {

    signIn,
    signInWithGoogle,
    signInWithMagicLink,
    signUp,
    resetPassword,
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isLogin && email) {
      const remaining = getRateLimitRemaining(`signin_${email}`, 5, 15 * 60 * 1000);
      setRateLimitRemaining(remaining);
    }
  }, [isLogin, email]);
  const validateForm = () => {
    try {
      if (isLogin) {
        if (isMagicLink) {
          if (!email) throw new z.ZodError([{ path: ['email'], message: 'Email is required', code: 'custom' }]);
        } else {
          loginSchema.parse({
            email,
            password
          });
        }
      } else {
        signupSchema.parse({
          email,
          password,
          fullName
        });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      if (isLogin) {
        if (isMagicLink) {
          const { error } = await signInWithMagicLink(email);
          if (error) {
            toast({
              variant: "destructive",
              title: "Magic Link Failed",
              description: error.message
            });
          } else {
            toast({
              title: "Magic Link Sent",
              description: "Check your email for the login link."
            });
          }
        } else {
          const {
            error
          } = await signIn(email, password);
          if (error) {
            if (error.message.includes('Invalid login credentials')) {
              toast({
                variant: "destructive",
                title: "Login Failed",
                description: "Invalid email or password. Please try again."
              });
            } else {
              toast({
                variant: "destructive",
                title: "Login Failed",
                description: error.message
              });
            }
          } else {
            toast({
              title: "Welcome back!",
              description: "You've successfully logged in."
            });
            navigate('/dashboard');
          }
        }
      } else {
        const {
          error
        } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              variant: "destructive",
              title: "Account Exists",
              description: "An account with this email already exists. Please log in instead."
            });
            setIsLogin(true);
          } else {
            toast({
              variant: "destructive",
              title: "Sign Up Failed",
              description: error.message
            });
          }
        } else {
          toast({
            title: "Account Created!",
            description: "Welcome to SafeHer. Let's set up your safety profile."
          });
          navigate('/dashboard');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen p-4 text-accent flex items-center justify-center border-0 shadow-lg">
    <div className="w-full max-w-md">
      <div className="text-center mb-8 animate-slide-up">
        <div className="flex justify-center mb-4">
          <Logo size="xl" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground">SafeHer</h1>
        <p className="text-muted-foreground mt-2">Your safety, our priority</p>
      </div>

      <Card className="glass-card animate-slide-up-delay-1">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-display">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to access your safety dashboard' : 'Join SafeHer to protect yourself and loved ones'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="fullName" type="text" placeholder="Enter your name" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-10" required={!isLogin} />
              </div>
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
            </div>}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {!isMagicLink && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  {isLogin && rateLimitRemaining < 5 && (
                    <span className="text-xs text-muted-foreground">
                      {rateLimitRemaining} attempts remaining
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10" required={!isMagicLink} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                {!isLogin && password && (
                  <PasswordStrengthMeter password={password} />
                )}
              </div>
            )}

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? 'Please wait...' : isLogin ? (isMagicLink ? 'Send Magic Link' : 'Sign In') : 'Create Account'}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full relative"
            onClick={async () => {
              setIsLoading(true);
              try {
                const { error } = await signInWithGoogle();
                if (error) {
                  toast({
                    variant: "destructive",
                    title: "Google Sign In Failed",
                    description: error.message
                  });
                }
              } catch (error) {
                toast({
                  variant: "destructive",
                  title: "Google Sign In Error",
                  description: "An unexpected error occurred"
                });
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>

          <div className="mt-6 space-y-3">
            {isLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </button>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setIsMagicLink(!isMagicLink)}
                    className="text-sm text-primary hover:underline transition-all"
                  >
                    {isMagicLink ? 'Use Password Login' : 'Use Magic Link (Passwordless)'}
                  </button>
                </div>
                <div className="pt-4 mt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Quick Access</p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                    onClick={async () => {
                      setIsLoading(true);
                      const demoEmail = 'demo@example.com';
                      const demoPassword = 'SafeHerDemo123!';
                      const demoName = 'SafeHer Demo User';

                      let { error } = await signIn(demoEmail, demoPassword);

                      // If account doesn't exist, create it automatically
                      if (error && error.message.toLowerCase().includes('invalid login credentials')) {
                        const { error: signUpError } = await signUp(demoEmail, demoPassword, demoName);
                        if (!signUpError) {
                          const { error: secondSignInError } = await signIn(demoEmail, demoPassword);
                          error = secondSignInError;
                        } else {
                          error = signUpError;
                        }
                      }

                      if (error) {
                        toast({
                          variant: "destructive",
                          title: "Demo Login Failed",
                          description: error.message
                        });
                        setEmail(demoEmail);
                        setPassword(demoPassword);
                      } else {
                        const { data: { user: sessionUser } } = await supabase.auth.getUser();
                        if (sessionUser) {
                          await seedDemoData(sessionUser.id);
                        }

                        toast({
                          title: "Welcome to SafeHer Demo",
                          description: "The demo environment is ready."
                        });
                        navigate('/dashboard');
                      }
                      setIsLoading(false);
                    }}
                    disabled={isLoading}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Sign In as Demo User
                  </Button>
                </div>
              </div>
            )}
            <div className="text-center">
              <button type="button" onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-3">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
          <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground mb-1">Security Features</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>• End-to-end encrypted data</li>
              <li>• Rate limiting protection</li>
              <li>• Secure password requirements</li>
              <li>• Multi-factor authentication available</li>
            </ul>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">By continuing, you agree to our Terms of Service and Privacy Policy</p>
      </div>
    </div>

    {/* Forgot Password Dialog */}
    {showForgotPassword && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={async () => {
                  if (!resetEmail.trim()) {
                    toast({
                      variant: 'destructive',
                      title: 'Email Required',
                      description: 'Please enter your email address.',
                    });
                    return;
                  }
                  const { error } = await resetPassword(resetEmail);
                  if (error) {
                    toast({
                      variant: 'destructive',
                      title: 'Error',
                      description: error.message,
                    });
                  } else {
                    toast({
                      title: 'Reset Link Sent',
                      description: 'Check your email for password reset instructions.',
                    });
                    setShowForgotPassword(false);
                    setResetEmail('');
                  }
                }}
              >
                Send Reset Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
  </div>;
};
export default Auth;