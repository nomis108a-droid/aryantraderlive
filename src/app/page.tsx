
"use client"

import Link from "next/link"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Gift, 
  CircleCheck, 
  ArrowRight, 
  Star, 
  Medal, 
  Award, 
  Crown, 
  Smartphone, 
  Plane, 
  Coins, 
  Zap,
  Image as ImageIcon,
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Save
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ProofGallery } from "@/components/proof-gallery"
import { MeetTrader } from "@/components/meet-trader"
import { FALLBACK_REWARDS } from "./layout"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { uploadToSupabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [bgPosition, setBgPosition] = useState({ x: 50, y: 30 });

  const { data: rewards } = useDoc<any>(db ? doc(db, "siteConfig", "rewardTiers") : null);
  const { data: heroConfig } = useDoc<any>(db ? doc(db, "siteConfig", "heroSection") : null);

  useEffect(() => {
    if (heroConfig?.bgPositionX !== undefined && heroConfig?.bgPositionY !== undefined) {
      setBgPosition({ x: heroConfig.bgPositionX, y: heroConfig.bgPositionY });
    }
  }, [heroConfig]);

  const activeRewards = rewards?.reelRewards || FALLBACK_REWARDS.reelRewards;
  const activeMilestones = rewards?.milestones || FALLBACK_REWARDS.milestones;

  const heroBgURL = heroConfig?.bgImageURL;
  const defaultGradient = "linear-gradient(135deg, #1a1200 0%, #2a1f00 50%, #0a0a0a 100%)";

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;

    setIsUploading(true);
    try {
      const publicUrl = await uploadToSupabase(file, 'hero-bg');
      await setDoc(doc(db, 'siteConfig', 'heroSection'), 
        { bgImageURL: publicUrl, updatedAt: serverTimestamp() }, 
        { merge: true }
      );
      toast({ title: "Background Updated", description: "Hero section visuals synchronized." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePosition = async () => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'siteConfig', 'heroSection'), 
        { 
          bgPositionX: bgPosition.x, 
          bgPositionY: bgPosition.y, 
          updatedAt: serverTimestamp() 
        }, 
        { merge: true }
      );
      toast({ title: "Position Saved", description: "Background alignment synchronized." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    }
  };

  const reelRewards = [
    { target: "50,000+", reward: "₹500 Cash", icon: <Zap className="w-8 h-8 text-red-500" /> },
    { target: "1,00,000+", reward: "₹1,500 Cash", icon: <Zap className="w-8 h-8 text-red-500" /> },
  ]

  const followerMilestones = [
    { 
      tier: "1K", 
      reward: "VIP GROUP FREE ACCESS + Reel Incentives Unlocked 🔓", 
      subtitle: "Post reels and earn cash rewards after reaching 1K followers!",
      description: "Hit 1,000 followers to unlock: Free VIP Trading Group Access + Eligibility to earn ₹500 for 50K views and ₹1,500 for 1 Lakh views on your reels.",
      icon: <Crown className="w-8 h-8 text-primary" />, 
      highlight: "START HERE - Unlock all earning features!",
      isSpecial: true
    },
    { 
      tier: "10K", 
      reward: activeMilestones[1]?.reward, 
      description: "Official verification and direct cash payout for your growth.",
      icon: <Medal className="w-8 h-8 text-primary" /> 
    },
    { 
      tier: "50K", 
      reward: activeMilestones[2]?.reward, 
      description: "Premium tech rewards to level up your content creation.",
      icon: <Smartphone className="w-8 h-8 text-secondary" /> 
    },
    { 
      tier: "100K", 
      reward: activeMilestones[3]?.reward, 
      description: "Exclusive luxury experience with Aryan Trader himself.",
      icon: <Plane className="w-8 h-8 text-primary" /> 
    },
  ]

  return (
    <div className="flex flex-col gap-12 md:gap-20 pb-20">
      <section className="relative overflow-hidden w-full h-[100vh] flex items-center">
        {/* Background layer with brightness boost */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: heroBgURL ? `url(${heroBgURL})` : defaultGradient,
            backgroundSize: 'cover',
            backgroundPosition: `${bgPosition.x}% ${bgPosition.y}%`,
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(1.5) contrast(1.1) saturate(1.2)',
            imageRendering: 'auto',
          }}
        />

        {/* Lighter Gradient Overlay for Readability */}
        <div 
          className="absolute inset-0 z-[1] md:bg-[linear-gradient(to_right,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0)_100%)] bg-[rgba(0,0,0,0.45)]"
        />

        {/* Hero Content */}
        <div className="container mx-auto px-4 md:px-12 relative z-[2] w-full">
          <div className="max-w-full md:max-w-[55%] flex flex-col items-start text-left">
            {/* Top badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid #FFD700',
              borderRadius: '999px',
              padding: '6px 16px',
              color: '#FFD700',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '2px',
              marginBottom: '24px',
              backdropFilter: 'blur(10px)',
              background: 'rgba(255, 215, 0, 0.1)',
            }}>
              ✦ OFFICIAL CREATOR HUB
            </div>

            {/* Main heading */}
            <h1 style={{
              fontSize: 'clamp(36px, 6vw, 72px)',
              fontWeight: '900',
              color: '#FFD700',
              lineHeight: '1.1',
              marginBottom: '8px',
              textShadow: '0 0 20px rgba(0,0,0,0.9), 2px 2px 8px rgba(0,0,0,1)',
              letterSpacing: '-1px',
            }}>
              CREATE. SYNC. EARN.
            </h1>

            {/* Subtitle */}
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 56px)',
              fontWeight: '800',
              color: '#FFFFFF',
              lineHeight: '1.1',
              marginBottom: '20px',
              textShadow: '2px 2px 15px rgba(0,0,0,1), 0 0 30px rgba(0,0,0,0.9)',
            }}>
              Aryan Gold Network
            </h2>

            {/* Description */}
            <p style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.95)',
              maxWidth: '420px',
              lineHeight: '1.7',
              marginBottom: '36px',
              textShadow: '1px 1px 8px rgba(0,0,0,1)',
            }}>
              Professional creator network for traders. Hit cloud-verified 
              milestones and withdraw instant cash rewards.
            </p>

            {/* Buttons row */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/register">
                <button style={{
                  background: '#FFD700',
                  color: '#000000',
                  fontWeight: '800',
                  fontSize: '16px',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 0 30px rgba(255,215,0,0.4)',
                }}>
                  Join Network
                </button>
              </Link>

              <Link href="/leaderboard">
                <button style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '16px',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                }}>
                  View Rankings
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Admin Background Control Panel */}
        {user?.isAdmin && (
          <div className="absolute top-24 right-6 z-[20] glass-card p-4 border-primary/30 w-48 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary uppercase">Positioning</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSavePosition}><Save className="w-3 h-3 text-primary" /></Button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div />
              <Button size="icon" variant="outline" className="h-8 w-8 border-primary/20 text-primary" onClick={() => setBgPosition(p => ({ ...p, y: Math.max(0, p.y - 5) }))}><ChevronUp className="w-4 h-4" /></Button>
              <div />
              
              <Button size="icon" variant="outline" className="h-8 w-8 border-primary/20 text-primary" onClick={() => setBgPosition(p => ({ ...p, x: Math.max(0, p.x - 5) }))}><ChevronLeft className="w-4 h-4" /></Button>
              <div />
              <Button size="icon" variant="outline" className="h-8 w-8 border-primary/20 text-primary" onClick={() => setBgPosition(p => ({ ...p, x: Math.min(100, p.x + 5) }))}><ChevronRight className="w-4 h-4" /></Button>
              
              <div />
              <Button size="icon" variant="outline" className="h-8 w-8 border-primary/20 text-primary" onClick={() => setBgPosition(p => ({ ...p, y: Math.min(100, p.y + 5) }))}><ChevronDown className="w-4 h-4" /></Button>
              <div />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[8px] font-bold text-muted-foreground uppercase">
                <span>X: {bgPosition.x}%</span>
                <span>Y: {bgPosition.y}%</span>
              </div>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={bgPosition.x} 
                  onChange={e => setBgPosition(p => ({ ...p, x: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-white/5 border border-white/10 rounded text-[10px] p-1 text-center text-white"
                  min="0" max="100"
                />
                <input 
                  type="number" 
                  value={bgPosition.y} 
                  onChange={e => setBgPosition(p => ({ ...p, y: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-white/5 border border-white/10 rounded text-[10px] p-1 text-center text-white"
                  min="0" max="100"
                />
              </div>
            </div>
            
            <Button onClick={handleSavePosition} className="w-full h-8 bg-primary text-black font-bold text-[10px] uppercase neon-gold">
              Save Position
            </Button>
          </div>
        )}

        {/* Admin Background Upload Button */}
        {user?.isAdmin && (
          <div className="absolute bottom-6 right-6 z-[10]">
            <label htmlFor="hero-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                Change Background
              </div>
              <input 
                id="hero-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleBgUpload} 
                disabled={isUploading}
              />
            </label>
          </div>
        )}
      </section>

      <MeetTrader />

      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="destructive" className="mb-4 animate-pulse uppercase tracking-[0.2em] px-4 py-1.5 font-black text-[10px]">Reel Performance Bonus</Badge>
          <div className="flex justify-center mb-4">
             <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-bold px-4 py-1">Requires 1,000+ Followers to be eligible</Badge>
          </div>
          <h2 className="font-headline text-3xl md:text-4xl font-bold mb-2">Cash Incentives</h2>
          <p className="text-destructive font-bold text-sm md:text-base mb-6 italic">
            "Direct cash bonuses for verified view counts."
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
          {reelRewards.map((r, i) => (
            <div key={i} className="glass-card p-8 border-destructive/30 shadow-[0_0_20px_rgba(255,0,0,0.1)] flex flex-col items-center text-center gap-4 group hover:scale-[1.02] transition-transform">
              <div className="p-5 rounded-2xl bg-destructive/10">
                {r.icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{r.target} Views</h3>
                <div className="text-3xl font-code font-bold text-destructive">{r.reward}</div>
              </div>
              <Badge variant="outline" className="text-[10px] border-destructive/20 text-destructive/80 font-bold uppercase tracking-widest">Cloud Verified</Badge>
            </div>
          ))}
        </div>
        <div className="text-center">
           <p className="text-xs font-bold text-primary uppercase tracking-widest italic animate-pulse">
             You must have minimum 1,000 followers on your fan page to be eligible for reel incentives.
           </p>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">Growth Milestones</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            Scale your registry and unlock premium assets verified by Aryan Trader.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {followerMilestones.map((m) => (
            <div 
              key={m.tier} 
              className={cn(
                "glass-card p-6 md:p-8 flex flex-col items-center text-center gap-6 group hover:-translate-y-1 transition-all duration-300 border-primary/20 relative",
                m.isSpecial ? "ring-2 ring-primary shadow-[0_0_40px_rgba(255,215,0,0.4)] border-primary/50" : "neon-gold"
              )}
            >
              {m.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-full px-4">
                   <Badge className="bg-primary text-black font-black uppercase text-[8px] tracking-[0.2em] w-full justify-center shadow-[0_0_15px_#FFD700] py-1">
                     {m.highlight}
                   </Badge>
                </div>
              )}
              <div className="p-4 md:p-5 rounded-2xl bg-white/5 group-hover:bg-primary/10 transition-colors duration-300 mt-2">
                {m.icon}
              </div>
              <div className="space-y-4">
                <h3 className="font-code text-3xl md:text-4xl font-bold text-white tracking-tighter">{m.tier}</h3>
                <div className="space-y-2 min-h-[100px] flex flex-col items-center justify-center">
                  <p className="font-bold text-xs text-primary uppercase leading-tight">
                    {m.reward}
                  </p>
                  {m.subtitle && (
                    <p className="text-[10px] text-white font-bold italic leading-tight opacity-90">
                      {m.subtitle}
                    </p>
                  )}
                  {m.description && (
                    <p className="text-[9px] text-muted-foreground leading-relaxed mt-2 italic px-2">
                      {m.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="w-full h-px bg-white/10" />
              <Badge variant="outline" className="text-[8px] tracking-widest border-primary/20 text-primary/70 font-bold uppercase">Authorized Rewards</Badge>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="glass-card p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-medium uppercase text-[10px] md:text-xs tracking-widest">Network Creators</span>
            <span className="font-code text-3xl md:text-4xl font-bold text-white">420+</span>
          </div>
          <div className="flex flex-col gap-2 border-y md:border-y-0 md:border-x border-white/10 py-6 md:py-0">
            <span className="text-muted-foreground font-medium uppercase text-[10px] md:text-xs tracking-widest">Combined Influence</span>
            <span className="font-code text-3xl md:text-4xl font-bold text-secondary">1.2M+</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-medium uppercase text-[10px] md:text-xs tracking-widest">Rewards Paid</span>
            <span className="font-code text-3xl md:text-4xl font-bold text-primary">₹5.5L+</span>
          </div>
        </div>
      </section>

      <ProofGallery />
    </div>
  )
}
