"use client"

import { useState } from "react"
import { useFirestore } from "@/firebase"
import { collection, addDoc, setDoc, doc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CircleCheck, Upload, Loader2, Instagram, User } from "lucide-react"
import { compressImage } from "@/lib/image-utils"
import { uploadToSupabase } from "@/lib/supabase"

export default function RegisterPage() {
  const db = useFirestore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({ creatorName: "", handle: "", url: "", followerCount: "", phoneNumber: "", city: "" })
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !file) return;

    // Validate WhatsApp number
    const phone = formData.phoneNumber.replace(/\D/g, '');
    if (phone.length < 10) {
      toast({ variant: "destructive", title: "Invalid WhatsApp Number", description: "Please enter a valid 10-digit phone number." });
      return;
    }

    setLoading(true);
    try {
      // Image Compression (Max 200KB target)
      const compressedBlob = await compressImage(file, 1000, 0.6);
      const screenshotUrl = await uploadToSupabase(compressedBlob, 'registrations/proofs');

      const newUid = `AT-${Math.floor(1000 + Math.random() * 9000)}`;
      const handle = formData.handle.replace('@', '').toLowerCase().trim();

      const regData = {
        creatorName: formData.creatorName,
        handle,
        url: formData.url,
        followerCount: parseInt(formData.followerCount) || 0,
        phoneNumber: formData.phoneNumber,
        cityState: formData.city,
        screenshotUrl,
        userId: newUid,
        status: "approved",
        createdAt: serverTimestamp(),
      }

      const userData = {
        uid: newUid,
        displayName: formData.creatorName,
        handle,
        isAdmin: false,
        createdAt: new Date().toISOString()
      }

      await setDoc(doc(db, "users", newUid), userData);
      await addDoc(collection(db, "registrations"), regData);

      localStorage.setItem('mock_user', JSON.stringify(userData))
      window.dispatchEvent(new Event('mock-auth-change'))
      setSuccess(newUid)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: err.message });
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="container mx-auto px-4 pt-20 flex justify-center text-center">
      <div className="glass-card p-12 max-w-lg border-primary">
        <CircleCheck className="w-20 h-20 text-primary mx-auto mb-6" />
        <h1 className="text-4xl font-bold mb-4">Cloud Synced!</h1>
        <p className="text-4xl font-code font-bold text-primary mb-8">{success}</p>
        <Button onClick={() => window.location.href = "/dashboard"} className="w-full h-14 bg-primary text-black font-bold">Enter Hub Dashboard</Button>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <h1 className="text-6xl font-headline font-bold mb-12 text-center">Join The Hub</h1>
      <form onSubmit={handleSubmit} className="glass-card p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Label>Legal Full Name</Label>
            <Input className="bg-white/5 border-white/10 h-12" required value={formData.creatorName} onChange={e => setFormData({...formData, creatorName: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Instagram Handle</Label>
            <Input placeholder="@handle" className="bg-white/5 border-white/10 h-12" required value={formData.handle} onChange={e => setFormData({...formData, handle: e.target.value})} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>WhatsApp Number</Label>
          <Input
            type="tel"
            placeholder="+91XXXXXXXXXX"
            className="bg-white/5 border-white/10 h-12"
            required
            value={formData.phoneNumber}
            onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
          />
          <p className="text-[10px] text-muted-foreground">Enter your WhatsApp number with country code (e.g. +919876543210)</p>
        </div>
        <div className="space-y-2">
          <Label>Dashboard Proof (Screenshot)</Label>
          <div className="border-2 border-dashed border-white/10 rounded-xl p-10 text-center bg-white/5 relative">
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
            {file ? <p className="text-primary font-bold">{file.name}</p> : <p className="text-xs uppercase font-bold text-muted-foreground">Click to Upload Proof</p>}
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full h-16 bg-primary text-black font-bold uppercase tracking-widest">
          {loading ? <Loader2 className="animate-spin mr-2" /> : "Register & Sync"}
        </Button>
      </form>
    </div>
  )
}
