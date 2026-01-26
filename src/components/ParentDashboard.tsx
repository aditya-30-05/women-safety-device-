import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Map as MapIcon, Bell, Users, ExternalLink, Settings, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GoogleMapContainer from '@/components/GoogleMapContainer';
import { GoogleMap, Marker, Circle } from '@react-google-maps/api';
import { useToast } from '@/hooks/use-toast';
import LinkingModule from '@/components/LinkingModule';

interface MonitoredUser {
    id: string;
    woman_id: string;
    woman_name: string;
    status: string;
    last_location?: {
        lat: number;
        lng: number;
        updated_at: string;
    };
}

const ParentDashboard = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [monitoredUsers, setMonitoredUsers] = useState<MonitoredUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<MonitoredUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMonitoredUsers();
    }, [user]);

    const fetchMonitoredUsers = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('monitoring_links')
                .select(`
          id,
          woman_id,
          status,
          profiles:woman_id (full_name)
        `)
                .eq('parent_id', user?.id)
                .eq('status', 'active');

            if (error) throw error;

            const users = data.map((item: any) => ({
                id: item.id,
                woman_id: item.woman_id,
                woman_name: item.profiles?.full_name || 'Relative',
                status: item.status,
            }));

            setMonitoredUsers(users);
            if (users.length > 0) setSelectedUser(users[0]);
        } catch (error) {
            console.error('Error fetching monitored users:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
                        <Shield className="w-8 h-8 text-primary" />
                        Safety Monitor
                    </h1>
                    <p className="text-muted-foreground mt-1">Monitoring accounts under your care</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sidebar: List of Monitored Users */}
                <Card className="lg:col-span-1 glass-card border-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Your Family
                        </CardTitle>
                        <CardDescription>Select a person to track</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {monitoredUsers.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">No accounts linked yet.</p>
                                <Button variant="ghost" className="mt-4 text-xs">How to link?</Button>
                            </div>
                        ) : (
                            monitoredUsers.map((mUser) => (
                                <div
                                    key={mUser.id}
                                    onClick={() => setSelectedUser(mUser)}
                                    className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${selectedUser?.id === mUser.id
                                        ? 'border-primary bg-primary/5 shadow-md'
                                        : 'border-transparent hover:border-border hover:bg-secondary/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                {mUser.woman_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{mUser.woman_name}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{mUser.status}</p>
                                            </div>
                                        </div>
                                        <Badge variant={mUser.status === 'active' ? 'default' : 'secondary'}>
                                            {mUser.status === 'active' ? 'Live' : 'Pending'}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Main Content: Map and Alerts */}
                <Card className="lg:col-span-2 glass-card border-2 min-h-[600px] flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{selectedUser?.woman_name || 'Select a User'}</CardTitle>
                            <CardDescription>Real-time location and safety status</CardDescription>
                        </div>
                        {selectedUser && (
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="gap-1">
                                    <Bell className="w-4 h-4" />
                                    Alerts
                                </Button>
                                <Button size="sm" variant="outline" className="gap-1">
                                    <ExternalLink className="w-4 h-4" />
                                    Details
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="flex-grow p-0 relative overflow-hidden rounded-b-xl border-t">
                        {selectedUser ? (
                            <GoogleMapContainer>
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    zoom={15}
                                    center={{ lat: -34.397, lng: 150.644 }} // Fallback
                                    options={{
                                        disableDefaultUI: false,
                                        zoomControl: true,
                                        styles: [
                                            {
                                                "featureType": "all",
                                                "elementType": "geometry",
                                                "stylers": [{ "color": "#242f3e" }]
                                            },
                                            {
                                                "featureType": "all",
                                                "elementType": "labels.text.stroke",
                                                "stylers": [{ "lightness": -80 }]
                                            },
                                            {
                                                "featureType": "all",
                                                "elementType": "labels.text.fill",
                                                "stylers": [{ "color": "#746855" }]
                                            },
                                            {
                                                "featureType": "water",
                                                "elementType": "geometry",
                                                "stylers": [{ "color": "#17263c" }]
                                            }
                                        ]
                                    }}
                                >
                                    {/* We would fetch the real-time location here */}
                                    <Marker
                                        position={{ lat: -34.397, lng: 150.644 }}
                                        title={selectedUser.woman_name}
                                    />
                                    <Circle
                                        center={{ lat: -34.397, lng: 150.644 }}
                                        radius={500}
                                        options={{
                                            fillColor: '#8B5CF6',
                                            fillOpacity: 0.1,
                                            strokeColor: '#8B5CF6',
                                            strokeWeight: 1,
                                        }}
                                    />
                                </GoogleMap>
                            </GoogleMapContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-secondary/30">
                                <div className="text-center">
                                    <MapIcon className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-muted-foreground">Select a family member to view their location</p>
                                </div>
                            </div>
                        )}

                        {/* Emergency Overlay if Alert is active */}
                        {selectedUser && (
                            <div className="absolute top-4 left-4 right-4 z-10 animate-pulse">
                                <div className="bg-destructive/90 backdrop-blur-md text-destructive-foreground px-4 py-3 rounded-lg flex items-center justify-between shadow-2xl border border-white/20">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-6 h-6" />
                                        <div>
                                            <p className="font-bold">Safety Alert Status</p>
                                            <p className="text-xs">No active alerts for {selectedUser.woman_name}</p>
                                        </div>
                                    </div>
                                    <Button variant="secondary" size="sm">Check In</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Added Linking Module for Parent to manage connections */}
            <div className="mt-8">
                <LinkingModule />
            </div>
        </div>
    );
};

export default ParentDashboard;
