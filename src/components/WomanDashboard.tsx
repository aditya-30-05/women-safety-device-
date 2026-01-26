import React from 'react';
import SOSButton from '@/components/SOSButton';
import TrustedContacts from '@/components/TrustedContacts';
import QuickActions from '@/components/QuickActions';
import SafetyStatus from '@/components/SafetyStatus';
import AlertHistory from '@/components/AlertHistory';
import { JourneyTracking } from '@/components/JourneyTracking';
import ThreatPrediction from '@/components/ThreatPrediction';
import LocationTrackingMap from '@/components/LocationTrackingMap';
import UnsafeZoneMap from '@/components/UnsafeZoneMap';
import WomenHelpNetwork from '@/components/WomenHelpNetwork';
import SilentEvidenceCollection from '@/components/SilentEvidenceCollection';
import StealthMode from '@/components/StealthMode';
import LinkingModule from '@/components/LinkingModule';

const WomanDashboard = () => {
    return (
        <div className="space-y-6">
            {/* Safety Status - Priority Section */}
            <div className="animate-slide-up">
                <SafetyStatus />
            </div>

            {/* Quick Actions - Easy Access */}
            <div className="animate-slide-up-delay-1">
                <QuickActions />
            </div>

            {/* Map and Journey Tracking - Side by Side on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up-delay-1">
                {/* Location Tracking Map */}
                <div>
                    <LocationTrackingMap />
                </div>

                {/* Journey Tracking */}
                <div>
                    <JourneyTracking />
                </div>
            </div>

            {/* Unsafe Zone Intelligence Map */}
            <div className="animate-slide-up-delay-2">
                <UnsafeZoneMap />
            </div>

            {/* Women-to-Women Help Network */}
            <div className="animate-slide-up-delay-2">
                <WomenHelpNetwork />
            </div>

            {/* Silent Evidence Collection */}
            <div className="animate-slide-up-delay-3">
                <SilentEvidenceCollection />
            </div>

            {/* Stealth Mode & E2E Encryption */}
            <div className="animate-slide-up-delay-3">
                <StealthMode />
            </div>

            {/* AI Threat Prediction */}
            <div className="animate-slide-up-delay-2">
                <ThreatPrediction />
            </div>

            {/* Trusted Contacts and Alert History - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up-delay-2">
                {/* Trusted Contacts */}
                <div>
                    <TrustedContacts />
                </div>

                {/* Alert History */}
                <div>
                    <AlertHistory />
                </div>
            </div>

            {/* Linking Module */}
            <div className="animate-slide-up-delay-3">
                <LinkingModule />
            </div>

            {/* Floating SOS Button handled at the layout level or page level */}
        </div>
    );
};

export default WomanDashboard;
