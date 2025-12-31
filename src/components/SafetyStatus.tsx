import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, CheckCircle, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const SafetyStatus = () => {
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isLocationSharing && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        () => {
          setCurrentLocation('Location unavailable');
        }
      );
    }
  }, [isLocationSharing]);

  const toggleLocationSharing = () => {
    if (!isLocationSharing) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setIsLocationSharing(true);
            toast({
              title: "Location Sharing Enabled",
              description: "Your trusted contacts can now see your location.",
            });
          },
          () => {
            toast({
              variant: "destructive",
              title: "Permission Required",
              description: "Please enable location services to use this feature.",
            });
          }
        );
      }
    } else {
      setIsLocationSharing(false);
      setCurrentLocation(null);
      toast({
        title: "Location Sharing Disabled",
        description: "Your location is no longer being shared.",
      });
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isLocationSharing ? 'bg-success/10 safe-glow' : 'bg-muted'
            }`}>
              {isLocationSharing ? (
                <CheckCircle className="w-7 h-7 text-success" />
              ) : (
                <Shield className="w-7 h-7 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">
                {isLocationSharing ? 'Protected' : 'Location Off'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isLocationSharing 
                  ? 'Sharing location with trusted contacts' 
                  : 'Enable to share your location'}
              </p>
              {currentLocation && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {currentLocation}
                </p>
              )}
            </div>
          </div>
          <Switch
            checked={isLocationSharing}
            onCheckedChange={toggleLocationSharing}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyStatus;
