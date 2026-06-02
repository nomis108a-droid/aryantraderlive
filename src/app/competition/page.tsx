
"use client"

import { useState, useEffect } from "react"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { 
  collection, 
  addDoc,
  serverTimestamp, 
  query, 
  orderBy, 
  limit,
  onSnapshot,
  doc,
  writeBatch,
  getDocs
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Award, Loader2, Bell, Crown, Play, Flame, TrendingUp, Medal, Trophy, CheckCircle, Shield, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FALLBACK_DISCLAIMERS } from "@/app/layout"

export default function CompetitionPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [showcaseFormData, setShowcaseFormData] = useState({ reelUrl: "", desc: "" })
  const [isShowcaseSubmitting, setIsShowcaseSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [warEntries, setWarEntries] = useState<any[]>([])
  const [warLoading, setWarLoading] = useState(true)
  const [declaringWinners, setDeclaringWinners] = useState(false)
  
  // Site Config for disclaimers
  const { data: disclaimers } = useDoc<any>(db ? doc(db, "siteConfig", "disclaimers") : null)

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "submissions"), orderBy("views", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWarEntries(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
      setWarLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    const getNextSunday = () => { 
      const now = new Date(); 
      const istOffset = 5.5 * 60 * 60 * 1000; 
      const istNow = new Date(now.getTime() + istOffset); 
      const day = istNow.getUTCDay(); 
      const daysUntilSunday = day === 0 ? 7 : 7 - day; 
      const nextSunday = new Date(istNow); 
      nextSunday.setUTCDate(istNow.getUTCDate() + daysUntilSunday); 
      nextSunday.setUTCHours(23, 59, 59, 0); 
      const targetDate = new Date(nextSunday.getTime() - istOffset);
      console.log("Weekly War End Date (IST Sunday Midnight):", targetDate);
      return targetDate; 
    };

    const targetDate = getNextSunday();
    const timerInterval = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        });
      }
    }, 1000); 

    return () => clearInterval(timerInterval);
  }, []);

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!user || !db) return toast({ variant: "destructive", title: "Authentication Required" })
    
    setIsShowcaseSubmitting(true)
    const handle = user.handle.toLowerCase().replace('@', '');

    const subData = {
      userId: user.uid, 
      instagramHandle: handle, 
      reelUrl: showcaseFormData.reelUrl,
      description: showcaseFormData.desc, 
      submittedAt: serverTimestamp(), 
      views: 0,
      likes: 0
    }

    addDoc(collection(db, "submissions"), subData).then(() => {
      toast({ title: "Reel Deployed!" }); 
      setShowcaseFormData({ reelUrl: "", desc: "" }); 
    }).finally(() => setIsShowcaseSubmitting(false))
  }

  const declareWinners = async () => {
    if (!db || warEntries.length < 2) return;
    setDeclaringWinners(true);
    try {
      const winner1 = warEntries[0];
      const winner2 = warEntries[1];

      toast({ title: "Winners Declared!", description: `1st: @${winner1.instagramHandle}, 2nd: @${winner2.instagramHandle}. Prizes synchronized.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Declaration Failed" });
    } finally {
      setDeclaringWinners(false);
    }
  };

  const top1 = warEntries[0];
  const top2 = warEntries[1];

  return (
    <div className="container mx-auto px-4 py-8 md:py-20 max-w-7xl">
      {/* Permanent Eligibility Rules Banner - Top Priority */}
      <div className="mb-12 glass-card bg-gradient-to-br from-primary/20 via-primary/5 to-black/40 border-primary/60 p-6 md:p-8 relative overflow-hidden shadow-[0_0_40px_rgba(255,215,0,0.2)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_20px_#FFD700]" />
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/40 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-headline font-black text-primary uppercase tracking-tight flex items-center gap-2">
              🛡️ WEEKLY WAR ELIGIBILITY RULES
            </h2>
            <div className="space-y-4">
              <p className="text-lg md:text-xl font-bold text-white leading-tight">
                ✅ Your Instagram fan page must follow maximum 50 accounts only.
              </p>
              <div className="flex items-start gap-3 p-5 bg-destructive/10 border border-destructive/20 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-1" />
                <p className="text-base md:text-lg font-black text-white leading-relaxed">
                  ⚠️ If you are following more than 50 accounts — please unfollow the extra accounts first! Views will only be updated for fan pages following 50 or fewer accounts. Fan pages with more than 50 following will not receive any prize or views update.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prize Banner */}
      <div className="mb-12 glass-card bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 border-primary/40 p-6 md:p-10 text-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_20px_#FFD700]" />
        <h2 className="font-headline text-2xl md:text-4xl font-black text-white mb-4 italic tracking-tight uppercase">Weekly Battle Prizes</h2>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          <div className="flex flex-col items-center">
             <span className="text-[10px] uppercase font-bold text-primary tracking-[0.3em] mb-1">1st Place</span>
             <span className="text-3xl md:text-5xl font-code font-black text-white">₹2,000</span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-[10px] uppercase font-bold text-secondary tracking-[0.3em] mb-1">2nd Place</span>
             <span className="text-3xl md:text-5xl font-code font-black text-white">₹1,000</span>
          </div>
        </div>
      </div>

      {/* Winner Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        <div className="glass-card border-primary/50 bg-primary/5 p-8 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,215,0,0.3)] border border-primary/30">
            <Crown className="w-8 h-8 text-primary fill-primary/20" />
          </div>
          <h3 className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-1">1st Place Winner</h3>
          {top1 ? (
            <>
              <p className="text-2xl font-headline font-black text-white mb-2 uppercase tracking-tight">@{top1.instagramHandle}</p>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="font-code text-xl font-bold text-white">{(top1.views || 0).toLocaleString()} Views</span>
              </div>
              <Badge className="bg-primary text-black font-black uppercase text-[10px] px-6 py-2 shadow-[0_0_15px_#FFD700]">₹2,000 Prize Badge</Badge>
            </>
          ) : <p className="text-muted-foreground italic text-sm">Waiting for entries...</p>}
        </div>

        <div className="glass-card border-white/20 bg-white/5 p-8 flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/20">
            <Medal className="w-8 h-8 text-white/70" />
          </div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">2nd Place Winner</h3>
          {top2 ? (
            <>
              <p className="text-2xl font-headline font-black text-white mb-2 uppercase tracking-tight">@{top2.instagramHandle}</p>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="font-code text-xl font-bold text-white">{(top2.views || 0).toLocaleString()} Views</span>
              </div>
              <Badge className="bg-white/20 text-white border-white/40 font-black uppercase text-[10px] px-6 py-2">₹1,000 Prize Badge</Badge>
            </>
          ) : <p className="text-muted-foreground italic text-sm">Waiting for entries...</p>}
        </div>
      </div>

      <section className="mb-20">
        <div className="text-center mb-10">
          <h1 className="font-headline text-5xl md:text-8xl font-black mb-4 gold-gradient-text tracking-tighter uppercase text-center italic">WEEKLY WAR 🔥</h1>
          <div className="flex justify-center gap-4 md:gap-8 mb-8">
            <div className="glass-card p-4 min-w-[80px]">
              <p className="text-3xl font-code font-bold text-primary">{timeLeft.days}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Days</p>
            </div>
            <div className="glass-card p-4 min-w-[80px]">
              <p className="text-3xl font-code font-bold text-primary">{timeLeft.hours}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Hours</p>
            </div>
            <div className="glass-card p-4 min-w-[80px]">
              <p className="text-3xl font-code font-bold text-primary">{timeLeft.minutes}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Mins</p>
            </div>
            <div className="glass-card p-4 min-w-[80px]">
              <p className="text-3xl font-code font-bold text-primary">{timeLeft.seconds}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Secs</p>
            </div>
          </div>
          
          {user?.isAdmin && (
            <Button 
              onClick={declareWinners} 
              disabled={declaringWinners}
              className="bg-destructive hover:bg-destructive/80 text-white font-black uppercase tracking-[0.2em] text-[10px] h-10 px-8"
            >
              {declaringWinners ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Trophy className="w-4 h-4 mr-2" />} Declare Winners & Settle
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-12">
          <div className="lg:col-span-1 glass-card p-6 md:p-8 border-primary/20">
             <h3 className="font-headline text-xl font-bold mb-6 flex items-center gap-2 text-white"><Flame className="w-5 h-5 text-primary" /> Deploy Reel</h3>
             {user ? (
               <form onSubmit={handleSubmission} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Instagram Reel Link</Label>
                    <Input placeholder="instagram.com/reels/..." className="bg-white/5 border-white/10 h-12" value={showcaseFormData.reelUrl} onChange={e => setShowcaseFormData({...showcaseFormData, reelUrl: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Reel Description</Label>
                    <Textarea placeholder="What is this reel about?" className="bg-white/5 border-white/10 min-h-[100px]" value={showcaseFormData.desc} onChange={e => setShowcaseFormData({...showcaseFormData, desc: e.target.value})} required />
                  </div>
                  <Button type="submit" disabled={isShowcaseSubmitting} className="w-full bg-primary text-black font-bold h-12 uppercase tracking-widest text-[10px] neon-gold">
                     {isShowcaseSubmitting ? <Loader2 className="animate-spin" /> : "Authorize Deployment"}
                  </Button>
               </form>
             ) : (
               <div className="text-center py-10 space-y-6">
                  <p className="text-sm text-muted-foreground italic leading-relaxed">Login to submit your reel and join the rankings.</p>
                  <Button variant="outline" className="w-full h-11 border-white/10 text-xs font-bold uppercase tracking-widest" onClick={() => window.dispatchEvent(new Event('trigger-login-dialog'))}>Login to Submit</Button>
               </div>
             )}
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card overflow-hidden">
               <div className="p-6 bg-white/5 border-b border-white/10 flex justify-between items-center gap-4">
                  <h2 className="font-headline font-bold text-xl flex items-center gap-2 text-white"><Award className="w-5 h-5 text-primary" /> Battle Leaderboard</h2>
                  <Badge className="bg-primary/20 text-primary border-primary text-[10px] font-bold px-4 py-1.5 uppercase tracking-widest"><TrendingUp className="w-3.5 h-3.5 animate-pulse" /> Live Metrics</Badge>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left min-w-[500px]">
                    <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <tr><th className="px-6 py-4">Rank</th><th className="px-6 py-4">Creator</th><th className="px-6 py-4">Verified Views</th><th className="px-6 py-4 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {warLoading ? (
                        Array.from({ length: 6 }).map((_, i) => <tr key={i}><td colSpan={4} className="px-6 py-6"><Skeleton className="h-12 w-full bg-white/5" /></td></tr>)
                      ) : (warEntries && warEntries.length > 0) ? (
                        warEntries.map((entry, index) => (
                          <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                             <td className="px-6 py-4">{index === 0 ? <Crown className="w-5 h-5 text-primary animate-pulse" /> : index === 1 ? <Medal className="w-5 h-5 text-muted-foreground" /> : <span className="font-code font-bold text-muted-foreground">#{index + 1}</span>}</td>
                             <td className="px-6 py-4 font-bold text-white text-sm">@{entry.instagramHandle}</td>
                             <td className="px-6 py-4 font-code text-xl font-bold text-primary">{(entry.views || 0).toString()}</td>
                             <td className="px-6 py-4 text-right">
                                <Button variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase border-white/10 hover:bg-primary hover:text-black" asChild>
                                  <a href={entry.reelUrl} target="_blank" rel="noopener noreferrer">View</a>
                                </Button>
                             </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="px-6 py-20 text-center italic text-muted-foreground text-sm uppercase font-bold opacity-40">Leaderboard Clear.</td></tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
