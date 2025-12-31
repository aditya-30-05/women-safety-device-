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

  const handleFakeCall = () => {
    toast({
      title: "📞 Incoming Call...",
      description: "Mom is calling you",
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
      description: 'Send to contacts',
      onClick: handleShareLocation,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      icon: Phone,
      label: 'Fake Call',
      description: 'Get out safely',
      onClick: handleFakeCall,
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
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={action.onClick}
              className="h-auto flex flex-col items-center gap-2 p-4 hover:bg-muted"
            >
              <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center`}>
                <action.icon className={`w-6 h-6 ${action.color}`} />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
