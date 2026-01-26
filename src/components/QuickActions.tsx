import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, MessageCircle, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const QuickActions = () => {
  const { toast } = useToast();

  const handleCallEmergency = () => {
    window.location.href = 'tel:112';
  };

  const handleShareLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

          if (navigator.share) {
            try {
              await navigator.share({
                title: 'My Location',
                text: 'Here is my current location',
                url: locationUrl,
              });
            } catch (err) {
              navigator.clipboard.writeText(locationUrl);
              toast({
                title: "Location Copied",
                description: "Location link copied to clipboard.",
              });
            }
          } else {
            navigator.clipboard.writeText(locationUrl);
            toast({
              title: "Location Copied",
              description: "Location link copied to clipboard.",
            });
          }
        },
        () => {
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Unable to get your location. Please enable location services.",
          });
        }
      );
    }
  };

  const handleParentsCall = () => {
    toast({
      title: "📞 Incoming Call...",
      description: "Mom is calling ",
    });
    // In a real app, this would trigger a fake incoming call UI
  };

  const handleQuickMessage = () => {
    toast({
      title: "Quick Message Sent",
      description: "Your trusted contacts have been notified that you're safe.",
    });
  };

  const actions = [
    {
      icon: Phone,
      label: 'Call 112',
      description: 'Emergency services',
      onClick: handleCallEmergency,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      icon: MapPin,
      label: 'Share Location',
      description: 'Get out safely',
      onClick: handleShareLocation,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      icon: Phone,
      label: 'Parents Call',
      description: ' Send to contacts',
      onClick: handleParentsCall,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: MessageCircle,
      label: "I'm Safe",
      description: 'Notify contacts',
      onClick: handleQuickMessage,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Share2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div>Quick Actions</div>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              Fast access to safety features
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={action.onClick}
              className="h-auto flex flex-col items-center gap-3 p-5 hover:bg-muted/80 hover:scale-105 transition-all duration-200 rounded-xl border border-transparent hover:border-border/50"
            >
              <div className={`w-14 h-14 rounded-xl ${action.bgColor} flex items-center justify-center shadow-sm transition-transform hover:scale-110`}>
                <action.icon className={`w-7 h-7 ${action.color}`} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
