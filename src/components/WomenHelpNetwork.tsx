import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, MapPin, MessageCircle, Phone, AlertCircle, Heart, Shield, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface HelpRequest {
  id: string;
  userId: string;
  userName: string;
  type: 'emergency' | 'urgent' | 'support' | 'companion';
  title: string;
  description: string;
  location: string;
  lat?: number;
  lng?: number;
  status: 'active' | 'resolved' | 'cancelled';
  createdAt: string;
  helperCount: number;
}

interface NearbyHelper {
  id: string;
  name: string;
  distance: number; // in km
  lat: number;
  lng: number;
  available: boolean;
  rating: number;
  helpCount: number;
  specialties: string[];
}

// Sample data
const sampleHelpers: NearbyHelper[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    distance: 0.5,
    lat: 28.6140,
    lng: 77.2091,
    available: true,
    rating: 4.9,
    helpCount: 23,
    specialties: ['Emergency', 'Companion'],
  },
  {
    id: '2',
    name: 'Anita Patel',
    distance: 1.2,
    lat: 28.6150,
    lng: 77.2100,
    available: true,
    rating: 4.8,
    helpCount: 18,
    specialties: ['Support', 'Transport'],
  },
  {
    id: '3',
    name: 'Meera Singh',
    distance: 2.1,
    lat: 28.6160,
    lng: 77.2110,
    available: false,
    rating: 5.0,
    helpCount: 31,
    specialties: ['Emergency', 'Medical'],
  },
];

