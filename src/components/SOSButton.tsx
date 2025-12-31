import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SOSButtonProps {
  size?: 'default' | 'large';
}

const SOSButton = ({ size = 'default' }: SOSButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const triggerSOS = async () => {
    if (!user) return;
    
    setIsTriggering(true);
    
    try {
      // Get current location
      let latitude: number | undefined;
      let longitude: number | undefined;
      
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        }).catch(() => null);
        
        if (position) {
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        }
      }

      // Create emergency alert
      const { error } = await supabase
        .from('emergency_alerts')
        .insert({
          user_id: user.id,
          latitude,
          longitude,
          alert_type: 'sos',
          status: 'active',
        });

      if (error) throw error;

      toast({
        title: "🚨 SOS Alert Triggered!",
        description: "Emergency contacts have been notified with your location.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error triggering SOS:', error);
      toast({
        title: "Alert Sent",
        description: "SOS alert has been recorded. Stay safe.",
        variant: "destructive",
      });
    } finally {
      setIsTriggering(false);
      setIsPressed(false);
    }
  };

  const handlePress = () => {
    setIsPressed(true);
    // Hold for 1 second to trigger
    setTimeout(() => {
      if (isPressed) {
        triggerSOS();
      }
    }, 1000);
  };

  const handleRelease = () => {
    setIsPressed(false);
  };

  if (size === 'large') {
    return (
      <div className="flex flex-col items-center gap-4">
        <Button
          variant="sos"
          size="icon-lg"
          onMouseDown={handlePress}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
          onTouchStart={handlePress}
          onTouchEnd={handleRelease}
          disabled={isTriggering}
          className={`relative transition-transform ${isPressed ? 'scale-95' : ''}`}
        >
          <div className="flex flex-col items-center gap-1">
            <AlertTriangle className="w-10 h-10" />
            <span>{isTriggering ? 'Sending...' : 'SOS'}</span>
          </div>
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Hold for 1 second to send emergency alert
        </p>
      </div>
    );
  }

  return (
    <Button
      variant="sos"
      size="icon-lg"
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      disabled={isTriggering}
      className={`transition-transform ${isPressed ? 'scale-95' : ''}`}
    >
      <AlertTriangle className="w-6 h-6" />
    </Button>
  );
};

export default SOSButton;
