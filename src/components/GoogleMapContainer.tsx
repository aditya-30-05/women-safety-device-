import React from 'react';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface GoogleMapContainerProps {
    children: React.ReactNode;
}

const GoogleMapContainer: React.FC<GoogleMapContainerProps> = ({ children }) => {
    const { isLoaded, loadError } = useGoogleMaps();

    if (loadError) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-destructive/5 text-destructive p-6 text-center">
                <div className="space-y-3">
                    <AlertCircle className="w-10 h-10 mx-auto" />
                    <div>
                        <h3 className="font-semibold">Maps Configuration Error</h3>
                        <p className="text-sm opacity-90">Please check your Google Maps API key.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted/50 backdrop-blur-sm">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-sm font-medium text-foreground">Loading map...</p>
                    <p className="text-xs text-muted-foreground mt-1">Please wait</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default GoogleMapContainer;
