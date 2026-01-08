
import { supabase } from '@/integrations/supabase/client';

/**
 * Seeds sample data for the demo user.
 * This includes trusted contacts and alert history.
 */
export const seedDemoData = async (userId: string) => {
    console.log('Seeding demo data for user:', userId);

    try {
        // 1. Seed Trusted Contacts
        const { data: existingContacts } = await supabase
            .from('trusted_contacts')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

        if (!existingContacts || existingContacts.length === 0) {
            const sampleContacts = [
                {
                    user_id: userId,
                    name: 'Sarah Johnson',
                    phone: '+1 (555) 123-4567',
                    email: 'sarah.j@example.com',
                    relationship: 'Sister',
                    is_primary: true,
                },
                {
                    user_id: userId,
                    name: 'Michael Chen',
                    phone: '+1 (555) 987-6543',
                    email: 'm.chen@example.com',
                    relationship: 'Friend',
                    is_primary: false,
                },
                {
                    user_id: userId,
                    name: 'Emergency Services',
                    phone: '911',
                    relationship: 'Local Authorities',
                    is_primary: false,
                }
            ];

            const { error: contactError } = await supabase
                .from('trusted_contacts')
                .insert(sampleContacts);

            if (contactError) console.error('Error seeding contacts:', contactError);
        }

        // 2. Seed Emergency Alerts
        const { data: existingAlerts } = await supabase
            .from('emergency_alerts')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

        if (!existingAlerts || existingAlerts.length === 0) {
            const sampleAlerts = [
                {
                    user_id: userId,
                    alert_type: 'sos',
                    status: 'resolved',
                    latitude: 28.6139,
                    longitude: 77.2090,
                    address: 'Connaught Place, New Delhi',
                    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
                    resolved_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
                },
                {
                    user_id: userId,
                    alert_type: 'suspicious',
                    status: 'resolved',
                    latitude: 28.6239,
                    longitude: 77.2190,
                    address: 'Central Park, New Delhi',
                    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                    resolved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
                }
            ];

            const { error: alertError } = await supabase
                .from('emergency_alerts')
                .insert(sampleAlerts);

            if (alertError) console.error('Error seeding alerts:', alertError);
        }

        console.log('Demo data seeded successfully');
    } catch (error) {
        console.error('Failed to seed demo data:', error);
    }
};
