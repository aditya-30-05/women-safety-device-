import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, Users, MapPin, Bell, ArrowRight, CheckCircle } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-hero)' }}>
        <Shield className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  const features = [
    {
      icon: Bell,
      title: 'Instant SOS Alert',
      description: 'One-tap emergency alert to all your trusted contacts with your live location',
    },
    {
      icon: Users,
      title: 'Trusted Contacts',
      description: 'Add family and friends who will be notified instantly in emergencies',
    },
    {
      icon: MapPin,
      title: 'Live Location Sharing',
      description: 'Share your real-time location with trusted contacts for added safety',
    },
  ];

  const safetyTips = [
    'Always share your location when traveling alone',
    'Keep your phone charged and accessible',
    'Trust your instincts in uncomfortable situations',
    'Have emergency contacts saved and ready',
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-hero)' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 pt-12 pb-20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16 animate-slide-up">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display font-bold text-2xl">SafeHer</span>
          </div>

          {/* Hero Content */}
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6 animate-slide-up">
              Your Safety, <br />
              <span className="gradient-text">Our Priority</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 animate-slide-up-delay-1">
              SafeHer is your personal safety companion. Send instant SOS alerts, 
              share your live location, and stay connected with your trusted circle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up-delay-2">
              <Button 
                variant="hero" 
                size="xl" 
                onClick={() => navigate('/auth')}
                className="group"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="xl"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -right-20 top-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -right-10 top-40 w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-4">
              Stay Protected, Always
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Powerful safety features designed to keep you and your loved ones safe
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-card p-6 rounded-2xl hover:shadow-medium transition-shadow"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Tips Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-display font-bold mb-8 text-center">
              Safety Tips
            </h2>
            <div className="space-y-4">
              {safetyTips.map((tip, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-success/5 border border-success/20"
                >
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <p className="text-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="glass-card rounded-3xl p-8 md:p-12 text-center max-w-3xl mx-auto" 
               style={{ background: 'var(--gradient-primary)' }}>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
              Ready to Feel Safer?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join thousands of women who trust SafeHer for their personal safety. 
              It's free, simple, and could save your life.
            </p>
            <Button 
              variant="secondary" 
              size="xl"
              onClick={() => navigate('/auth')}
              className="bg-card text-primary hover:bg-card/90"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-display font-bold">SafeHer</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 SafeHer. Empowering women's safety worldwide.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
