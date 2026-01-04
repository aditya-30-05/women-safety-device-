import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Shield, AlertTriangle, RefreshCw, Sparkles, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ThreatPrediction {
  threatLevel: 'low' | 'moderate' | 'high';
  riskFactors: string[];
  recommendations: string[];
  safetyTip: string;
}

interface ThreatPredictionProps {
  isLocationSharing?: boolean;
  activeJourney?: { destination: string } | null;
}

const ThreatPrediction = ({ isLocationSharing = false, activeJourney = null }: ThreatPredictionProps) => {
  const [prediction, setPrediction] = useState<ThreatPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => console.log('Location not available')
      );
    }
  }, []);

  const fetchRecentAlerts = async () => {
    if (!user) return 0;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count } = await supabase
      .from('emergency_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    return count || 0;
  };

  const analyzeThreat = async () => {
    setIsLoading(true);
    try {
      const recentAlerts = await fetchRecentAlerts();

      const { data, error } = await supabase.functions.invoke('threat-prediction', {
        body: {
          location,
          timeOfDay: new Date().getHours(),
          recentAlerts,
          isLocationSharing,
          activeJourney,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setPrediction(data);
      toast({
        title: "Analysis Complete",
        description: "AI threat assessment has been updated.",
      });
    } catch (error) {
      console.error('Threat prediction error:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unable to analyze threats. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-destructive bg-destructive/10';
      case 'moderate':
        return 'text-warning bg-warning/10';
      default:
        return 'text-success bg-success/10';
    }
  };

  const getThreatIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <AlertTriangle className="w-6 h-6" />;
      case 'moderate':
        return <Shield className="w-6 h-6" />;
      default:
        return <CheckCircle className="w-6 h-6" />;
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          AI Threat Prediction
          <Sparkles className="w-4 h-4 text-primary ml-auto" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!prediction ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground mb-4">
              Use AI to analyze your current safety context and get personalized recommendations.
            </p>
            <Button 
              onClick={analyzeThreat} 
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Threats
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Threat Level */}
            <div className={`p-4 rounded-xl ${getThreatColor(prediction.threatLevel)}`}>
              <div className="flex items-center gap-3">
                {getThreatIcon(prediction.threatLevel)}
                <div>
                  <p className="font-semibold capitalize">
                    {prediction.threatLevel} Risk Level
                  </p>
                  <p className="text-sm opacity-80">
                    Based on current context analysis
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            {prediction.riskFactors.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Risk Factors:</p>
                <div className="flex flex-wrap gap-2">
                  {prediction.riskFactors.map((factor, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-muted text-sm"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div>
              <p className="text-sm font-medium mb-2">Recommendations:</p>
              <ul className="space-y-2">
                {prediction.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Safety Tip */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-sm">
                <span className="font-medium text-primary">💡 Tip:</span>{' '}
                {prediction.safetyTip}
              </p>
            </div>

            {/* Refresh Button */}
            <Button 
              variant="outline" 
              onClick={analyzeThreat} 
              disabled={isLoading}
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Refresh Analysis
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ThreatPrediction;
