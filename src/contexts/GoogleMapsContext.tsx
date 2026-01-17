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
    const isPlaceholderKey = !googleMapsApiKey || googleMapsApiKey === 'your_google_maps_api_key_here';

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script-global',
        googleMapsApiKey: isPlaceholderKey ? '' : googleMapsApiKey,
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
