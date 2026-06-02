
"use client"

import { useState, useEffect } from "react"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShieldAlert, Users, Wallet, RefreshCw, Loader2, FileText, LayoutDashboard, Eye, Heart, X, Flame, Star, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { doc, updateDoc, collection, query, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore"
import { useMemoFirebase } from "@/firebase/firestore/use-memo-firebase"

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const [editingReg, setEditingReg] = useState<any>(null)
  const [viewingCreator, setViewingCreator] = useState<any>(null)
  const [folUpdateValue, setFolUpdateValue] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)

  const regsQuery = useMemoFirebase(() => db ? query(collection(db, "registrations"), orderBy("createdAt", "desc"), limit(100)) : null, [db])
  const subsQuery = useMemoFirebase(() => db ? query(collection(db, "submissions"), orderBy("views", "desc"), limit(100)) : null, [db])
  const payoutsQuery = useMemoFirebase(() => db ? query(collection(db, "payouts"), orderBy("createdAt", "desc"), limit(100)) : null, [db])
  const logsQuery = useMemoFirebase(() => db ? query(collection(db, "admin_logs"), orderBy("timestamp", "desc"), limit(50)) : null, [db])

  const { data: registrations, loading: regsLoading } = useCollection<any>(regsQuery)
  const { data: submissions } = useCollection<any>(subsQuery)
  const { data: payouts } = useCollection<any>(payoutsQuery)
  const { data: logs } = useCollection<any>(logsQuery)

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) router.push("/")
  }, [user, authLoading, router])

  const handleUpdateReg = () => {
    if (!editingReg || !db) return
    setIsProcessing(true)
    const updateData = { followerCount: parseInt(folUpdateValue) || 0 }
    const docRef = doc(db, "registrations", editingReg.id)
    
    updateDoc(docRef, updateData)
      .then(() => {
        toast({ title: "Cloud Stats Updated" })
        setEditingReg(null)
      })
      .finally(() => setIsProcessing(false))
  }

  if (authLoading || !user?.isAdmin) return <div className="container mx-auto py-32 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin" /> Verifying Credentials...</div>

  return (
    <div className="container mx-auto px-4 py-8 md:py-20 max-w-7xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 text-center md:text-left">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-headline font-bold">Admin Panel</h1>
            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-widest">Unified Registry Control</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="submissions" className="space-y-8">
        <TabsList className="bg-white/5 border border-white/10 p-1 flex">
          <TabsTrigger value="submissions" className="flex-1 gap-2 text-xs font-bold uppercase"><Flame className="w-3 h-3" /> Top Submissions</TabsTrigger>
          <TabsTrigger value="registrations" className="flex-1 gap-2 text-xs font-bold uppercase"><Users className="w-3 h-3" /> Members</TabsTrigger>
          <TabsTrigger value="payouts" className="flex-1 gap-2 text-xs font-bold uppercase"><Wallet className="w-3 h-3" /> Payouts</TabsTrigger>
          <TabsTrigger value="logs" className="flex-1 gap-2 text-xs font-bold uppercase"><FileText className="w-3 h-3" /> Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader className="bg-white/5">
                  <TableRow><TableHead>Rank</TableHead><TableHead>Creator</TableHead><TableHead>Views</TableHead><TableHead>Likes</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {submissions?.map((entry: any, i: number) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-code font-bold">#{i + 1}</TableCell>
                      <TableCell className="font-bold">@{entry.instagramHandle}</TableCell>
                      <TableCell className="font-code text-secondary">{(entry.views || 0).toLocaleString()}</TableCell>
                      <TableCell className="font-code">{(entry.likes || 0).toLocaleString()}</TableCell>
                      <td className="text-right">
                        <Button variant="ghost" size="sm" asChild><a href={entry.reelUrl} target="_blank"><Eye className="w-3 h-3" /></a></Button>
                      </td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="registrations">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader className="bg-white/5">
                  <TableRow><TableHead>Handle</TableHead><TableHead>Followers</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {regsLoading ? <TableRow><TableCell colSpan={3} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> : registrations?.map((reg: any) => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-bold">@{reg.handle}</TableCell>
                      <TableCell className="font-code">{(reg.followerCount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button size="sm" className="bg-primary text-black font-bold text-[10px]" onClick={() => setViewingCreator(reg)}>INSPECT</Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => { setEditingReg(reg); setFolUpdateValue(reg.followerCount.toString()); }}><RefreshCw className="w-3 h-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingReg} onOpenChange={o => !o && setEditingReg(null)}>
        <DialogContent className="glass-card bg-[#131314] max-w-sm">
           <DialogHeader>
             <DialogTitle className="text-xl font-headline font-bold text-primary">Update Followers</DialogTitle>
           </DialogHeader>
           <div className="py-4 space-y-4">
              <div className="space-y-2">
                 <Label>Follower Count</Label>
                 <Input type="number" value={folUpdateValue} onChange={e => setFolUpdateValue(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
           </div>
           <DialogFooter>
              <Button onClick={handleUpdateReg} disabled={isProcessing} className="w-full bg-primary text-black font-bold">
                 {isProcessing ? <Loader2 className="animate-spin" /> : "Sync to Cloud"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
