
"use client"

import { useState, useMemo } from "react"
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase"
import { collection, query, where, addDoc, serverTimestamp, orderBy, doc, limit } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Landmark, CircleCheck, Lock, ArrowUpRight, IndianRupee, Loader2, Crown, Medal, Smartphone, Plane, History, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMemoFirebase } from "@/firebase/firestore/use-memo-firebase"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { Badge } from "@/components/ui/badge"
import { FALLBACK_REWARDS } from "@/app/layout"

export default function PayoutPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [requestLoading, setRequestLoading] = useState(false)
  const [formData, setFormData] = useState({ accountDetails: "", accountHolderName: "", ifscCode: "", amount: "" })

  const cleanHandle = useMemo(() => {
    return user?.handle?.replace('@', '').toLowerCase().trim() || ""
  }, [user?.handle])

  const subsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "submissions"), orderBy("submittedAt", "desc"), limit(500))
  }, [db])
  const { data: rawSubmissions, loading: subsLoading } = useCollection<any>(subsQuery)

  const submissions = useMemo(() => {
    if (!rawSubmissions || !cleanHandle) return []
    return rawSubmissions.filter((s: any) => s.instagramHandle === cleanHandle)
  }, [rawSubmissions, cleanHandle])

  const rawPayoutsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "payouts"), orderBy("createdAt", "desc"), limit(500))
  }, [db])
  const { data: rawPayouts, loading: payoutsLoading } = useCollection<any>(rawPayoutsQuery)

  const payouts = useMemo(() => {
    if (!rawPayouts || !user?.uid) return []
    return rawPayouts.filter((p: any) => p.userId === user.uid)
  }, [rawPayouts, user?.uid])

  const regsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "registrations"), where("userId", "==", user.uid))
  }, [db, user?.uid])
  const { data: userRegs } = useCollection<any>(regsQuery)
  const mainReg = userRegs?.[0]
  const maxFollowers = mainReg?.followerCount || 0
  const isDisqualified = mainReg?.isDisqualified || false
  
  const isEligibleByFollowers = maxFollowers >= 1000 && !isDisqualified

  const cashAccrued = useMemo(() => {
    if (!isEligibleByFollowers || !submissions) return 0
    return submissions.reduce((acc: number, sub: any) => {
      const views = sub.views || 0
      if (views >= 100000) return acc + 1500
      if (views >= 50000) return acc + 500
      return acc
    }, 0)
  }, [submissions, isEligibleByFollowers])

  const totalDisbursed = useMemo(() => {
    if (!payouts) return 0
    return payouts
      .filter((p: any) => p.status === "approved" || p.status === "paid")
      .reduce((acc: number, p: any) => acc + (parseFloat(p.amount) || 0), 0)
  }, [payouts])

  const availableBalance = Math.max(0, cashAccrued - totalDisbursed)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !cleanHandle || isDisqualified) return
    
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid amount." })
      return
    }
    if (amount > availableBalance) {
      toast({ variant: "destructive", title: "Insufficient Balance", description: `Maximum withdrawal available is ₹${availableBalance.toString()}` })
      return
    }

    setRequestLoading(true)
    
    const payoutData = {
      userId: user.uid,
      instagramHandle: cleanHandle,
      accountHolderName: formData.accountHolderName,
      amount: amount,
      status: "pending",
      method: formData.ifscCode ? "Bank" : "UPI",
      accountDetails: formData.accountDetails,
      ifscCode: formData.ifscCode || null,
      createdAt: serverTimestamp()
    }
    
    const ref = collection(db, "payouts")
    addDoc(ref, payoutData)
      .then(() => {
        toast({ title: "Transfer Requested!", description: "Your request is pending verification." })
        setFormData({ accountDetails: "", accountHolderName: "", ifscCode: "", amount: "" })
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: payoutData }))
      })
      .finally(() => setRequestLoading(false))
  }

  if (authLoading || subsLoading || payoutsLoading) {
    return (
      <div className="container mx-auto py-32 text-center">
        <Loader2 className="animate-spin w-10 h-10 text-primary mx-auto mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/60">Syncing Earnings Registry...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-20 max-w-6xl">
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6 text-center md:text-left">
        <div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold">Earnings Registry</h1>
          <p className="text-sm text-muted-foreground mt-2">Authorized reward distribution via verified cloud link.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-full border border-primary/20 font-bold text-xs uppercase tracking-wider">
          <Badge className="bg-primary/20 text-primary border-primary mr-2">Cloud Verified</Badge> 3-5 Business Days
        </div>
      </div>

      {isDisqualified && (
        <div className="mb-12 glass-card border-destructive bg-destructive/10 p-6 flex items-center gap-6">
           <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
             <XCircle className="w-6 h-6 text-destructive" />
           </div>
           <div>
             <h3 className="text-lg font-headline font-bold text-destructive uppercase tracking-tight">Account Disqualified</h3>
             <p className="text-sm text-white font-bold">Withdrawals are blocked for disqualified accounts.</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-6 border-primary/10">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1 tracking-widest">Cash Accrued</p>
              <p className="text-2xl md:text-3xl font-code font-bold text-white"><IndianRupee className="w-4 h-4 inline mr-1" />{cashAccrued.toString()}</p>
            </div>
            <div className="glass-card p-6 border-white/5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1 tracking-widest">Total Disbursed</p>
              <p className="text-2xl md:text-3xl font-code font-bold text-white"><IndianRupee className="w-4 h-4 inline mr-1" />{totalDisbursed.toString()}</p>
            </div>
            <div className="glass-card p-6 border-secondary/20 bg-secondary/5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1 tracking-widest">Available Balance</p>
              <p className="text-2xl md:text-3xl font-code font-bold text-secondary"><IndianRupee className="w-4 h-4 inline mr-1" />{availableBalance.toString()}</p>
            </div>
          </div>

          {!isEligibleByFollowers && !isDisqualified && (
            <div className="glass-card p-6 border-destructive/30 bg-destructive/5 flex flex-col items-center text-center gap-4">
               <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center"><Lock className="w-6 h-6 text-destructive" /></div>
               <div>
                  <h3 className="text-lg font-bold text-white">Reel Incentives Locked</h3>
                  <p className="text-sm text-muted-foreground">You must reach 1,000 followers on your registered fan page to start accruing cash rewards from reels.</p>
               </div>
            </div>
          )}

          <div className="glass-card p-6 md:p-8 border-primary/20 bg-primary/[0.02]">
            <h2 className="text-lg md:text-xl font-headline font-bold mb-6 flex items-center gap-2"><Crown className="w-5 h-5 text-primary" /> Reward Milestones</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { tier: 1000, label: "1K Followers", icon: <Crown className="w-4 h-4 text-primary" /> },
                { tier: 10000, label: "10K Followers", icon: <Medal className="w-4 h-4 text-primary" /> },
                { tier: 50000, label: "50K Followers", icon: <Smartphone className="w-4 h-4 text-secondary" /> },
                { tier: 100000, label: "100K Followers", icon: <Plane className="w-4 h-4 text-primary" /> }
              ].map((m) => {
                const isComplete = maxFollowers >= m.tier
                return (
                  <div key={m.tier} className={`flex items-center justify-between p-4 rounded-xl border ${isComplete ? 'bg-primary/5 border-primary/30' : 'bg-white/2 border-white/5 opacity-40'}`}>
                    <div className="flex items-center gap-3">
                      {m.icon}
                      <span className="text-xs font-bold uppercase tracking-widest">{m.label}</span>
                    </div>
                    {isComplete ? <CircleCheck className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h2 className="text-lg md:text-xl font-headline font-bold">Transaction History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead className="bg-white/5 text-[10px] uppercase font-bold text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-code text-xs">
                  {payouts?.length ? payouts.map((p: any) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white">
                        {p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : "Processing..."}
                      </td>
                      <td className="px-6 py-4 text-primary font-bold">₹{(p.amount || 0).toString()}</td>
                      <td className="px-6 py-4">
                        <Badge 
                          className={`text-[8px] font-black uppercase ${
                            p.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                            p.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`} 
                          variant="outline"
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground uppercase">{p.method || 'UPI'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-muted-foreground italic text-xs uppercase opacity-40 font-bold">
                        No transactions found in cloud registry.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 md:p-8 border-primary/20 sticky top-24">
            <h3 className="text-xl font-headline font-bold mb-6 flex items-center gap-2 uppercase tracking-tight"><ArrowUpRight className="w-5 h-5 text-primary" /> Request Transfer</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Legal Name</Label>
                <Input 
                  placeholder="Recipient Name" 
                  className="bg-white/5 border-white/10 h-12" 
                  required 
                  value={formData.accountHolderName} 
                  onChange={e => setFormData({...formData, accountHolderName: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">UPI ID or Account Number</Label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-4 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. name@bank" 
                    className="pl-10 bg-white/5 border-white/10 h-12" 
                    required 
                    value={formData.accountDetails} 
                    onChange={e => setFormData({...formData, accountDetails: e.target.value})} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Amount (₹)</Label>
                  <span className="text-[9px] text-primary font-bold">Max: ₹{availableBalance.toString()}</span>
                </div>
                <Input 
                  type="number" 
                  max={availableBalance}
                  placeholder="0.00" 
                  className="bg-white/5 border-white/10 h-12 font-code font-bold text-primary text-xl" 
                  required 
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: e.target.value})} 
                />
              </div>
              <Button 
                type="submit" 
                disabled={requestLoading || availableBalance <= 0 || isDisqualified} 
                className="w-full bg-primary text-black font-bold h-14 uppercase tracking-[0.2em] text-[10px] neon-gold"
              >
                {requestLoading ? <Loader2 className="animate-spin" /> : "Authorize Payout"}
              </Button>
              {availableBalance <= 0 && (
                <p className="text-[9px] text-center text-muted-foreground uppercase tracking-wider">
                  {isDisqualified ? "Account disqualified from payouts." : (!isEligibleByFollowers ? "Reach 1,000 followers to unlock payouts." : "No balance available for withdrawal.")}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
