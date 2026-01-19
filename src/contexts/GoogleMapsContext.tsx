import React, { createContext, useContext } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

interface GoogleMapsContextType {
    isLoaded: boolean;
    loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ['places', 'drawing'];

export const GoogleMapsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!googleMapsApiKey) {
        console.error('CRITICAL: VITE_GOOGLE_MAPS_API_KEY is missing in environment variables.');
    }

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script-global',
        googleMapsApiKey: googleMapsApiKey || '',
        libraries: libraries,
    });

    return (
        <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
            {children}
        </GoogleMapsContext.Provider>
    );
};

export const useGoogleMaps = () => {
    const context = useContext(GoogleMapsContext);
    if (!context) {
        throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
    }
    return context;
};
