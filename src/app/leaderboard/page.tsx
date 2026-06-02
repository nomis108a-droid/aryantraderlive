
"use client"

import { useState } from "react"
import { useFirestore, useCollection, useDoc } from "@/firebase"
import { collection, query, orderBy, limit, doc } from "firebase/firestore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Trophy, Bell, X, ChevronRight, Crown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useMemoFirebase } from "@/firebase/firestore/use-memo-firebase"
import { FALLBACK_DISCLAIMERS } from "@/app/layout"

export default function LeaderboardPage() {
  const db = useFirestore()
  const [search, setSearch] = useState("")

  const { data: disclaimers } = useDoc<any>(db ? doc(db, "siteConfig", "disclaimers") : null)

  const rankingsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "registrations"), orderBy("followerCount", "desc"), limit(100));
  }, [db]);

  const { data: registrations, loading } = useCollection<any>(rankingsQuery);

  const filteredPages = registrations?.filter(page => 
    page.handle?.toLowerCase().includes(search.toLowerCase()) || 
    page.creatorName?.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="container mx-auto px-4 py-8 md:py-20 max-w-7xl">
      <div className="mb-12 glass-card border-primary/50 bg-primary/5 p-6 md:p-8 relative overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.1)]">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm md:text-base font-bold text-primary leading-relaxed">
            {disclaimers?.rankings || FALLBACK_DISCLAIMERS.rankings}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
        <div className="text-center md:text-left">
          <h1 className="font-headline text-3xl md:text-5xl font-bold mb-2 tracking-tight">Creator Hall of Fame</h1>
          <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-[0.2em] font-bold">Verified Cloud Rankings</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search creators..." className="pl-10 bg-white/5 border-white/10 h-11" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="glass-card overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Rank</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Creator</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-muted-foreground text-center">Followers</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Tier</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-6 py-6"><Skeleton className="h-12 w-full bg-white/5" /></td></tr>
                ))
              ) : filteredPages.length > 0 ? (
                filteredPages.map((page, index) => {
                  const count = page.followerCount || 0
                  const tier = count >= 100000 ? "Elite" : count >= 50000 ? "Pro" : count >= 10000 ? "Star" : count >= 1000 ? "Rising" : "New"
                  return (
                    <tr key={page.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {index === 0 ? <Crown className="w-5 h-5 text-primary animate-pulse" /> : <span className="font-code font-bold text-muted-foreground">#{index + 1}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-white text-sm">@{page.handle}</div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{page.creatorName}</div>
                      </td>
                      <td className="px-6 py-5 font-code text-lg md:text-2xl font-bold text-primary text-center">{(count).toLocaleString()}</td>
                      <td className="px-6 py-5">
                        <Badge variant="outline" className={`text-[8px] font-black uppercase ${tier === 'Elite' ? 'border-primary text-primary' : 'border-white/10 text-muted-foreground'}`}>{tier}</Badge>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link href={`/fanpage/${page.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold hover:text-primary uppercase tracking-widest">Details</Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center italic text-muted-foreground text-sm uppercase font-bold opacity-30">
                    No registry matches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
