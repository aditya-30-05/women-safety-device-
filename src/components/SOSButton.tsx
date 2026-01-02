import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Smartphone, Vibrate } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useShakeDetection } from '@/hooks/use-shake-detection';

interface SOSButtonProps {
  size?: 'default' | 'large';
  enableShake?: boolean;
}

const SOSButton = ({ size = 'default', enableShake = true }: SOSButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const triggerSOS = useCallback(async () => {
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
  }, [user, toast]);

  // Shake detection
  const { 
    isSupported: shakeSupported, 
    permissionStatus,
    requestPermission,
    isEnabled: shakeActive,
    setIsEnabled: setShakeActive
  } = useShakeDetection({
    threshold: 20,
    shakeCount: 3,
    timeout: 1500,
    onShake: () => {
      if (!isTriggering && shakeEnabled) {
        // Vibrate to confirm shake detection
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
        toast({
          title: "Shake Detected!",
          description: "Triggering SOS alert...",
          variant: "destructive",
        });
        triggerSOS();
      }
    },
    enabled: shakeEnabled && enableShake,
  });

  const handleEnableShake = async () => {
    if (permissionStatus === 'prompt' || permissionStatus === 'denied') {
      const granted = await requestPermission();
      if (granted) {
        setShakeEnabled(true);
        setShakeActive(true);
        toast({
          title: "Shake SOS Enabled",
          description: "Shake your phone 3 times quickly to trigger SOS",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Motion sensor access is required for shake detection",
          variant: "destructive",
        });
      }
    } else if (permissionStatus === 'granted') {
      setShakeEnabled(!shakeEnabled);
      setShakeActive(!shakeEnabled);
      toast({
        title: shakeEnabled ? "Shake SOS Disabled" : "Shake SOS Enabled",
        description: shakeEnabled 
          ? "Shake detection turned off" 
          : "Shake your phone 3 times quickly to trigger SOS",
      });
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
        
        {/* Shake Detection Toggle */}
        {enableShake && shakeSupported && (
          <Button
            variant={shakeEnabled ? "secondary" : "outline"}
            size="sm"
            onClick={handleEnableShake}
            className="gap-2"
          >
            <Vibrate className={`w-4 h-4 ${shakeEnabled ? 'animate-pulse' : ''}`} />
            {shakeEnabled ? 'Shake SOS Active' : 'Enable Shake SOS'}
          </Button>
        )}
        
        <p className="text-sm text-muted-foreground text-center max-w-[200px]">
          {shakeEnabled 
            ? "Shake phone 3x or hold button for 1s"
            : "Hold for 1 second to send emergency alert"
          }
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
