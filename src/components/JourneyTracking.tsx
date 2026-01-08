import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Clock, Play, Square, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Journey {
  id: string;
  destination: string;
  start_time: string;
  expected_arrival: string;
  check_in_interval: number;
  last_check_in: string | null;
  next_check_in: string | null;
  status: string;
}

export const JourneyTracking = () => {
  const { user } = useAuth();
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('30');
  const [checkInInterval, setCheckInInterval] = useState('15');
  const [loading, setLoading] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [timeUntilCheckIn, setTimeUntilCheckIn] = useState<number | null>(null);
  const [missedCheckIns, setMissedCheckIns] = useState(0);

  const fetchActiveJourney = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('journeys')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching journey:', error);
      return;
    }

    setActiveJourney(data);
  }, [user]);

  useEffect(() => {
    fetchActiveJourney();
  }, [fetchActiveJourney]);

  const triggerMissedCheckInAlert = useCallback(async () => {
    if (!user) return;

    // Update journey status to alert
    await supabase
      .from('journeys')
      .update({ status: 'alert' })
      .eq('id', activeJourney?.id);

    // Create emergency alert
    await supabase.from('emergency_alerts').insert({
      user_id: user.id,
      alert_type: 'missed_checkin',
      status: 'active',
    });

    toast({
      title: "Alert Triggered!",
      description: "Your trusted contacts have been notified due to missed check-in.",
      variant: "destructive",
    });

    fetchActiveJourney();
  }, [user, activeJourney?.id, fetchActiveJourney]);

  // Check-in timer logic
  useEffect(() => {
    if (!activeJourney || activeJourney.status !== 'active') return;

    const checkTimer = () => {
      const now = new Date();
      const nextCheckIn = activeJourney.next_check_in
        ? new Date(activeJourney.next_check_in)
        : new Date(new Date(activeJourney.start_time).getTime() + activeJourney.check_in_interval * 60000);

      const diff = nextCheckIn.getTime() - now.getTime();
      setTimeUntilCheckIn(Math.max(0, Math.floor(diff / 1000)));

      // Show check-in dialog when time is up
      if (diff <= 0 && diff > -30000) {
        setShowCheckInDialog(true);
      }

      // If missed check-in for more than 2 minutes, trigger alert
      if (diff < -120000 && missedCheckIns < 2) {
        setMissedCheckIns(prev => prev + 1);
        triggerMissedCheckInAlert();
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);

    return () => clearInterval(interval);
  }, [activeJourney, missedCheckIns, triggerMissedCheckInAlert]);

  const startJourney = async () => {
    if (!user || !destination.trim()) {
      toast({
        title: "Error",
        description: "Please enter a destination",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const now = new Date();
    const expectedArrival = new Date(now.getTime() + parseInt(duration) * 60000);
    const nextCheckIn = new Date(now.getTime() + parseInt(checkInInterval) * 60000);

    const { error } = await supabase.from('journeys').insert({
      user_id: user.id,
      destination: destination.trim(),
      expected_arrival: expectedArrival.toISOString(),
      check_in_interval: parseInt(checkInInterval),
      next_check_in: nextCheckIn.toISOString(),
      status: 'active',
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start journey",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Journey Started",
        description: `Check-in every ${checkInInterval} minutes`,
      });
      setDestination('');
      setMissedCheckIns(0);
      fetchActiveJourney();
    }

    setLoading(false);
  };

  const handleCheckIn = async () => {
    if (!activeJourney) return;

    const now = new Date();
    const nextCheckIn = new Date(now.getTime() + activeJourney.check_in_interval * 60000);

    await supabase
      .from('journeys')
      .update({
        last_check_in: now.toISOString(),
        next_check_in: nextCheckIn.toISOString(),
      })
      .eq('id', activeJourney.id);

    setShowCheckInDialog(false);
    setMissedCheckIns(0);

    toast({
      title: "Checked In!",
      description: "Your safety status has been updated.",
    });

    fetchActiveJourney();
  };

  const endJourney = async (status: 'completed' | 'alert' = 'completed') => {
    if (!activeJourney) return;

    await supabase
      .from('journeys')
      .update({ status })
      .eq('id', activeJourney.id);

    if (status === 'completed') {
      toast({
        title: "Journey Completed",
        description: "You've arrived safely!",
      });
    }

    setActiveJourney(null);
    setMissedCheckIns(0);
    setShowCheckInDialog(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div>Journey Tracking</div>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Track your trips and check-ins
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeJourney ? (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Destination</span>
                    <span className="font-semibold text-foreground text-right">{activeJourney.destination}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Check-in Interval</span>
                    <span className="font-semibold text-foreground">{activeJourney.check_in_interval} min</span>
                  </div>
                  {timeUntilCheckIn !== null && (
                    <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                      <span className="text-sm font-medium text-muted-foreground">Next Check-in</span>
                      <span className={`font-bold text-lg ${timeUntilCheckIn < 60 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                        {formatTime(timeUntilCheckIn)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleCheckIn}
                  className="flex-1 h-11"
                  variant="default"
                  size="lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  I'm Safe
                </Button>
                <Button
                  onClick={() => endJourney('completed')}
                  variant="outline"
                  className="flex-1 h-11"
                  size="lg"
                >
                  <Square className="h-4 w-4 mr-2" />
                  End Trip
                </Button>
              </div>

              {activeJourney.status === 'alert' && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="text-sm text-destructive font-medium">
                    Alert sent to contacts!
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="destination">Where are you going?</Label>
                <Input
                  id="destination"
                  placeholder="Enter destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Trip Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Check-in Every</Label>
                  <Select value={checkInInterval} onValueChange={setCheckInInterval}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 min</SelectItem>
                      <SelectItem value="10">10 min</SelectItem>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={startJourney}
                disabled={loading || !destination.trim()}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Journey
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Time to Check In!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you safe? Tap "I'm Safe" to let your contacts know you're okay.
              If you don't respond, an alert will be sent to your trusted contacts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => endJourney('completed')}>
              End Journey
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCheckIn}>
              I'm Safe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
