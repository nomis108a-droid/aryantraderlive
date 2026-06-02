
"use client"

import { useState, useMemo, useEffect } from "react"
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase"
import { collection, query, where, orderBy, getDocs, onSnapshot, doc, limit } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Crown, 
  Medal, 
  Smartphone, 
  Plane, 
  LogIn, 
  Loader2, 
  RefreshCw,
  History,
  Trophy,
  Bell,
  ExternalLink,
  IndianRupee,
  TrendingUp,
  ChevronRight,
  Zap,
  Lock,
  AlertTriangle,
  XCircle
} from "lucide-react"
import Link from "next/link"
import { useMemoFirebase } from "@/firebase/firestore/use-memo-firebase"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { FALLBACK_DISCLAIMERS, FALLBACK_REWARDS } from "@/app/layout"

export default function DashboardPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [loginHandle, setLoginHandle] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [allSubmissions, setAllSubmissions] = useState<any[]>([])
  const [subsLoading, setSubsLoading] = useState(true)

  // Site Config
  const { data: disclaimers } = useDoc<any>(db ? doc(db, "siteConfig", "disclaimers") : null)
  const { data: rewards } = useDoc<any>(db ? doc(db, "siteConfig", "rewardTiers") : null)

  useEffect(() => {
    if (!db || !user?.handle) return;
    const handle = user.handle.toLowerCase().replace('@', '');
    
    const q = query(collection(db, "submissions"), orderBy("submittedAt", "desc"), limit(500));
    
    setSubsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filtered = snapshot.docs
        .map(d => ({ ...d.data(), id: d.id }))
        .filter((sub: any) => sub.instagramHandle === handle);
      
      setAllSubmissions(filtered);
      setSubsLoading(false);
    });

    return () => unsubscribe();
  }, [db, user?.handle]);

  const regQuery = useMemoFirebase(() => db && user?.uid ? query(collection(db, "registrations"), where("userId", "==", user.uid)) : null, [db, user?.uid])
  const { data: regs } = useCollection<any>(regQuery)
  const mainPage = regs?.[0]

  const followers = mainPage?.followerCount || 0
  const isDisqualified = mainPage?.isDisqualified || false
  const isEligibleByFollowers = followers >= 1000 && !isDisqualified

  const earningsData = useMemo(() => {
    if (!isEligibleByFollowers) return { total: 0, breakdown: [] };

    const breakdown = allSubmissions.map((sub, index) => {
      const views = sub.views || 0;
      let earned = 0;
      if (views >= 100000) earned = 1500;
      else if (views >= 50000) earned = 500;
      return {
        id: sub.id,
        reelNum: allSubmissions.length - index,
        views,
        earned
      };
    }).filter(item => item.earned > 0);
    const total = breakdown.reduce((acc, item) => acc + item.earned, 0);
    return { total, breakdown };
  }, [allSubmissions, isEligibleByFollowers]);

  const groupedSubmissions = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const cutoff = sevenDaysAgo.getTime();
    
    return {
      thisWeek: allSubmissions.filter(s => {
        const t = s.submittedAt?.toMillis ? s.submittedAt.toMillis() : 0;
        return t >= cutoff;
      }),
      previous: allSubmissions.filter(s => {
        const t = s.submittedAt?.toMillis ? s.submittedAt.toMillis() : 0;
        return t < cutoff;
      })
    };
  }, [allSubmissions]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    setIsLoggingIn(true)
    const handle = loginHandle.replace('@', '').toLowerCase().trim()
    try {
      const q = query(collection(db, "users"), where("handle", "==", handle))
      const snap = await getDocs(q)
      if (snap.empty) {
        toast({ variant: "destructive", title: "Handle not found" })
      } else {
        localStorage.setItem('mock_user', JSON.stringify(snap.docs[0].data()))
        window.dispatchEvent(new Event('mock-auth-change'))
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Sync failed" })
    } finally {
      setIsLoggingIn(false)
    }
  }

  if (authLoading) return <div className="container mx-auto py-32 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin w-10 h-10 text-primary" /><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Syncing Profile...</p></div>

  if (!user) return (
    <div className="container mx-auto px-4 py-20 max-md:pt-10 max-w-md">
      <div className="glass-card p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <LogIn className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-headline font-bold">Creator Login</h1>
          <p className="text-sm text-muted-foreground">Access your synchronized cloud profile.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-2">
            <Label>Instagram Handle</Label>
            <Input placeholder="@handle" className="bg-white/5 border-white/10" required value={loginHandle} onChange={e => setLoginHandle(e.target.value)} />
          </div>
          <Button type="submit" disabled={isLoggingIn} className="w-full bg-primary text-black font-bold h-12 uppercase tracking-widest text-[10px]">
            {isLoggingIn ? <Loader2 className="animate-spin" /> : "Authorize Sync"}
          </Button>
        </form>
      </div>
    </div>
  )

  const activeRewards = rewards?.milestones || FALLBACK_REWARDS.milestones;
  const milestones = [
    { tier: 1000, reward: activeRewards[0]?.reward, icon: <Crown className="w-3 h-3" />, label: "1K" },
    { tier: 10000, reward: activeRewards[1]?.reward, icon: <Medal className="w-3 h-3" />, label: "10K" },
    { tier: 50000, reward: activeRewards[2]?.reward, icon: <Smartphone className="w-3 h-3" />, label: "50K" },
    { tier: 100000, reward: activeRewards[3]?.reward, icon: <Plane className="w-3 h-3" />, label: "100K" }
  ]
  const currentMilestone = milestones.find(m => followers < m.tier) || milestones[milestones.length - 1]
  const progress = Math.min((followers / currentMilestone.tier) * 100, 100)

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 max-w-7xl">
      {/* Prize Claim Guide */}
      <div className="mb-8 glass-card border-primary/50 bg-primary/5 p-6 md:p-8 relative overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.1)]">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-6">
            <h2 className="text-lg font-headline font-bold text-primary uppercase tracking-wider">Prize Claim Guide</h2>
            <p className="text-sm md:text-base font-bold text-white/90 leading-relaxed">
              {disclaimers?.dashboard || FALLBACK_DISCLAIMERS.dashboard}
            </p>
          </div>
        </div>
      </div>

      {/* Disqualification / Eligibility Rules */}
      <div className="mb-12 space-y-4">
        {isDisqualified ? (
          <div className="glass-card border-destructive bg-destructive/10 p-6 flex items-center gap-6 shadow-[0_0_20px_rgba(255,0,0,0.2)]">
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-headline font-bold text-destructive uppercase tracking-tight">Account Disqualified</h3>
              <p className="text-sm text-white font-bold">Your page has been disqualified from cash rewards. Reason: Violating the "Following Rule" or registry integrity.</p>
            </div>
          </div>
        ) : (
          <div className="glass-card border-amber-500/50 bg-amber-500/5 p-6 flex items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-headline font-black text-amber-500 uppercase tracking-widest">📋 Following Rule Reminder</h3>
              <p className="text-sm text-white/80 font-bold leading-tight">Your Instagram fan page must follow 50 or fewer accounts to be eligible for prizes. Fan pages following more than 50 accounts will be disqualified from all cash rewards.</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 glass-card p-6 md:p-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary uppercase">
            {user.handle?.[0] || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-headline font-bold">@{user.handle}</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 uppercase tracking-widest mt-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Real-time Cloud Link
            </div>
          </div>
        </div>
        <Link href="/competition"><Button className="bg-primary text-black font-bold h-12 uppercase tracking-widest text-xs shadow-lg neon-gold hover:scale-105 transition-all"><Plus className="w-4 h-4 mr-2" /> Deploy New Reel</Button></Link>
      </div>

      {!isEligibleByFollowers && !isDisqualified && (
        <div className="mb-12 glass-card border-destructive/30 bg-destructive/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center"><Lock className="w-5 h-5 text-destructive" /></div>
             <div>
                <p className="text-sm font-bold text-white">Reel Incentives Locked</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Reach 1,000 followers to unlock cash rewards.</p>
             </div>
          </div>
          <Link href="/leaderboard"><Button variant="outline" size="sm" className="border-destructive/20 text-destructive text-[10px] font-bold uppercase">View Rankings</Button></Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
        {[
          { label: "Followers", value: followers.toString(), color: "text-white" },
          { label: "Rank", value: "#" + (mainPage?.rank || "---"), color: "text-secondary" },
          { label: "Total Reels", value: (allSubmissions?.length || 0).toString(), color: "text-white" },
          { label: "Reel Earnings", value: isDisqualified ? "Disqualified" : (!isEligibleByFollowers ? "Locked" : `₹${earningsData.total.toString()}`), color: isDisqualified ? "text-destructive" : (isEligibleByFollowers ? (earningsData.total > 0 ? "text-primary" : "text-white") : "text-destructive") }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 md:p-6 hover:border-primary/30 transition-all">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 tracking-widest">{stat.label}</p>
            <p className={`text-xl md:text-3xl font-code font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <div className="glass-card p-6 md:p-8 border-primary/20 bg-primary/[0.02]">
            <h2 className="text-lg font-headline font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Growth Milestones
            </h2>
            <Progress value={progress} className="h-3 bg-white/5 mb-4" />
            <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
              <span>{followers.toString()} Followers</span>
              <span>Goal: {currentMilestone.tier.toString()}</span>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-headline font-bold flex items-center gap-2 border-l-4 border-primary pl-4"><IndianRupee className="w-5 h-5 text-primary" /> Rewards Breakdown</h2>
            <div className="glass-card overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      <tr><th className="px-6 py-4">Reel</th><th className="px-6 py-4">Views</th><th className="px-6 py-4">Earned</th><th className="px-6 py-4 text-right">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {subsLoading ? (
                        <tr><td colSpan={4} className="px-6 py-8"><Skeleton className="h-8 w-full bg-white/5" /></td></tr>
                      ) : (isEligibleByFollowers && earningsData.breakdown.length > 0) ? (
                        earningsData.breakdown.map((item) => (
                          <tr key={item.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-bold text-white">Reel #{item.reelNum}</td>
                            <td className="px-6 py-4 font-code text-white">{item.views.toString()}</td>
                            <td className="px-6 py-4 font-code text-primary font-bold">₹{item.earned.toString()}</td>
                            <td className="px-6 py-4 text-right"><Badge className="bg-green-400/10 text-green-400 border-green-400/20 text-[8px] uppercase">Verified</Badge></td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-xs italic uppercase tracking-widest opacity-60">
                          {isDisqualified ? (
                            <span className="text-destructive font-bold uppercase">Account Disqualified - Earnings Nullified.</span>
                          ) : !isEligibleByFollowers ? (
                            "Reach 1,000 followers to unlock reel incentives." 
                          ) : (earningsData.total === 0 ? "Get 50,000 views on a reel to earn ₹500." : "No records found.")}
                        </td></tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>

          <div className="space-y-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-l-4 border-primary pl-4">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-headline font-bold uppercase tracking-tight">Active Battle <span className="text-muted-foreground ml-2 font-code">({groupedSubmissions.thisWeek.length})</span></h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {groupedSubmissions.thisWeek.map(entry => <WarEntryCard key={entry.id} entry={entry} />)}
                {groupedSubmissions.thisWeek.length === 0 && !subsLoading && <div className="col-span-full py-10 glass-card text-center italic text-muted-foreground text-[10px] uppercase font-bold tracking-widest opacity-40">Empty registry for this week.</div>}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 border-l-4 border-muted pl-4">
                <History className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-xl font-headline font-bold uppercase tracking-tight">Lifetime Registry <span className="text-muted-foreground ml-2 font-code">({groupedSubmissions.previous.length})</span></h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {groupedSubmissions.previous.map(entry => <WarEntryCard key={entry.id} entry={entry} />)}
                {groupedSubmissions.previous.length === 0 && !subsLoading && <div className="col-span-full py-10 glass-card text-center italic text-muted-foreground text-[10px] uppercase font-bold tracking-widest opacity-40">No historical entries.</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 md:p-8 border-primary/20 sticky top-24">
             <div className="flex flex-col items-center gap-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"><TrendingUp className="w-8 h-8 text-primary" /></div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-primary tracking-widest">Global Standings</p>
                  <p className="text-4xl font-code font-bold text-white italic">#{mainPage?.rank || "---"}</p>
                </div>
                <Link href="/payout" className="w-full">
                  <Button variant="outline" className="w-full h-12 border-primary/20 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-black" disabled={isDisqualified}>Withdraw Rewards <ChevronRight className="w-3 h-3 ml-2" /></Button>
                </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WarEntryCard({ entry }: { entry: any }) {
  const dateStr = entry.submittedAt?.seconds ? new Date(entry.submittedAt.seconds * 1000).toLocaleDateString() : 'New';
  return (
    <div className="glass-card group overflow-hidden border-white/5 hover:border-primary/30 transition-all flex flex-col h-full">
      <div className="relative aspect-video overflow-hidden bg-black/40 flex items-center justify-center">
        {entry.thumbnailUrl && <img src={entry.thumbnailUrl} alt="Submission" className="w-full h-full object-cover opacity-60" />}
        <Badge className="absolute top-2 left-2 bg-black/80 text-[8px] uppercase tracking-widest border border-white/10">ENTRY</Badge>
      </div>
      <div className="p-5 flex-grow flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
            <p className="text-[8px] uppercase font-bold text-muted-foreground mb-1">Views</p>
            <p className="text-xl font-code font-bold text-primary">{(entry.views || 0).toString()}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
            <p className="text-[8px] uppercase font-bold text-muted-foreground mb-1">Likes</p>
            <p className="text-xl font-code font-bold text-white">{(entry.likes || 0).toString()}</p>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
          <span className="text-[10px] text-muted-foreground font-medium">{dateStr}</span>
          <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase tracking-[0.2em] hover:text-primary gap-2" asChild>
            <a href={entry.reelUrl} target="_blank" rel="noopener noreferrer">View <ExternalLink className="w-3 h-3" /></a>
          </Button>
        </div>
      </div>
    </div>
  )
}
