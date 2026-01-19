import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MapPin, RefreshCw, Info, Shield, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { supabase } from '@/integrations/supabase/client';
import { GoogleMap, Marker, Circle } from '@react-google-maps/api';

interface UnsafeZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  lastReported: string;
  reportCount: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = { lat: 28.6139, lng: 77.2090 };

const severityColors = {
  low: '#fbbf24',
  medium: '#f97316',
  high: '#ef4444',
  critical: '#dc2626',
};

const severityOpacities = {
  low: 0.2,
  medium: 0.3,
  high: 0.4,
  critical: 0.5,
};

const UnsafeZoneMap = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isLoaded, loadError } = useGoogleMaps();
  const [unsafeZones, setUnsafeZones] = useState<UnsafeZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<UnsafeZone | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const fetchZones = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await (supabase as any)
        .from('unsafe_zones')
        .select('*');

      if (error) throw error;

      if (data) {
        const transformedZones: UnsafeZone[] = data.map((z: any) => ({
          id: z.id,
          name: z.name,
          lat: z.lat,
          lng: z.lng,
          radius: z.radius,
          severity: z.severity as any,
          description: z.description || '',
          lastReported: new Date(z.updated_at).toLocaleDateString(),
          reportCount: z.report_count || 1
        }));
        setUnsafeZones(transformedZones);
      }
    } catch (error) {
      console.error('Error fetching unsafe zones:', error);
      toast({
        variant: 'destructive',
        title: 'Server Connection Error',
        description: 'Failed to fetch unsafe zones from database.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchZones();

    // Subscribe to real-time updates
    const channel = (supabase as any)
      .channel('unsafe-zones-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'unsafe_zones' },
        () => {
          fetchZones();
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [fetchZones]);

  const requestLocation = useCallback(() => {
    setPermissionError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionError('Location permission required');
          }
          // fallback to default already handled in initial state if needed
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);

  // Get current location
  useEffect(() => {
    setCurrentLocation(defaultCenter);
    requestLocation();
  }, [requestLocation]);

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive',
      critical: 'destructive',
    } as const;

    const colors = {
      low: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
      medium: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
      high: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
      critical: 'bg-red-600/20 text-red-800 dark:text-red-300 border-red-600/40',
    };

    return (
      <Badge
        variant={variants[severity as keyof typeof variants] || 'default'}
        className={colors[severity as keyof typeof colors] || ''}
      >
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const refreshZones = () => {
    fetchZones();
    toast({
      title: 'Zones Refreshed',
      description: 'Unsafe zone data has been updated.',
    });
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span>🗺️ Unsafe Zone Intelligence Map</span>
            </div>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              View reported unsafe areas and avoid danger zones
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <>
          <div className="relative w-full h-80 md:h-96 rounded-xl overflow-hidden border-2 border-border shadow-sm">
            {loadError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/5 text-destructive p-6 text-center">
                <div className="space-y-3">
                  <AlertCircle className="w-10 h-10 mx-auto" />
                  <div>
                    <h3 className="font-semibold">Maps Configuration Error</h3>
                    <p className="text-sm opacity-90">Please check your Google Maps API key.</p>
                  </div>
                </div>
              </div>
            ) : permissionError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 text-foreground p-6 text-center">
                <div className="space-y-3">
                  <MapPin className="w-10 h-10 mx-auto text-primary" />
                  <div>
                    <h3 className="font-semibold">Location Permission Required</h3>
                    <p className="text-sm text-muted-foreground">Please enable GPS to see your location on the map.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={requestLocation}>
                    Grant Access
                  </Button>
                </div>
              </div>
            ) : isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={currentLocation || defaultCenter}
                zoom={13}
                onLoad={map => setMap(map)}
                options={{
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
                }}
              >
                {/* Draw unsafe zones */}
                {unsafeZones.map((zone) => (
                  <div key={zone.id}>
                    <Circle
                      center={{ lat: zone.lat, lng: zone.lng }}
                      radius={zone.radius}
                      options={{
                        strokeColor: severityColors[zone.severity],
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: severityColors[zone.severity],
                        fillOpacity: severityOpacities[zone.severity],
                      }}
                    />
                    <Marker
                      position={{ lat: zone.lat, lng: zone.lng }}
                      title={zone.name}
                      onClick={() => {
                        setSelectedZone(zone);
                        if (map) {
                          map.panTo({ lat: zone.lat, lng: zone.lng });
                          map.setZoom(15);
                        }
                      }}
                      icon={{
                        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                        scale: 6,
                        fillColor: severityColors[zone.severity],
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                      }}
                    />
                  </div>
                ))}

                {/* Current Location Marker */}
                {currentLocation && (
                  <Marker
                    position={currentLocation}
                    title="Your Location"
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: '#3b82f6',
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 2,
                    }}
                  />
                )}
              </GoogleMap>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted/50 backdrop-blur-sm">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                  <p className="text-sm font-medium text-foreground">Loading map...</p>
                  <p className="text-xs text-muted-foreground mt-1">Analyzing unsafe zones</p>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Zone Severity Levels</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500/40 border-2 border-yellow-500"></div>
                <span className="text-xs text-muted-foreground">Low Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500/40 border-2 border-orange-500"></div>
                <span className="text-xs text-muted-foreground">Medium Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500/40 border-2 border-red-500"></div>
                <span className="text-xs text-muted-foreground">High Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-600/50 border-2 border-red-600"></div>
                <span className="text-xs text-muted-foreground">Critical</span>
              </div>
            </div>
          </div>

          {/* Selected Zone Details */}
          {selectedZone && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/5 border-2 border-destructive/20 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-destructive" />
                    <h4 className="font-semibold text-foreground">{selectedZone.name}</h4>
                  </div>
                  {getSeverityBadge(selectedZone.severity)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSelectedZone(null)}
                >
                  ×
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{selectedZone.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Reports: {selectedZone.reportCount}</span>
                <span>Last: {selectedZone.lastReported}</span>
              </div>
            </div>
          )}

          {/* Zone List */}
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">Reported Zones ({unsafeZones.length})</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshZones}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
            {unsafeZones.map((zone) => (
              <div
                key={zone.id}
                onClick={() => {
                  setSelectedZone(zone);
                  if (map) {
                    map.panTo({ lat: zone.lat, lng: zone.lng });
                    map.setZoom(15);
                  }
                }}
                className="p-3 rounded-lg bg-background/50 border border-border/50 hover:bg-background/80 hover:border-primary/30 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                      <p className="text-sm font-medium text-foreground truncate">{zone.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{zone.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getSeverityBadge(zone.severity)}
                    <span className="text-xs text-muted-foreground">{zone.reportCount} reports</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Safety Tips */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Safety Tips</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Avoid marked unsafe zones, especially after dark</li>
                  <li>Share your location with trusted contacts when traveling</li>
                  <li>Use well-lit and populated routes</li>
                  <li>Report unsafe areas to help keep others safe</li>
                </ul>
              </div>
            </div>
          </div>
        </>

      </CardContent>
    </Card>
  );
};

export default UnsafeZoneMap;


