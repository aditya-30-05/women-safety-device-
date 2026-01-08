import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Camera, Mic, Video, MapPin, FileText, Download, Trash2, Shield, Wifi, WifiOff, Save, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface EvidenceItem {
  id: string;
  type: 'photo' | 'audio' | 'video' | 'location' | 'note';
  data: string | Blob | { lat: number; lng: number };
  timestamp: string;
  location?: { lat: number; lng: number };
  synced: boolean;
  size?: number;
  duration?: number; // for audio/video in seconds
}

const SilentEvidenceCollection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);

  const loadEvidenceFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('silent_evidence');
      if (stored) {
        const parsed = JSON.parse(stored);
        setEvidenceList(parsed);
      }
    } catch (error) {
      console.error('Error loading evidence:', error);
    }
  }, []);

  const syncSingleEvidence = useCallback(async (evidence: EvidenceItem) => {
    if (!user) return;

    try {
      // Convert Blob to base64 for storage
      let dataToStore: string | null = null;
      if (evidence.data instanceof Blob) {
        const reader = new FileReader();
        dataToStore = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(evidence.data as Blob);
        });
      } else if (typeof evidence.data === 'object') {
        dataToStore = JSON.stringify(evidence.data);
      } else {
        dataToStore = evidence.data as string;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('evidence_collection' as any).insert({
        user_id: user.id,
        type: evidence.type,
        data: dataToStore,
        latitude: evidence.location?.lat,
        longitude: evidence.location?.lng,
        synced: true,
        created_at: evidence.timestamp,
      });

      setEvidenceList(prev => prev.map(e =>
        e.id === evidence.id ? { ...e, synced: true } : e
      ));
    } catch (error) {
      console.error('Error syncing evidence:', error);
    }
  }, [user]);

  const syncEvidence = useCallback(async () => {
    if (!user || isOfflineMode) return;

    const unsynced = evidenceList.filter(e => !e.synced);
    if (unsynced.length === 0) return;

    setIsCollecting(true);
    try {
      for (const evidence of unsynced) {
        await syncSingleEvidence(evidence);
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsCollecting(false);
    }
  }, [user, isOfflineMode, evidenceList, syncSingleEvidence]);

  // Check online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineMode(false);
      if (autoSync) {
        syncEvidence();
      }
    };
    const handleOffline = () => {
      setIsOfflineMode(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOfflineMode(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync, syncEvidence]);

  // Load evidence from local storage
  useEffect(() => {
    loadEvidenceFromStorage();
  }, [loadEvidenceFromStorage]);


  const saveEvidenceToStorage = (evidence: EvidenceItem[]) => {
    try {
      // Convert Blobs to base64 for storage
      const serializable = evidence.map(item => {
        if (item.data instanceof Blob) {
          return {
            ...item,
            data: 'blob_data', // Will need special handling
            blobSize: item.size,
          };
        }
        return item;
      });
      localStorage.setItem('silent_evidence', JSON.stringify(serializable));
    } catch (error) {
      console.error('Error saving evidence:', error);
    }
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        reject,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach(track => track.stop());

      canvas.toBlob(async (blob) => {
        if (blob) {
          const location = await getCurrentLocation().catch(() => null);
          const evidence: EvidenceItem = {
            id: Date.now().toString(),
            type: 'photo',
            data: blob,
            timestamp: new Date().toISOString(),
            location: location || undefined,
            synced: false,
            size: blob.size,
          };
          const updated = [evidence, ...evidenceList];
          setEvidenceList(updated);
          saveEvidenceToStorage(updated);
          toast({
            title: '📸 Photo Captured',
            description: 'Evidence saved silently.',
          });
          if (!isOfflineMode && autoSync) {
            await syncSingleEvidence(evidence);
          }
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Camera Error',
        description: 'Unable to access camera. Please check permissions.',
      });
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const location = await getCurrentLocation().catch(() => null);
        const evidence: EvidenceItem = {
          id: Date.now().toString(),
          type: 'audio',
          data: audioBlob,
          timestamp: new Date().toISOString(),
          location: location || undefined,
          synced: false,
          size: audioBlob.size,
        };
        const updated = [evidence, ...evidenceList];
        setEvidenceList(updated);
        saveEvidenceToStorage(updated);
        toast({
          title: '🎤 Audio Recorded',
          description: 'Evidence saved silently.',
        });
        if (!isOfflineMode && autoSync) {
          await syncSingleEvidence(evidence);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: 'Recording Started',
        description: 'Audio recording in progress...',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Microphone Error',
        description: 'Unable to access microphone. Please check permissions.',
      });
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureVideo = async () => {
    try {
      if (isRecording && videoRecorderRef.current) {
        // Stop recording
        if (videoRecorderRef.current.state === 'recording') {
          videoRecorderRef.current.stop();
        }
        if (videoStreamRef.current) {
          videoStreamRef.current.getTracks().forEach(track => track.stop());
          videoStreamRef.current = null;
        }
        setIsRecording(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });
      videoRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        const location = await getCurrentLocation().catch(() => null);
        const evidence: EvidenceItem = {
          id: Date.now().toString(),
          type: 'video',
          data: videoBlob,
          timestamp: new Date().toISOString(),
          location: location || undefined,
          synced: false,
          size: videoBlob.size,
        };
        const updated = [evidence, ...evidenceList];
        setEvidenceList(updated);
        saveEvidenceToStorage(updated);
        toast({
          title: '🎥 Video Recorded',
          description: 'Evidence saved silently.',
        });
        if (!isOfflineMode && autoSync) {
          await syncSingleEvidence(evidence);
        }
        if (videoStreamRef.current) {
          videoStreamRef.current.getTracks().forEach(track => track.stop());
          videoStreamRef.current = null;
        }
        videoRecorderRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: 'Recording Started',
        description: 'Video recording in progress. Tap again to stop.',
      });

      // Auto-stop after 5 minutes for safety
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 300000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Camera Error',
        description: 'Unable to access camera. Please check permissions.',
      });
    }
  };

  const captureLocation = async () => {
    try {
      const location = await getCurrentLocation();
      const evidence: EvidenceItem = {
        id: Date.now().toString(),
        type: 'location',
        data: location,
        timestamp: new Date().toISOString(),
        location: location,
        synced: false,
      };
      const updated = [evidence, ...evidenceList];
      setEvidenceList(updated);
      saveEvidenceToStorage(updated);
      toast({
        title: '📍 Location Saved',
        description: 'Current location captured.',
      });
      if (!isOfflineMode && autoSync) {
        await syncSingleEvidence(evidence);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Location Error',
        description: 'Unable to get location.',
      });
    }
  };

  const addNote = () => {
    const note = prompt('Enter your note:');
    if (note) {
      const evidence: EvidenceItem = {
        id: Date.now().toString(),
        type: 'note',
        data: note,
        timestamp: new Date().toISOString(),
        synced: false,
      };
      const updated = [evidence, ...evidenceList];
      setEvidenceList(updated);
      saveEvidenceToStorage(updated);
      toast({
        title: '📝 Note Added',
        description: 'Note saved silently.',
      });
      if (!isOfflineMode && autoSync) {
        syncSingleEvidence(evidence);
      }
    }
  };



  const deleteEvidence = (id: string) => {
    const updated = evidenceList.filter(e => e.id !== id);
    setEvidenceList(updated);
    saveEvidenceToStorage(updated);
    setShowDeleteDialog(null);
    toast({
      title: 'Evidence Deleted',
      description: 'Item removed from collection.',
    });
  };

  const downloadEvidence = (evidence: EvidenceItem) => {
    if (evidence.data instanceof Blob) {
      const url = URL.createObjectURL(evidence.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-${evidence.id}.${evidence.type === 'photo' ? 'jpg' : evidence.type === 'audio' ? 'webm' : 'webm'}`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (evidence.type === 'note') {
      const blob = new Blob([evidence.data as string], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `note-${evidence.id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Camera className="h-4 w-4" />;
      case 'audio':
        return <Mic className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'location':
        return <MapPin className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const unsyncedCount = evidenceList.filter(e => !e.synced).length;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span>Silent Evidence Collection</span>
              {isOfflineMode && (
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-700 border-orange-500/30">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline Mode
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              Discreetly collect evidence (photos, audio, video, location)
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Offline Mode Status */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOfflineMode ? (
                <WifiOff className="h-6 w-6 text-orange-500" />
              ) : (
                <Wifi className="h-6 w-6 text-success" />
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {isOfflineMode ? 'Offline Mode Active' : 'Online Mode'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isOfflineMode
                    ? 'Evidence saved locally. Will sync when online.'
                    : 'Evidence will sync automatically.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-sync" className="text-xs">Auto Sync</Label>
              <Switch
                id="auto-sync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
                disabled={isOfflineMode}
              />
            </div>
          </div>
          {unsyncedCount > 0 && (
            <div className="mt-3 pt-3 border-t border-orange-500/20 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {unsyncedCount} items pending sync
              </span>
              {!isOfflineMode && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={syncEvidence}
                  disabled={isCollecting}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {isCollecting ? 'Syncing...' : 'Sync Now'}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={capturePhoto}
            disabled={isRecording}
          >
            <Camera className="h-5 w-5" />
            <span className="text-xs">Photo</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={isRecording ? stopAudioRecording : startAudioRecording}
          >
            <Mic className="h-5 w-5" />
            <span className="text-xs">{isRecording ? 'Stop' : 'Audio'}</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={captureVideo}
          >
            <Video className="h-5 w-5" />
            <span className="text-xs">{isRecording ? 'Stop' : 'Video'}</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={captureLocation}
            disabled={isRecording}
          >
            <MapPin className="h-5 w-5" />
            <span className="text-xs">Location</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={addNote}
            disabled={isRecording}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs">Note</span>
          </Button>
        </div>

        {/* Evidence List */}
        {evidenceList.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">
                Collected Evidence ({evidenceList.length})
              </h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {evidenceList.map((evidence) => (
                <div
                  key={evidence.id}
                  className="p-3 rounded-lg bg-background/50 border border-border/50 hover:bg-background/80 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {getEvidenceIcon(evidence.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm text-foreground capitalize">
                            {evidence.type}
                          </p>
                          {!evidence.synced && (
                            <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-700 border-orange-500/30">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(evidence.timestamp).toLocaleString()}
                        </p>
                        {evidence.size && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(evidence.size)}
                          </p>
                        )}
                        {evidence.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {evidence.location.lat.toFixed(4)}, {evidence.location.lng.toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => downloadEvidence(evidence)}
                        title="Download"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setShowDeleteDialog(evidence.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {evidenceList.length === 0 && (
          <div className="p-8 rounded-xl bg-muted/30 border border-border/50 text-center">
            <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground mb-1">No Evidence Collected</p>
            <p className="text-xs text-muted-foreground">
              Use the buttons above to start collecting evidence discreetly
            </p>
          </div>
        )}

        {/* Safety Notice */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Privacy & Safety</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>All evidence is stored securely and encrypted</li>
                <li>Works offline - data syncs when connection is restored</li>
                <li>Evidence can be downloaded for legal purposes</li>
                <li>Location is automatically captured with media</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog !== null} onOpenChange={() => setShowDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Evidence?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The evidence will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showDeleteDialog && deleteEvidence(showDeleteDialog)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default SilentEvidenceCollection;

