import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, User, Phone, Mail, Star } from 'lucide-react';
import { z } from 'zod';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  relationship: string | null;
  is_primary: boolean;
}

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  phone: z.string().min(10, 'Valid phone number required').max(20),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  relationship: z.string().max(50).optional(),
});

const TrustedContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('trusted_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addContact = async () => {
    if (!user) return;

    try {
      contactSchema.parse(newContact);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('trusted_contacts')
        .insert({
          user_id: user.id,
          name: newContact.name,
          phone: newContact.phone,
          email: newContact.email || null,
          relationship: newContact.relationship || null,
          is_primary: contacts.length === 0,
        });

      if (error) throw error;

      toast({
        title: "Contact Added",
        description: `${newContact.name} has been added to your trusted contacts.`,
      });

      setNewContact({ name: '', phone: '', email: '', relationship: '' });
      setIsDialogOpen(false);
      fetchContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add contact. Please try again.",
      });
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trusted_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Contact Removed",
        description: "Contact has been removed from your trusted list.",
      });

      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove contact.",
      });
    }
  };

  const setPrimaryContact = async (id: string) => {
    if (!user) return;

    try {
      // First, set all contacts to non-primary
      await supabase
        .from('trusted_contacts')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      // Then set the selected one as primary
      await supabase
        .from('trusted_contacts')
        .update({ is_primary: true })
        .eq('id', id);

      toast({
        title: "Primary Contact Updated",
        description: "This contact will be notified first in emergencies.",
      });

      fetchContacts();
    } catch (error) {
      console.error('Error setting primary contact:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Trusted Contacts
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Trusted Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="Contact name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  placeholder="Phone number"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Input
                  placeholder="e.g., Parent, Friend, Spouse"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                />
              </div>
              <Button onClick={addContact} className="w-full">
                Add Contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No trusted contacts yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add contacts who will be notified in emergencies
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contact.name}</span>
                      {contact.is_primary && (
                        <Star className="w-4 h-4 text-warning fill-warning" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </span>
                      {contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!contact.is_primary && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPrimaryContact(contact.id)}
                      title="Set as primary"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteContact(contact.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrustedContacts;
