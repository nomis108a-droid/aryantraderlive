
"use client"

import { useState, useMemo } from "react"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy, addDoc, serverTimestamp, updateDoc, doc, increment } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Download, Search, Filter, Upload, Loader2, FileVideo, Calendar, HardDrive, Eye, ShieldCheck, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMemoFirebase } from "@/firebase/firestore/use-memo-firebase"
import Image from "next/image"
import { uploadToSupabase } from "@/lib/supabase"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

const CATEGORIES = ["Technical Analysis", "Trading Psychology", "Market Updates", "Strategy"]

export default function ContentVaultPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [activeVideo, setActiveVideo] = useState<any>(null)
  
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Technical Analysis"
  })
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbFile, setThumbFile] = useState<File | null>(null)

  const contentQuery = useMemoFirebase(() => 
    db ? query(collection(db, "content"), orderBy("uploadDate", "desc")) : null, 
    [db]
  )
  
  const { data: content, loading } = useCollection<any>(contentQuery)

  const filteredContent = useMemo(() => {
    if (!content) return []
    return content.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                           item.description.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = category === "All" || item.category === category
      return matchesSearch && matchesCategory
    })
  }, [content, search, category])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !videoFile || !thumbFile) return
    
    setUploading(true)
    try {
      // 1. Upload Thumbnail to Supabase
      const thumbnailUrl = await uploadToSupabase(thumbFile, 'content/thumbnails');

      // 2. Upload Video to Supabase
      const videoUrl = await uploadToSupabase(videoFile, 'content/videos');

      // 3. Save to Firestore
      const contentData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        thumbnailUrl,
        videoUrl,
        fileSize: formatFileSize(videoFile.size),
        downloadCount: 0,
        uploadDate: serverTimestamp()
      }

      await addDoc(collection(db, "content"), contentData)
      
      toast({ title: "Content Published!", description: "Video is now live in the vault." })
      setIsUploadOpen(false)
      setFormData({ title: "", description: "", category: "Technical Analysis" })
      setVideoFile(null)
      setThumbFile(null)
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({ variant: "destructive", title: "Upload Failed", description: err.message || "Connection lost or upload limit reached." })
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (item: any) => {
    if (!db) return
    
    // Increment download count in background
    const docRef = doc(db, "content", item.id)
    updateDoc(docRef, { downloadCount: increment(1) })

    // Trigger direct file download
    try {
      const response = await fetch(item.videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${item.title.replace(/\s+/g, '_')}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Starting Download", description: `${item.title} is being saved to your device.` });
    } catch (error) {
      // Fallback to simple anchor click if fetch fails (e.g. CORS)
      const link = document.createElement('a');
      link.href = item.videoUrl;
      link.target = "_blank";
      link.download = `${item.title}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-20 max-w-7xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 text-center md:text-left">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" /> Exclusive Hub Assets
          </div>
          <h1 className="font-headline text-4xl md:text-7xl font-bold tracking-tighter">
            CONTENT <span className="gold-gradient-text">VAULT</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm md:text-base">
            Premium trading resources, strategy breakdowns, and market psychology videos curated by Aryan Trader. Supports 4K content downloads up to 2GB.
          </p>
        </div>
        
        {user?.isAdmin && (
          <Button onClick={() => setIsUploadOpen(true)} className="bg-primary text-black font-bold h-12 px-8 uppercase tracking-widest text-xs neon-gold">
            <Upload className="w-4 h-4 mr-2" /> Upload Resource
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-12">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search resources..." 
            className="pl-12 bg-white/5 border-white/10 h-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {["All", ...CATEGORIES].map(cat => (
            <Button 
              key={cat} 
              variant={category === cat ? "default" : "outline"}
              onClick={() => setCategory(cat)}
              className={`h-12 px-6 rounded-xl border-white/10 text-xs font-bold uppercase tracking-widest transition-all ${category === cat ? 'bg-primary text-black' : 'bg-white/5'}`}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="glass-card aspect-video animate-pulse bg-white/5 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredContent.map((item) => (
            <div key={item.id} className="glass-card group overflow-hidden border-white/5 hover:border-primary/30 transition-all flex flex-col">
              <div className="relative aspect-video overflow-hidden">
                <Image 
                  src={item.thumbnailUrl} 
                  alt={item.title} 
                  fill 
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button onClick={() => { setActiveVideo(item); setIsPlayerOpen(true); }} size="icon" className="w-16 h-16 rounded-full bg-primary text-black scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-8 h-8 fill-black" />
                  </Button>
                </div>
                <Badge className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-primary border-primary/20 text-[8px] font-bold uppercase">
                  {item.category}
                </Badge>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-headline font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-6 italic leading-relaxed">
                  "{item.description}"
                </p>
                <div className="mt-auto space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground/60 tracking-tighter">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {item.uploadDate?.seconds ? new Date(item.uploadDate.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                    <span className="flex items-center gap-1.5"><HardDrive className="w-3 h-3" /> {item.fileSize}</span>
                    <span className="flex items-center gap-1.5 text-secondary"><Eye className="w-3 h-3" /> {item.downloadCount || 0} Downloads</span>
                  </div>
                  <Button onClick={() => handleDownload(item)} className="w-full bg-white/5 border border-white/10 hover:bg-primary hover:text-black hover:border-primary transition-all font-bold uppercase tracking-widest text-[10px] h-12">
                    <Download className="w-4 h-4 mr-2" /> Download 4K Content
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="glass-card bg-[#131314] max-w-lg border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
              <Upload className="w-6 h-6" /> Vault Uploader
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Publish new high-fidelity trading resources to the hub. Supports files up to 2GB.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Video Title</Label>
              <Input 
                className="bg-white/5 border-white/10" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Description</Label>
              <Textarea 
                className="bg-white/5 border-white/10 min-h-[100px]" 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card bg-[#131314]">
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Thumbnail (JPG/PNG)</Label>
                <Input 
                  type="file" 
                  accept="image/*"
                  className="bg-white/5 border-white/10 file:bg-white/10 file:text-white file:border-0"
                  onChange={e => setThumbFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">4K Video File (Max 2GB)</Label>
              <Input 
                type="file" 
                accept="video/*"
                className="bg-white/5 border-white/10 file:bg-white/10 file:text-white file:border-0"
                onChange={e => setVideoFile(e.target.files?.[0] || null)}
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

            <Button type="submit" disabled={uploading} className="w-full bg-primary text-black font-bold h-14 uppercase tracking-[0.3em] text-[10px] neon-gold">
              {uploading ? <Loader2 className="animate-spin" /> : "Authorize & Publish"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Video Player Modal */}
      <Dialog open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
        <DialogContent className="max-w-5xl bg-black border-white/10 p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Video Player: {activeVideo?.title}</DialogTitle>
            <DialogDescription>Viewing technical analysis video in high definition</DialogDescription>
          </DialogHeader>
          <div className="relative aspect-video">
            <video 
              src={activeVideo?.videoUrl} 
              controls 
              className="w-full h-full"
              autoPlay
            />
            <Button onClick={() => setIsPlayerOpen(false)} variant="ghost" className="absolute top-4 right-4 text-white hover:bg-white/20">
              <X className="w-6 h-6" />
            </Button>
          </div>
          <div className="p-8 bg-[#131314] flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/10">
            <div>
              <h2 className="text-2xl font-headline font-bold text-white mb-2">{activeVideo?.title}</h2>
              <p className="text-sm text-muted-foreground italic">Category: <span className="text-primary font-bold">{activeVideo?.category}</span></p>
            </div>
            <Button onClick={() => handleDownload(activeVideo)} className="bg-primary text-black font-bold h-12 px-8 uppercase tracking-widest text-[10px]">
              <Download className="w-4 h-4 mr-2" /> Download Master File
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
