import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link as LinkIcon, UserPlus, ShieldCheck, Clock, Check, X, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const LinkingModule = () => {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const [links, setLinks] = useState<any[]>([]);
    const [linkCode, setLinkCode] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLinks();
    }, [user]);

    const fetchLinks = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('monitoring_links')
                .select(`
          *,
          parent:parent_id(full_name, avatar_url),
          woman:woman_id(full_name, avatar_url)
        `)
                .or(`parent_id.eq.${user?.id},woman_id.eq.${user?.id}`);

            if (error) throw error;
            setLinks(data || []);
        } catch (error) {
            console.error('Error fetching links:', error);
        }
    };

    const handleCreateLink = async () => {
        if (!linkCode || linkCode.length < 6) {
            toast({
                title: "Invalid Code",
                description: "Please enter a valid 6-digit link code.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            // For this demo, we assume the code is valid if it matches a woman's link_code
            // In a real app, you'd search by code
            const { data, error } = await (supabase as any)
                .from('monitoring_links')
                .select('id')
                .eq('link_code', linkCode)
                .eq('status', 'pending')
                .single();

            if (error || !data) {
                throw new Error('Invalid or expired link code.');
            }

            const { error: updateError } = await (supabase as any)
                .from('monitoring_links')
                .update({ parent_id: user?.id, status: 'active' })
                .eq('id', data.id);

            if (updateError) throw updateError;

            toast({
                title: "Success!",
                description: "Monitoring link established.",
            });
            setLinkCode('');
            fetchLinks();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: 'active' | 'revoked') => {
        try {
            const { error } = await (supabase as any)
                .from('monitoring_links')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            fetchLinks();
            toast({
                title: "Status Updated",
                description: `Link is now ${status}.`,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const generateNewRequest = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('monitoring_links')
                .insert({
                    woman_id: user?.id,
                    status: 'pending'
                })
                .select('link_code')
                .single();

            if (error) throw error;
            fetchLinks();
            toast({
                title: "Code Generated",
                description: `Your link code is: ${data.link_code}`,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="glass-card border-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    {userRole === 'woman' ? 'Safety Monitors' : 'Link with Family'}
                </CardTitle>
                <CardDescription>
                    {userRole === 'woman'
                        ? 'Manage who can monitor your location during emergencies.'
                        : 'Enter a link code provided by your family member.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {userRole === 'parent' ? (
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter 6-digit code"
                            value={linkCode}
                            onChange={(e) => setLinkCode(e.target.value)}
                            className="font-mono tracking-widest text-center"
                            maxLength={6}
                        />
                        <Button onClick={handleCreateLink} disabled={loading}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Link Account
                        </Button>
                    </div>
                ) : (
                    <Button onClick={generateNewRequest} disabled={loading} className="w-full gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Generate New Link Code
                    </Button>
                )}

                <div className="space-y-4 pt-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Links</h4>
                    {links.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic text-center py-4">No active or pending links found.</p>
                    ) : (
                        links.map((link) => (
                            <div key={link.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <ShieldCheck className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {userRole === 'woman' ? (link.parent?.full_name || 'Pending Parent') : (link.woman?.full_name || 'Relative')}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {link.status === 'pending' && <p className="text-xs font-mono bg-primary/20 px-1 rounded">{link.link_code}</p>}
                                            <Badge variant={link.status === 'active' ? 'default' : 'secondary'} className="text-[10px] h-4">
                                                {link.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {link.status === 'pending' && userRole === 'woman' && (
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleUpdateStatus(link.id, 'revoked')}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                    {link.status === 'active' && (
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleUpdateStatus(link.id, 'revoked')}>
                                            <Shield className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default LinkingModule;