const WomenHelpNetwork = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [nearbyHelpers, setNearbyHelpers] = useState<NearbyHelper[]>(sampleHelpers);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState<'emergency' | 'urgent' | 'support' | 'companion'>('support');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestLocation, setRequestLocation] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setCurrentLocation({ lat: 28.6139, lng: 77.2090 });
        }
      );
    }
  }, []);

  const getRequestTypeColor = (type: string) => {
    const colors = {
      emergency: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
      urgent: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
      support: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
      companion: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
    };
    return colors[type as keyof typeof colors] || '';
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <AlertCircle className="h-4 w-4" />;
      case 'urgent':
        return <Clock className="h-4 w-4" />;
      case 'support':
        return <Heart className="h-4 w-4" />;
      case 'companion':
        return <Users className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const handleRequestHelp = async () => {
    if (!requestTitle.trim() || !requestDescription.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    const newRequest: HelpRequest = {
      id: Date.now().toString(),
      userId: user?.id || 'anonymous',
      userName: user?.email?.split('@')[0] || 'User',
      type: requestType,
      title: requestTitle,
      description: requestDescription,
      location: requestLocation || 'Current Location',
      lat: currentLocation?.lat,
      lng: currentLocation?.lng,
      status: 'active',
      createdAt: new Date().toISOString(),
      helperCount: 0,
    };

    // Save to database (optional)
    if (user) {
      try {
        await supabase.from('help_requests').insert({
          user_id: user.id,
          type: requestType,
          title: requestTitle,
          description: requestDescription,
          location: requestLocation,
          latitude: currentLocation?.lat,
          longitude: currentLocation?.lng,
          status: 'active',
        });
      } catch (error) {
        console.error('Error saving help request:', error);
      }
    }

    setHelpRequests([newRequest, ...helpRequests]);
    setIsRequestDialogOpen(false);
    setRequestTitle('');
    setRequestDescription('');
    setRequestLocation('');

    toast({
      title: 'Help Request Posted!',
      description: 'Nearby women in the network will be notified.',
    });
  };

  const handleOfferHelp = async (helperId: string) => {
    toast({
      title: 'Help Offered!',
      description: 'The requester has been notified. Stay safe!',
    });
    // In production, this would send a notification to the requester
  };

  const handleCallHelper = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span>Women-to-Women Instant Help Network</span>
            </div>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              Connect with nearby women for immediate help and support
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 w-full" variant="default" size="lg">
                <AlertCircle className="h-5 w-5 mr-2" />
                Request Help
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Request Help from Network</DialogTitle>
                <DialogDescription>
                  Post a help request that nearby women in the network can respond to.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="request-type">Type of Help Needed</Label>
                  <Select value={requestType} onValueChange={(value: any) => setRequestType(value)}>
                    <SelectTrigger id="request-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">🚨 Emergency - Immediate Assistance</SelectItem>
                      <SelectItem value="urgent">⏰ Urgent - Need Help Soon</SelectItem>
                      <SelectItem value="support">💙 Support - Emotional/Mental Support</SelectItem>
                      <SelectItem value="companion">👥 Companion - Need Someone to Accompany</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="request-title">Title</Label>
                  <Input
                    id="request-title"
                    placeholder="Brief description of what you need"
                    value={requestTitle}
                    onChange={(e) => setRequestTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="request-description">Details</Label>
                  <Textarea
                    id="request-description"
                    placeholder="Describe your situation and what kind of help you need..."
                    value={requestDescription}
                    onChange={(e) => setRequestDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="request-location">Location (Optional)</Label>
                  <Input
                    id="request-location"
                    placeholder="Your location or address"
                    value={requestLocation}
                    onChange={(e) => setRequestLocation(e.target.value)}
                  />
                </div>
                <Button onClick={handleRequestHelp} className="w-full" size="lg">
                  Post Help Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 w-full" variant="outline" size="lg">
                <Heart className="h-5 w-5 mr-2" />
                Offer Help
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Offer Help to Network</DialogTitle>
                <DialogDescription>
                  Let others know you're available to help. You'll be visible to nearby women who need assistance.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  By offering help, you'll appear in the nearby helpers list and can respond to help requests.
                </p>
                <Button onClick={() => setIsOfferDialogOpen(false)} className="w-full" size="lg">
                  I'm Available to Help
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Nearby Helpers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Nearby Helpers ({nearbyHelpers.filter(h => h.available).length} available)
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Women in your area ready to help
              </p>
            </div>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
            {nearbyHelpers.map((helper) => (
              <div
                key={helper.id}
                className={`p-4 rounded-xl border transition-all ${
                  helper.available
                    ? 'bg-background/50 border-border hover:border-primary/30 hover:bg-background/80'
                    : 'bg-muted/30 border-border/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{helper.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {helper.distance.toFixed(1)} km away
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            ⭐ {helper.rating} ({helper.helpCount} helps)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {helper.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {helper.available ? (
                      <>
                        <Badge className="bg-success/20 text-success border-success/30">
                          Available
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOfferHelp(helper.id)}
                          className="text-xs"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Contact
                        </Button>
                      </>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Busy
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Help Requests */}
        {helpRequests.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Active Help Requests ({helpRequests.filter(r => r.status === 'active').length})
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Recent requests from the network
                </p>
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
              {helpRequests
                .filter((r) => r.status === 'active')
                .map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-xl bg-background/50 border border-border hover:border-primary/30 hover:bg-background/80 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getRequestTypeIcon(request.type)}
                          <p className="font-semibold text-foreground">{request.title}</p>
                          <Badge className={getRequestTypeColor(request.type)}>
                            {request.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {request.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {request.helperCount} helpers
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleOfferHelp(request.id)}
                        className="flex-1"
                      >
                        <Heart className="h-3 w-3 mr-1" />
                        Offer Help
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Network Stats */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{nearbyHelpers.length}</p>
              <p className="text-xs text-muted-foreground">Network Members</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {nearbyHelpers.reduce((sum, h) => sum + h.helpCount, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Helps</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {nearbyHelpers.filter(h => h.available).length}
              </p>
              <p className="text-xs text-muted-foreground">Available Now</p>
            </div>
          </div>
        </div>

        {/* Safety Notice */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Safety First</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Always verify helper identity before meeting</li>
                <li>Meet in public places for first-time connections</li>
                <li>Share your location with trusted contacts</li>
                <li>Trust your instincts - if something feels wrong, don't proceed</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WomenHelpNetwork;

