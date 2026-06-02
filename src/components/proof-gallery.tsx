
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Play, 
  Upload, 
  Loader2, 
  Image as ImageIcon, 
  Video, 
  X, 
  Pin, 
  Trash2, 
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMemoFirebase } from '@/firebase/firestore/use-memo-firebase';
import Image from 'next/image';
import { uploadToSupabase } from '@/lib/supabase';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export function ProofGallery() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<any>(null);
  
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const proofQuery = useMemoFirebase(() => 
    db ? query(collection(db, "proofMedia"), orderBy("uploadedAt", "desc")) : null, 
    [db]
  );
  
  const { data: rawMediaItems, loading } = useCollection<any>(proofQuery);

  const mediaItems = useMemo(() => {
    if (!rawMediaItems) return [];
    return [...rawMediaItems].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [rawMediaItems]);

  const groupedMedia = useMemo(() => {
    const columns = [];
    for (let i = 0; i < mediaItems.length; i += 2) {
      columns.push(mediaItems.slice(i, i + 2));
    }
    return columns;
  }, [mediaItems]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !file || !user) return;
    
    setUploading(true);
    try {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      const fileURL = await uploadToSupabase(file, 'proof-media');

      const proofData = {
        fileURL,
        type,
        caption,
        isPinned: false,
        uploadedAt: serverTimestamp(),
        uploadedBy: user.uid
      };

      await addDoc(collection(db, "proofMedia"), proofData);
      
      toast({ title: "Proof Published!", description: "Media is now live in the gallery." });
      setIsUploadOpen(false);
      setCaption('');
      setFile(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({ variant: "destructive", title: "Upload Failed", description: err.message || "Database error or storage limit." });
    } finally {
      setUploading(false);
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (!db) return;
    
    const docRef = doc(db, "proofMedia", item.id);
    await updateDoc(docRef, { isPinned: !item.isPinned });
    toast({ 
      title: item.isPinned ? "Unpinned" : "Pinned to Front", 
      description: item.isPinned ? "Item moved back to regular list." : "This proof will now appear first."
    });
  };

  const handleDelete = async () => {
    if (!db || !mediaToDelete) return;
    
    try {
      await deleteDoc(doc(db, "proofMedia", mediaToDelete.id));
      toast({ title: "Proof Deleted", description: "Record removed from cloud registry." });
      setIsDeleteConfirmOpen(false);
      setMediaToDelete(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  return (
    <section className="container mx-auto px-4 mt-20 relative overflow-hidden group">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.12),transparent_70%)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="glass-card p-6 md:p-10 border-primary/20 relative overflow-hidden bg-[#1a1a2e]/60 min-h-[750px] flex flex-col z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 relative z-10">
          <div className="space-y-1">
            <h2 className="font-headline text-3xl md:text-5xl font-black gold-gradient-text neon-text-gold uppercase tracking-tight italic">
              Prizes Distributed Proof
            </h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-black pl-1">Verified Hub Evidence Gallery</p>
          </div>
          
          {user?.isAdmin && (
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="neon-btn-gold bg-black/40 text-primary font-bold uppercase tracking-widest text-[10px] h-11 px-8">
                  <Upload className="w-4 h-4 mr-2" /> Upload Proof
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card bg-[#131314] max-w-md border-primary/20">
                <DialogHeader>
                  <DialogTitle className="text-xl font-headline font-bold text-primary uppercase">Post Verification Media</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">Upload visual evidence of prize distribution to the hub</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Caption / Prize Detail</Label>
                    <Input 
                      placeholder="e.g. 10K Milestone payout to @creator"
                      className="bg-white/5 border-white/10" 
                      value={caption}
                      onChange={e => setCaption(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Media File (IMG/VID)</Label>
                    <Input 
                      type="file" 
                      accept="image/*,video/*"
                      className="bg-white/5 border-white/10 file:bg-white/10 file:text-white file:border-0"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                  
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-primary uppercase">
                        <span>Syncing to Cloud...</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-pulse" style={{ width: `100%` }} />
                      </div>
                    </div>
                  )}

                  <Button type="submit" disabled={uploading} className="w-full bg-primary text-black font-bold h-12 uppercase tracking-widest text-[10px] neon-gold">
                    {uploading ? <Loader2 className="animate-spin" /> : "Authorize & Upload"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col gap-6">
                 <div className="w-[280px] h-[320px] glass-card animate-pulse bg-white/5" />
                 <div className="w-[280px] h-[320px] glass-card animate-pulse bg-white/5" />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative flex-grow flex items-center">
            {mediaItems.length > 0 ? (
              <Carousel 
                opts={{ align: "start", dragFree: true }} 
                className="w-full"
              >
                <CarouselContent className="-ml-6">
                  {groupedMedia.map((column, colIdx) => (
                    <CarouselItem key={colIdx} className="pl-6 basis-auto">
                      <div className="flex flex-col gap-8">
                        {column.map((item: any) => (
                          <div 
                            key={item.id} 
                            className={cn(
                              "group/card relative rounded-xl overflow-hidden cursor-pointer w-[280px] h-[320px] flex flex-col bg-black/60 transition-all",
                              item.isPinned ? "neon-card-gold-pinned" : "neon-card-gold"
                            )}
                            onClick={() => { setSelectedMedia(item); setIsLightboxOpen(true); }}
                          >
                            <div className="relative h-2/3 w-full overflow-hidden">
                              {item.type === 'video' ? (
                                <div className="relative w-full h-full">
                                  <video src={item.fileURL} className="w-full h-full object-cover opacity-60" muted />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 group-hover/card:bg-primary group-hover/card:scale-110 transition-all">
                                      <Play className="w-6 h-6 text-primary group-hover/card:text-black fill-current" />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <Image 
                                  src={item.fileURL} 
                                  alt={item.caption || "Proof"} 
                                  fill 
                                  className="object-cover opacity-70 group-hover/card:opacity-100 transition-all duration-700 group-hover/card:scale-110"
                                />
                              )}
                              
                              <div className="absolute top-3 right-3 flex flex-col gap-2">
                                {item.isPinned && (
                                  <Badge className="bg-primary text-black font-black text-[8px] uppercase tracking-[0.2em] gap-1 py-1 px-3 shadow-[0_0_10px_#FFD700]">
                                    <Star className="w-2.5 h-2.5 fill-black" /> PINNED
                                  </Badge>
                                )}
                                <div className="flex justify-end gap-2">
                                  {item.type === 'video' ? <Video className="w-3.5 h-3.5 text-white/50" /> : <ImageIcon className="w-3.5 h-3.5 text-white/50" />}
                                </div>
                              </div>

                              {user?.isAdmin && (
                                <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                  <Button 
                                    size="icon" 
                                    variant={item.isPinned ? "default" : "secondary"}
                                    className={cn(
                                      "w-8 h-8 rounded-lg",
                                      item.isPinned ? "bg-primary text-black" : "bg-black/60 text-white border-white/10"
                                    )}
                                    onClick={(e) => handleTogglePin(e, item)}
                                  >
                                    <Pin className={cn("w-3.5 h-3.5", item.isPinned && "rotate-45")} />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="destructive"
                                    className="w-8 h-8 rounded-lg bg-red-500/80 hover:bg-red-500"
                                    onClick={(e) => { e.stopPropagation(); setMediaToDelete(item); setIsDeleteConfirmOpen(true); }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className="p-5 flex-grow bg-white/[0.02] border-t border-white/5 flex flex-col justify-center gap-3">
                              <p className="text-xs text-white font-black line-clamp-2 leading-tight uppercase tracking-tight">
                                {item.caption}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-[8px] font-bold uppercase text-primary tracking-[0.3em] flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_#FFD700]" /> Verified Hub Sync
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="absolute -top-16 right-4 flex gap-4">
                  <CarouselPrevious className="relative translate-x-0 translate-y-0 h-12 w-12 border-primary/40 bg-black/60 text-primary hover:bg-primary hover:text-black hover:shadow-[0_0_15px_#FFD700] transition-all" />
                  <CarouselNext className="relative translate-x-0 translate-y-0 h-12 w-12 border-primary/40 bg-black/60 text-primary hover:bg-primary hover:text-black hover:shadow-[0_0_15px_#FFD700] transition-all" />
                </div>
              </Carousel>
            ) : (
              <div className="w-full py-20 text-center opacity-30 italic text-sm flex flex-col items-center gap-4">
                <ImageIcon className="w-12 h-12" />
                No verification media published yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-5xl bg-black/95 border-primary/20 p-0 overflow-hidden outline-none shadow-[0_0_50px_rgba(255,215,0,0.2)]">
          <DialogHeader>
            <DialogTitle>Verification Media: {selectedMedia?.caption}</DialogTitle>
            <DialogDescription>Full scale view of the verification prize media</DialogDescription>
          </DialogHeader>
          <div className="relative flex items-center justify-center min-h-[50vh] max-h-[85vh]">
            <Button 
              onClick={() => setIsLightboxOpen(false)} 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 text-white/50 hover:text-white z-50 bg-black/40 rounded-full h-10 w-10 border border-white/10"
            >
              <X className="w-6 h-6" />
            </Button>
            
            {selectedMedia?.type === 'video' ? (
              <video 
                src={selectedMedia.fileURL} 
                controls 
                autoPlay 
                className="max-w-full max-h-[85vh] w-auto h-auto"
              />
            ) : (
              <div className="relative w-full h-full min-h-[50vh] flex items-center justify-center p-4">
                <img 
                  src={selectedMedia?.fileURL} 
                  alt={selectedMedia?.caption} 
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                />
              </div>
            )}
          </div>
          {selectedMedia?.caption && (
            <div className="p-8 bg-[#131314] border-t border-primary/20 text-center">
              <p className="text-sm font-headline text-primary font-black uppercase tracking-[0.4em] neon-text-gold">{selectedMedia.caption}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="glass-card bg-[#131314] max-w-sm border-destructive/20 shadow-[0_0_30px_rgba(255,0,0,0.1)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-bold text-destructive uppercase tracking-widest">Confirm Removal</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground uppercase tracking-widest pt-2">
              This will permanently purge this proof from the cloud registry.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)} className="uppercase text-[10px] tracking-widest font-bold">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} className="font-bold uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(255,0,0,0.3)]">
              Authorize Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
