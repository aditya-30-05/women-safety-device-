import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, RefreshCw, History, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Location {
  lat: number;
  lng: number;
  timestamp: Date;
}

// Interface for the missing table 'location_history'
interface LocationHistoryItem {
  id?: string;
  user_id: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

const LocationTrackingMap = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationHistory, setLocationHistory] = useState<Location[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => {
      setMapError('Failed to load Google Maps. Please check your API key.');
      toast({
        variant: 'destructive',
        title: 'Map Error',
        description: 'Failed to load Google Maps. Please check your API key configuration.',
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [toast]);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || mapError) return;

    const mapElement = document.getElementById('location-map');
    if (!mapElement) return;

    const map = new google.maps.Map(mapElement, {
      zoom: 15,
      center: currentLocation || { lat: 28.6139, lng: 77.2090 }, // Default to Delhi, India
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    mapRef.current = map;

    if (currentLocation) {
      const marker = new google.maps.Marker({
        position: currentLocation,
        map: map,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        animation: google.maps.Animation.DROP,
      });

      markerRef.current = marker;
    }
  }, [mapLoaded, mapError, currentLocation]);

  // Update marker position when location changes
  useEffect(() => {
    if (markerRef.current && currentLocation) {
      markerRef.current.setPosition(currentLocation);
      if (mapRef.current) {
        mapRef.current.setCenter(currentLocation);
      }
    }
  }, [currentLocation]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Not Supported',
        description: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date(),
        };
        setCurrentLocation(location);

        // Save to database (optional - table may not exist yet)
        if (user) {
          (supabase as any)
            .from('location_history')
            .insert({
              user_id: user.id,
              latitude: location.lat,
              longitude: location.lng,
              created_at: location.timestamp.toISOString(),
            } as LocationHistoryItem)
            .then(({ error }) => {
              if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
                console.error('Error saving location:', error);
              }
            });
        }

        toast({
          title: 'Location Updated',
          description: 'Your current location has been updated.',
        });
      },
      (error) => {
        toast({
          variant: 'destructive',
          title: 'Location Error',
          description: 'Unable to get your location. Please enable location services.',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [user, toast]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Not Supported',
        description: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    setIsTracking(true);
    getCurrentLocation();

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date(),
        };
        setCurrentLocation(location);
        setLocationHistory((prev) => [...prev.slice(-49), location]); // Keep last 50 locations

        // Save to database (optional - table may not exist yet)
        if (user) {
          (supabase as any)
            .from('location_history')
            .insert({
              user_id: user.id,
              latitude: location.lat,
              longitude: location.lng,
              created_at: location.timestamp.toISOString(),
            } as LocationHistoryItem)
            .then(({ error }) => {
              if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
                console.error('Error saving location:', error);
              }
            });
        }
      },
      (error) => {
        toast({
          variant: 'destructive',
          title: 'Tracking Error',
          description: 'Unable to track your location.',
        });
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    watchIdRef.current = watchId;
    toast({
      title: 'Tracking Started',
      description: 'Your location is now being tracked in real-time.',
    });
  }, [user, toast, getCurrentLocation]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    toast({
      title: 'Tracking Stopped',
      description: 'Location tracking has been stopped.',
    });
  }, [toast]);

  const loadLocationHistory = useCallback(async () => {
    if (!user) return;

    const { data, error } = await (supabase as any)
      .from('location_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      // Table might not exist yet, that's okay
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return;
      }
      console.error('Error loading location history:', error);
      return;
    }

    if (data) {
      const locations: Location[] = (data as LocationHistoryItem[]).map((item) => ({
        lat: item.latitude,
        lng: item.longitude,
        timestamp: new Date(item.created_at),
      }));
      setLocationHistory(locations);
    }
  }, [user]);

  useEffect(() => {
    loadLocationHistory();
  }, [loadLocationHistory]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div>Location Tracking</div>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              Track your location in real-time
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mapError ? (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
            <p className="text-sm text-destructive">{mapError}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Please add VITE_GOOGLE_MAPS_API_KEY to your .env file
            </p>
          </div>
        ) : (
          <>
            <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden border-2 border-border shadow-sm">
              <div id="location-map" className="w-full h-full" />
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted/50 backdrop-blur-sm">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-sm font-medium text-foreground">Loading map...</p>
                    <p className="text-xs text-muted-foreground mt-1">Please wait</p>
                  </div>
                </div>
              )}
            </div>

            {currentLocation && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground">Current Location</span>
                      <span className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded">
                        {currentLocation.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-foreground break-all">
                        {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              {!isTracking ? (
                <Button
                  onClick={startTracking}
                  className="flex-1 h-11"
                  variant="default"
                  size="lg"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Start Tracking
                </Button>
              ) : (
                <Button
                  onClick={stopTracking}
                  className="flex-1 h-11"
                  variant="destructive"
                  size="lg"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Tracking
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={getCurrentLocation}
                  variant="outline"
                  disabled={!mapLoaded}
                  className="h-11 px-4"
                  title="Refresh location"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button
                  onClick={loadLocationHistory}
                  variant="outline"
                  disabled={!mapLoaded}
                  className="h-11 px-4"
                  title="View location history"
                >
                  <History className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">History</span>
                </Button>
              </div>
            </div>

            {locationHistory.length > 0 && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">
                      Recent Locations
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                    {locationHistory.length} points
                  </span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                  {locationHistory.slice(0, 5).map((loc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                      <span className="font-mono text-xs text-foreground">
                        {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {loc.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationTrackingMap;

