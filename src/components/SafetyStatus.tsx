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
    <Card className="glass-card overflow-hidden border-2 border-border/50 shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isLocationSharing 
                ? 'bg-gradient-to-br from-success/20 to-success/10 border-2 border-success/30 shadow-lg shadow-success/20' 
                : 'bg-muted border-2 border-border'
            }`}>
              {isLocationSharing ? (
                <CheckCircle className="w-8 h-8 text-success" />
              ) : (
                <Shield className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-xl mb-1">
                {isLocationSharing ? (
                  <span className="text-success">🛡️ Protected & Safe</span>
                ) : (
                  <span>Location Sharing Off</span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {isLocationSharing 
                  ? 'Your trusted contacts can see your location in real-time' 
                  : 'Turn on location sharing to keep your contacts informed'}
              </p>
              {currentLocation && (
                <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-background/50 border border-border/50">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs font-mono text-foreground break-all">
                    {currentLocation}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Switch
              checked={isLocationSharing}
              onCheckedChange={toggleLocationSharing}
              className="scale-125"
            />
            <span className="text-xs text-muted-foreground text-right">
              {isLocationSharing ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyStatus;
