import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, MapPin, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Alert {
  id: string;
  alert_type: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  resolved_at: string | null;
}

const AlertHistory = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Alert History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-muted-foreground">No alerts triggered yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your safety record is clean
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${alert.status === 'active'
                      ? 'bg-destructive/10'
                      : 'bg-success/10'
                    }`}>
                    {alert.status === 'active' ? (
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-success" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium capitalize">
                      {alert.alert_type.toUpperCase()} Alert
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(alert.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
                {alert.latitude && alert.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent/80 transition-colors"
                  >
                    <MapPin className="w-5 h-5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertHistory;
