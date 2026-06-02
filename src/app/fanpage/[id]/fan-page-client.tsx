"use client"

import { useState } from "react"
import { useFirestore, useDoc } from "@/firebase"
import { doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Instagram, Award, Trophy, Star, TrendingUp, ExternalLink, Sparkles, MessageSquare, Hash, Loader2 } from "lucide-react"
import { aiReelContentOptimizer } from "@/ai/flows/ai-reel-content-optimizer-flow"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useMemoFirebase } from "@/firebase/firestore/use-memo-firebase"

export function FanPageProfileClient({ id }: { id: string }) {
  const db = useFirestore()
  const [aiLoading, setAiLoading] = useState(false)
  const [liveStreamThemes, setLiveStreamThemes] = useState("")
  const [aiOutput, setAiOutput] = useState<{caption: string, hashtags: string} | null>(null)
  const { toast } = useToast()

  const pageRef = useMemoFirebase(() => {
    if (!db || !id) return null
    return doc(db, "registrations", id as string)
  }, [db, id])

  const { data: page, loading } = useDoc<any>(pageRef)

  const handleOptimize = async () => {
    if (!liveStreamThemes) {
      toast({ variant: "destructive", title: "Input needed", description: "Describe the theme of the latest live stream." })
      return
    }
    setAiLoading(true)
    try {
      const result = await aiReelContentOptimizer({ liveStreamThemes })
      setAiOutput(result)
      toast({ title: "AI Magic Ready!", description: "Captions and hashtags generated." })
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Could not optimize content at this time." })
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) return (
    <div className="container mx-auto px-4 py-32 text-center text-muted-foreground">Loading creator profile...</div>
  )

  if (!page) return (
    <div className="container mx-auto px-4 py-32 text-center text-muted-foreground">Creator profile not found.</div>
  )

  const getMilestoneProgress = (count: number) => {
    const val = count || 0
    if (val < 1000) return { next: 1000, label: "1K", percent: (val / 1000) * 100 }
    if (val < 10000) return { next: 10000, label: "10K", percent: (val / 10000) * 100 }
    if (val < 50000) return { next: 50000, label: "50K", percent: (val / 50000) * 100 }
    if (val < 100000) return { next: 100000, label: "100K", percent: (val / 100000) * 100 }
    return { next: 250000, label: "250K", percent: 100 }
  }

  const progress = getMilestoneProgress(page.followerCount)

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Info */}
        <div className="space-y-6">
          <div className="glass-card p-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary mb-6 flex items-center justify-center">
              <span className="text-3xl font-headline font-bold text-primary">{page.creatorName?.[0] || 'A'}</span>
            </div>
            <h1 className="font-headline text-2xl font-bold mb-1">{page.creatorName}</h1>
            <p className="text-secondary font-bold mb-4 flex items-center gap-1.5">
              <Instagram className="w-4 h-4" /> @{page.handle}
            </p>
            <div className="flex gap-2 mb-8">
              {(page.followerCount || 0) >= 1000 && <Badge className="bg-primary/20 text-primary border-primary">1K Club</Badge>}
              {(page.followerCount || 0) >= 10000 && <Badge className="bg-primary/20 text-primary border-primary">10K Star</Badge>}
              {(page.followerCount || 0) >= 50000 && <Badge className="bg-secondary/20 text-secondary border-secondary">50K Pro</Badge>}
            </div>
            
            <div className="w-full space-y-4 pt-6 border-t border-white/10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Current Followers</span>
                <span className="font-code font-bold text-white text-lg">{(page.followerCount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Growth Tier</span>
                <span className="text-primary font-bold">{progress.label}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Member Since</span>
                <span className="text-white">{page.createdAt?.seconds ? new Date(page.createdAt.seconds * 1000).toLocaleDateString() : "New Member"}</span>
              </div>
            </div>

            <Button className="w-full mt-8 bg-secondary text-secondary-foreground font-bold" asChild>
              <a href={page.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Support on Instagram
              </a>
            </Button>
          </div>

          <div className="glass-card p-6 border-primary/20">
            <h3 className="font-headline font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Achievements
            </h3>
            <div className="space-y-4">
              <div className={`flex items-center gap-4 p-3 rounded-lg border ${(page.followerCount || 0) >= 1000 ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
                <Star className={`w-8 h-8 ${(page.followerCount || 0) >= 1000 ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-bold text-sm">1K Rising Badge</p>
                  <p className="text-xs text-muted-foreground">Unlocked at 1,000 followers</p>
                </div>
              </div>
              <div className={`flex items-center gap-4 p-3 rounded-lg border ${(page.followerCount || 0) >= 10000 ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
                <Trophy className={`w-8 h-8 ${(page.followerCount || 0) >= 10000 ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-bold text-sm">10K Star Badge</p>
                  <p className="text-xs text-muted-foreground">Unlocked at 10,000 followers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Progress & Tools */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-headline text-2xl font-bold">Milestone Progress</h2>
              <span className="text-sm font-bold text-muted-foreground">Next Tier: <span className="text-primary">{progress.label}</span></span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span>{(page.followerCount || 0).toLocaleString()}</span>
                <span>{(progress.next || 0).toLocaleString()}</span>
              </div>
              <Progress value={progress.percent} className="h-4 bg-white/5" />
              <p className="text-sm text-center pt-2 text-muted-foreground">
                You are <span className="text-white font-bold">{Math.round(progress.percent)}%</span> of the way to the <span className="text-primary font-bold">{progress.label}</span> milestone!
              </p>
            </div>
          </div>

          <div className="glass-card p-8 border-secondary/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h2 className="font-headline text-2xl font-bold">AI Content Optimizer</h2>
                <p className="text-sm text-muted-foreground">Paste Aryan Trader's live stream key themes to get viral captions.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="themes" className="text-sm font-bold text-muted-foreground">Latest Stream Topics</Label>
                <Textarea 
                  id="themes"
                  placeholder="e.g. Discussed Nifty reversal strategies, risk management, and the power of patience in sideways markets..."
                  className="bg-white/5 border-white/10 min-h-[120px]"
                  value={liveStreamThemes}
                  onChange={(e) => setLiveStreamThemes(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleOptimize} 
                disabled={aiLoading}
                className="w-full bg-secondary text-secondary-foreground font-bold neon-blue disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Optimized Reel Content"}
              </Button>
            </div>

            {aiOutput && (
              <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-top-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-secondary mb-3">
                    <MessageSquare className="w-3 h-3" /> Viral Caption
                  </h4>
                  <p className="text-sm leading-relaxed">{aiOutput.caption}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-primary mb-3">
                    <Hash className="w-3 h-3" /> Trending Hashtags
                  </h4>
                  <p className="text-sm font-code text-primary/80">{aiOutput.hashtags}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
