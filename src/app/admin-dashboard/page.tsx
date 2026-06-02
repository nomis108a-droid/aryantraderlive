"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFirestore, useDoc } from "@/firebase";
import {
  collection, query, orderBy, limit, doc, updateDoc, deleteDoc,
  serverTimestamp, getDocs, getDoc, startAfter, QueryDocumentSnapshot,
  DocumentData, where, writeBatch, onSnapshot, Timestamp, setDoc
} from "firebase/firestore";
import {
  ShieldCheck, Loader2, RefreshCw, Instagram, MessageCircle, Save,
  Trash2, AlertTriangle, ExternalLink, Play, Wallet, Zap, Settings,
  Mail, Type, Link, Calendar, Check, Eye, Crown, Medal, Smartphone,
  Plane, X as CloseIcon, Award, TrendingUp, MapPin, Fingerprint, XCircle, Trophy,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ProofGallery } from "@/components/proof-gallery";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"

const CREATORS_PAGE_SIZE = 50;
const PAYOUTS_PAGE_SIZE = 50;

export default function AdminDashboard() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!db) return;

    const checkAdmin = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'users'), where('isAdmin', '==', true))
        );
        if (!snap.empty) {
          setIsAdmin(true);
          setAuthChecked(true);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Admin check error:', error);
        router.push('/');
      }
    };

    checkAdmin();
  }, [db, router]);

  const [activeTab, setActiveTab] = useState("daily-update");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [localCreators, setLocalCreators] = useState<any[]>([]);
  const [localReels, setLocalReels] = useState<any[]>([]);
  const [localPayouts, setLocalPayouts] = useState<any[]>([]);

  const [viewingCreator, setViewingCreator] = useState<any>(null);
  const [editingFollowerId, setEditingFollowerId] = useState<string | null>(null);
  const [tempFollowerValue, setTempFollowerValue] = useState<string>("");
  const [isUpdatingFollowers, setIsUpdatingFollowers] = useState(false);

  const [configSaving, setConfigSaving] = useState(false);
  const { data: profile } = useDoc<any>(db ? doc(db, "siteConfig", "traderProfile") : null);
  const { data: disclaimers } = useDoc<any>(db ? doc(db, "siteConfig", "disclaimers") : null);
  const { data: timer } = useDoc<any>(db ? doc(db, "siteConfig", "timer") : null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'reel' | 'creator', id: string, extraData?: any} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Creators pagination
  const [creatorsPage, setCreatorsPage] = useState(0);
  const [creatorsLoading, setCreatorsLoading] = useState(false);
  const [hasMoreCreators, setHasMoreCreators] = useState(false);
  const creatorCursorsRef = useRef<Record<number, QueryDocumentSnapshot<DocumentData>>>({});

  // Payouts pagination + Payout Done
  const [payoutsPage, setPayoutsPage] = useState(0);
  const [payoutDoneLoading, setPayoutDoneLoading] = useState<Record<string, boolean>>({});

  const loadCreatorsPage = useCallback(async (page: number) => {
    if (!db) return;
    setCreatorsLoading(true);
    try {
      let q;
      if (page === 0) {
        q = query(collection(db, "registrations"), orderBy("followerCount", "desc"), limit(CREATORS_PAGE_SIZE));
      } else {
        const cursor = creatorCursorsRef.current[page - 1];
        if (!cursor) return;
        q = query(collection(db, "registrations"), orderBy("followerCount", "desc"), startAfter(cursor), limit(CREATORS_PAGE_SIZE));
      }
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setLocalCreators(docs);
      setHasMoreCreators(snap.docs.length >= CREATORS_PAGE_SIZE);
      if (snap.docs.length > 0) {
        creatorCursorsRef.current[page] = snap.docs[snap.docs.length - 1];
      }
      setCreatorsPage(page);
    } catch (e) {
      toast({ variant: "destructive", title: "Load Failed", description: "Could not load creators." });
    } finally {
      setCreatorsLoading(false);
    }
  }, [db, toast]);

  useEffect(() => {
    if (!db || !isAdmin) return;
    loadCreatorsPage(0);
  }, [db, isAdmin]);

  useEffect(() => {
    if (!db || !isAdmin) return;
    const pQ = query(collection(db, "payouts"), orderBy("createdAt", "desc"), limit(500));
    const unsubPayouts = onSnapshot(pQ, (snap) => setLocalPayouts(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
    return () => unsubPayouts();
  }, [db, isAdmin]);

  useEffect(() => {
    if (!db || !isAdmin) return;
    const rQ = query(collection(db, "submissions"), orderBy("submittedAt", "desc"), limit(500));
    const unsubReels = onSnapshot(rQ, (snap) => setLocalReels(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
    return () => unsubReels();
  }, [db, isAdmin]);

  const filteredCreators = useMemo(() => {
    if (!searchQuery) return localCreators;
    const q = searchQuery.toLowerCase().replace(/^@/, '');
    return localCreators.filter(c => {
      const handle = (c.handle || "").toLowerCase();
      const name = (c.creatorName || "").toLowerCase();
      const phone = (c.phoneNumber || "").toLowerCase();
      return handle.includes(q) || name.includes(q) || phone.includes(q);
    });
  }, [localCreators, searchQuery]);

  const paginatedPayouts = useMemo(() =>
    localPayouts.slice(payoutsPage * PAYOUTS_PAGE_SIZE, (payoutsPage + 1) * PAYOUTS_PAGE_SIZE),
    [localPayouts, payoutsPage]
  );

  const dailyGroups = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(todayStart); sevenDaysAgo.setDate(todayStart.getDate() - 7);
    const tenDaysAgo = new Date(todayStart); tenDaysAgo.setDate(todayStart.getDate() - 10);
    const filtered = localReels.filter(r => r.instagramHandle?.toLowerCase().includes(searchQuery.toLowerCase().replace(/^@/, '')));
    return {
      today: filtered.filter(r => { const t = r.submittedAt?.toMillis ? r.submittedAt.toMillis() : (r.submittedAt?.seconds ? r.submittedAt.seconds * 1000 : 0); return t >= todayStart.getTime(); }),
      recent: filtered.filter(r => { const t = r.submittedAt?.toMillis ? r.submittedAt.toMillis() : (r.submittedAt?.seconds ? r.submittedAt.seconds * 1000 : 0); return t < todayStart.getTime() && t >= sevenDaysAgo.getTime(); }),
      expiring: filtered.filter(r => { const t = r.submittedAt?.toMillis ? r.submittedAt.toMillis() : (r.submittedAt?.seconds ? r.submittedAt.seconds * 1000 : 0); return t < sevenDaysAgo.getTime() && t >= tenDaysAgo.getTime(); })
    };
  }, [localReels, searchQuery]);

  const handleMetricsUpdate = async (submissionId: string, views: string, likes: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'submissions', submissionId), { views: parseInt(views) || 0, likes: parseInt(likes) || 0, lastUpdated: serverTimestamp() });
      toast({ title: "Metrics Synchronized" });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const handleFollowerUpdate = async (creatorId: string, newValue: string) => {
    if (!db) return;
    setIsUpdatingFollowers(true);
    try {
      await updateDoc(doc(db, "registrations", creatorId), { followerCount: parseInt(newValue) || 0, updatedAt: serverTimestamp() });
      toast({ title: "Saved!", description: "Follower count updated in cloud." });
      setEditingFollowerId(null);
      if (viewingCreator && viewingCreator.id === creatorId) setViewingCreator({...viewingCreator, followerCount: parseInt(newValue)});
    } catch (e) { toast({ variant: "destructive", title: "Sync Failed" }); }
    finally { setIsUpdatingFollowers(false); }
  };

  const handleDisqualification = async (creatorId: string, status: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "registrations", creatorId), { isDisqualified: status });
      toast({ title: status ? "Creator Disqualified" : "Creator Reinstated", variant: status ? "destructive" : "default" });
      if (viewingCreator && viewingCreator.id === creatorId) setViewingCreator({...viewingCreator, isDisqualified: status});
    } catch (e) { toast({ variant: "destructive", title: "Action Failed" }); }
  };

  const handlePayoutStatus = async (payoutId: string, newStatus: 'approved' | 'rejected') => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "payouts", payoutId), { status: newStatus, processedAt: serverTimestamp() });
      toast({ title: newStatus === 'approved' ? "Transfer Authorized" : "Request Rejected" });
    } catch (e) { toast({ variant: "destructive", title: "Action Failed" }); }
  };

  const handlePayoutDone = async (payoutId: string) => {
    if (!db) return;
    setPayoutDoneLoading(prev => ({ ...prev, [payoutId]: true }));
    try {
      await updateDoc(doc(db, "payouts", payoutId), { payoutDone: true, paidAt: serverTimestamp() });
      toast({ title: "Marked as Paid", description: "Payout status saved to database." });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not save payout status." });
    } finally {
      setPayoutDoneLoading(prev => ({ ...prev, [payoutId]: false }));
    }
  };

  const executeDelete = async () => {
    if (!db || !itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'reel') {
        await deleteDoc(doc(db, "submissions", itemToDelete.id));
        toast({ title: "Reel Purged" });
      } else if (itemToDelete.type === 'creator') {
        const handle = itemToDelete.extraData?.handle;
        await deleteDoc(doc(db, "registrations", itemToDelete.id));
        if (itemToDelete.extraData?.userId) await deleteDoc(doc(db, "users", itemToDelete.extraData.userId));
        const subSnap = await getDocs(query(collection(db, "submissions"), where("instagramHandle", "==", handle)));
        const batch = writeBatch(db);
        subSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        toast({ title: "Creator Registry Wiped" });
      }
    } catch (e) { toast({ variant: "destructive", title: "Action Failed" }); }
    finally { setIsDeleting(false); setItemToDelete(null); setIsDeleteDialogOpen(false); }
  };

  const updateSiteConfig = async (docId: string, data: any) => {
    if (!db) return;
    setConfigSaving(true);
    try {
      await setDoc(doc(db, "siteConfig", docId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: `Updated ${docId}` });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
    finally { setConfigSaving(false); }
  };

  const creatorProfileData = useMemo(() => {
    if (!viewingCreator) return null;
    const reels = localReels.filter(r => r.instagramHandle?.toLowerCase() === viewingCreator.handle?.toLowerCase());
    const payouts = localPayouts.filter(p => p.instagramHandle?.toLowerCase() === viewingCreator.handle?.toLowerCase());
    const followers = viewingCreator.followerCount || 0;
    const isDisqualified = viewingCreator.isDisqualified || false;
    const totalEarnings = (!isDisqualified && followers >= 1000) ? reels.reduce((acc, r) => {
      const v = r.views || 0;
      if (v >= 100000) return acc + 1500;
      if (v >= 50000) return acc + 500;
      return acc;
    }, 0) : 0;
    return { reels, payouts, totalEarnings };
  }, [viewingCreator, localReels, localPayouts]);

  const pendingPayoutsCount = localPayouts.filter(p => p.status === 'pending').length;

  if (!authChecked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', color: '#FFD700', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #FFD700', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#FFD700', fontSize: '14px' }}>Verifying access...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl">
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-4">
          <ShieldCheck className="w-12 h-12 text-primary" />
          <div>
            <h1 className="text-3xl font-headline font-bold">Admin Command</h1>
            <p className="text-[10px] text-primary uppercase font-black">Registry Synchronization Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Input placeholder="Search registry..." className="w-full bg-white/5 border-white/10 pr-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            {searchQuery && (<button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-muted-foreground hover:text-white"><CloseIcon className="w-4 h-4" /></button>)}
          </div>
          <Button variant="outline" size="icon" onClick={() => { setIsRefreshing(true); loadCreatorsPage(0).then(() => setIsRefreshing(false)); }} className="border-white/10 shrink-0">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-white/5 border border-white/10 p-1 flex overflow-x-auto no-scrollbar">
          <TabsTrigger value="daily-update" className="flex-1 py-2 text-[10px] uppercase font-bold">Daily Update</TabsTrigger>
          <TabsTrigger value="creators" className="flex-1 py-2 text-[10px] uppercase font-bold">Creators</TabsTrigger>
          <TabsTrigger value="payouts" className="flex-1 py-2 text-[10px] uppercase font-bold relative">
            Payouts {pendingPayoutsCount > 0 && <Badge className="ml-2 bg-destructive">{pendingPayoutsCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="proofs" className="flex-1 py-2 text-[10px] uppercase font-bold">Proof Mgmt</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 py-2 text-[10px] uppercase font-bold"><Settings className="w-3 h-3 mr-1" /> Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="daily-update">
          <div className="space-y-12">
            {[
              { id: 'today', title: 'Today', items: dailyGroups.today, color: 'border-primary' },
              { id: 'recent', title: 'Recent 6 Days', items: dailyGroups.recent, color: 'border-secondary' },
              { id: 'expiring', title: 'Expiring Soon', items: dailyGroups.expiring, color: 'border-destructive' }
            ].map(group => (
              <div key={group.id} className="space-y-6">
                <div className={`flex items-center gap-4 border-l-4 ${group.color} pl-4`}>
                  <h2 className="text-xl font-headline font-bold uppercase tracking-tight">{group.title} <span className="text-muted-foreground ml-2 font-code">({group.items.length})</span></h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.items.map((r, i) => (
                    <ReelAdminCard key={r.id} reel={r} index={i + 1} onUpdate={handleMetricsUpdate} onDelete={() => { setItemToDelete({type: 'reel', id: r.id}); setIsDeleteDialogOpen(true); }} />
                  ))}
                  {group.items.length === 0 && <p className="text-[10px] text-muted-foreground uppercase font-bold opacity-30 p-4">Queue Clear</p>}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="creators">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow>
                    <TableHead className="w-14 text-[10px] font-black uppercase">S.No</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Handle / Name</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Followers</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">WhatsApp</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Eligibility</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creatorsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : filteredCreators.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 italic text-muted-foreground uppercase opacity-40 font-bold">No matches found.</TableCell></TableRow>
                  ) : filteredCreators.map((c, idx) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-code text-muted-foreground text-xs">
                        {creatorsPage * CREATORS_PAGE_SIZE + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold">@{c.handle}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{c.creatorName}</div>
                      </TableCell>
                      <TableCell>
                        {editingFollowerId === c.id ? (
                          <div className="flex items-center gap-2">
                            <Input type="number" value={tempFollowerValue} onChange={e => setTempFollowerValue(e.target.value)} className="w-24 h-8 bg-white/10 border-white/20 font-code font-bold text-primary" autoFocus />
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => handleFollowerUpdate(c.id, tempFollowerValue)}><Check className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingFollowerId(null)}><CloseIcon className="w-3 h-3" /></Button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingFollowerId(c.id); setTempFollowerValue(c.followerCount?.toString() || "0"); }} className="font-code text-primary font-bold hover:underline">
                            {(c.followerCount || 0).toLocaleString()}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="font-code text-sm text-muted-foreground">
                        {c.phoneNumber || <span className="opacity-30">—</span>}
                      </TableCell>
                      <TableCell>
                        {c.isDisqualified ? (
                          <Badge variant="destructive" className="uppercase text-[8px] font-black tracking-widest">Disqualified</Badge>
                        ) : (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 uppercase text-[8px] font-black tracking-widest">Eligible</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" onClick={() => setViewingCreator(c)}><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" asChild><a href={`https://instagram.com/${c.handle}`} target="_blank"><Instagram className="w-4 h-4" /></a></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => { setItemToDelete({type: 'creator', id: c.id, extraData: c}); setIsDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-white/10">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">
                Page {creatorsPage + 1} · Showing {filteredCreators.length} creators
                {searchQuery && <span className="text-primary ml-2">(filtered on current page)</span>}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={creatorsPage === 0 || creatorsLoading}
                  onClick={() => loadCreatorsPage(creatorsPage - 1)}
                  className="text-[9px] font-bold uppercase border-white/10 h-8"
                >
                  <ChevronLeft className="w-3 h-3 mr-1" /> Prev
                </Button>
                <span className="text-[10px] font-code text-muted-foreground px-2">{creatorsPage + 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMoreCreators || creatorsLoading}
                  onClick={() => loadCreatorsPage(creatorsPage + 1)}
                  className="text-[9px] font-bold uppercase border-white/10 h-8"
                >
                  Next <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payouts">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow>
                    <TableHead className="w-14 text-[10px] font-black uppercase">S.No</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Creator</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Account</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Amount</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Payout</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPayouts.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-20 italic text-muted-foreground uppercase opacity-40 font-bold">No payouts found.</TableCell></TableRow>
                  ) : paginatedPayouts.map((p, idx) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-code text-muted-foreground text-xs">
                        {payoutsPage * PAYOUTS_PAGE_SIZE + idx + 1}
                      </TableCell>
                      <TableCell className="font-bold">@{p.instagramHandle}</TableCell>
                      <TableCell className="text-xs font-code text-muted-foreground">{p.accountDetails}</TableCell>
                      <TableCell className="text-secondary font-bold">₹{p.amount?.toString()}</TableCell>
                      <TableCell><Badge className="uppercase text-[8px]">{p.status}</Badge></TableCell>
                      <TableCell>
                        {p.payoutDone ? (
                          <Button size="sm" disabled className="bg-green-500/20 text-green-400 border border-green-500/30 text-[9px] font-black uppercase cursor-not-allowed h-8 px-3">
                            Done ✓
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-primary text-black text-[9px] font-black uppercase h-8 px-3 hover:bg-primary/80"
                            disabled={!!payoutDoneLoading[p.id]}
                            onClick={() => handlePayoutDone(p.id)}
                          >
                            {payoutDoneLoading[p.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : "Payout Done"}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" className="bg-green-500 text-white text-[9px] font-bold uppercase" onClick={() => handlePayoutStatus(p.id, 'approved')}>Approve</Button>
                            <Button size="sm" variant="destructive" className="text-[9px] font-bold uppercase" onClick={() => handlePayoutStatus(p.id, 'rejected')}>Reject</Button>
                          </div>
                        )}
                        {p.status !== 'pending' && (
                          <span className="text-[8px] text-muted-foreground uppercase font-black">Settled</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-white/10">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">
                Page {payoutsPage + 1} · {localPayouts.length} total payouts
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={payoutsPage === 0}
                  onClick={() => setPayoutsPage(p => p - 1)}
                  className="text-[9px] font-bold uppercase border-white/10 h-8"
                >
                  <ChevronLeft className="w-3 h-3 mr-1" /> Prev
                </Button>
                <span className="text-[10px] font-code text-muted-foreground px-2">{payoutsPage + 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(payoutsPage + 1) * PAYOUTS_PAGE_SIZE >= localPayouts.length}
                  onClick={() => setPayoutsPage(p => p + 1)}
                  className="text-[9px] font-bold uppercase border-white/10 h-8"
                >
                  Next <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="proofs">
          <ProofGallery />
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-6 space-y-6">
              <h3 className="font-headline font-bold text-xl flex items-center gap-2 text-primary"><Zap className="w-5 h-5" /> Trader Profile</h3>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Bio Text</Label><Textarea defaultValue={profile?.bio} id="profile-bio" className="bg-white/5 border-white/10" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Instagram</Label><Input defaultValue={profile?.instagramURL} id="profile-ig" className="bg-white/5 border-white/10" /></div>
                  <div className="space-y-2"><Label>YouTube</Label><Input defaultValue={profile?.youtubeURL} id="profile-yt" className="bg-white/5 border-white/10" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telegram</Label>
                    <Input defaultValue={profile?.telegramURL} id="profile-tg" placeholder="https://t.me/yourusername" className="bg-white/5 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input defaultValue={profile?.whatsappURL} id="profile-wa" placeholder="https://wa.me/91XXXXXXXXXX" className="bg-white/5 border-white/10" />
                  </div>
                </div>
                <Button disabled={configSaving} className="w-full bg-primary text-black font-bold" onClick={() => {
                  const bio = (document.getElementById('profile-bio') as HTMLTextAreaElement).value;
                  const instagramURL = (document.getElementById('profile-ig') as HTMLInputElement).value;
                  const youtubeURL = (document.getElementById('profile-yt') as HTMLInputElement).value;
                  const telegramURL = (document.getElementById('profile-tg') as HTMLInputElement).value;
                  const whatsappURL = (document.getElementById('profile-wa') as HTMLInputElement).value;
                  updateSiteConfig("traderProfile", { bio, instagramURL, youtubeURL, telegramURL, whatsappURL });
                }}>
                  {configSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Sync Profile
                </Button>
              </div>
            </div>
            <div className="glass-card p-6 space-y-6">
              <h3 className="font-headline font-bold text-xl flex items-center gap-2 text-secondary"><Type className="w-5 h-5" /> Cloud Disclaimers</h3>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Weekly War Banner</Label><Textarea defaultValue={disclaimers?.weeklyWar} id="disc-war" className="bg-white/5 border-white/10 text-xs" /></div>
                <div className="space-y-2"><Label>Rankings Banner</Label><Textarea defaultValue={disclaimers?.rankings} id="disc-rank" className="bg-white/5 border-white/10 text-xs" /></div>
                <Button disabled={configSaving} variant="secondary" className="w-full font-bold" onClick={() => {
                  const weeklyWar = (document.getElementById('disc-war') as HTMLTextAreaElement).value;
                  const rankings = (document.getElementById('disc-rank') as HTMLTextAreaElement).value;
                  updateSiteConfig("disclaimers", { weeklyWar, rankings });
                }}>Sync Disclaimers</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewingCreator} onOpenChange={o => !o && setViewingCreator(null)}>
        <DialogContent className="max-w-4xl bg-[#131314] border-white/10 p-0 overflow-hidden outline-none">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Creator Inspection: {viewingCreator?.handle}</DialogTitle>
              <DialogDescription>Detailed audit of creator submissions, payouts, and verified stats.</DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <DialogTitle className="hidden">Creator Details</DialogTitle>
          {viewingCreator && creatorProfileData && (
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="bg-primary p-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-black/20 flex items-center justify-center text-4xl font-bold text-black border-2 border-black/10 uppercase">{viewingCreator.handle?.[0]}</div>
                  <div>
                    <h2 className="text-3xl font-headline font-black text-black uppercase tracking-tight">@{viewingCreator.handle}</h2>
                    <p className="text-black/60 font-bold uppercase text-[10px] tracking-widest">{viewingCreator.creatorName}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p className="text-[10px] text-black/40 uppercase font-black tracking-[0.2em] mb-1">Total Verified Earnings</p>
                  <p className="text-4xl font-code font-black text-black">₹{creatorProfileData.totalEarnings.toLocaleString()}</p>
                  {viewingCreator.isDisqualified && <Badge variant="destructive" className="bg-black text-destructive border-destructive font-black">DISQUALIFIED</Badge>}
                </div>
              </div>
              <div className="p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="glass-card p-4 space-y-1"><p className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-2"><MapPin className="w-3 h-3" /> Location</p><p className="font-bold text-sm">{viewingCreator.cityState || 'Global Hub'}</p></div>
                  <div className="glass-card p-4 space-y-1"><p className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-2"><MessageCircle className="w-3 h-3" /> WhatsApp</p><p className="font-bold text-sm">{viewingCreator.phoneNumber || 'N/A'}</p></div>
                  <div className="glass-card p-4 space-y-1"><p className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-2"><Fingerprint className="w-3 h-3" /> Registry ID</p><p className="font-code text-[10px] text-primary font-bold uppercase">{viewingCreator.userId}</p></div>
                  <div className="glass-card p-4 space-y-1 flex flex-col justify-center">
                    <Button variant={viewingCreator.isDisqualified ? "default" : "destructive"} className="h-full w-full uppercase font-black text-[10px]" onClick={() => handleDisqualification(viewingCreator.id, !viewingCreator.isDisqualified)}>
                      {viewingCreator.isDisqualified ? <Check className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                      {viewingCreator.isDisqualified ? "Reinstate" : "Disqualify"}
                    </Button>
                  </div>
                </div>
                <div className="glass-card p-6 border-primary/20 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline font-bold flex items-center gap-2 text-primary uppercase text-sm"><TrendingUp className="w-4 h-4" /> Growth Verification</h3>
                    <div className="flex items-center gap-3">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Adjust Count:</Label>
                      <Input type="number" defaultValue={viewingCreator.followerCount} className="w-24 h-8 bg-white/5 border-white/10 font-code font-bold text-primary" onKeyDown={e => { if (e.key === 'Enter') handleFollowerUpdate(viewingCreator.id, (e.target as HTMLInputElement).value); }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span>{(viewingCreator.followerCount || 0).toLocaleString()} Followers</span>
                      <span className="text-primary">Next: {viewingCreator.followerCount < 1000 ? '1K' : viewingCreator.followerCount < 10000 ? '10K' : viewingCreator.followerCount < 50000 ? '50K' : '100K'}</span>
                    </div>
                    <Progress value={Math.min((viewingCreator.followerCount / (viewingCreator.followerCount < 1000 ? 1000 : viewingCreator.followerCount < 10000 ? 10000 : 50000)) * 100, 100)} className="h-2 bg-white/5" />
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="font-headline font-bold flex items-center gap-2 border-l-4 border-secondary pl-4 uppercase text-sm"><Play className="w-4 h-4 text-secondary" /> Submission Registry</h3>
                  <div className="glass-card overflow-hidden">
                    <Table>
                      <TableHeader className="bg-white/5"><TableRow><TableHead className="text-[9px] uppercase font-bold">Entry</TableHead><TableHead className="text-[9px] uppercase font-bold">Views</TableHead><TableHead className="text-[9px] uppercase font-bold">Bonus</TableHead><TableHead className="text-right text-[9px] uppercase font-bold">Action</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {creatorProfileData.reels.map((r, i) => {
                          const bonus = (!viewingCreator.isDisqualified && viewingCreator.followerCount >= 1000) ? (r.views >= 100000 ? 1500 : r.views >= 50000 ? 500 : 0) : 0;
                          return (
                            <TableRow key={r.id}>
                              <TableCell className="text-[10px] font-bold">#{creatorProfileData.reels.length - i}</TableCell>
                              <TableCell className="font-code text-white">{(r.views || 0).toLocaleString()}</TableCell>
                              <TableCell className={`font-code font-bold ${bonus > 0 ? 'text-primary' : 'text-muted-foreground opacity-30'}`}>₹{bonus}</TableCell>
                              <TableCell className="text-right"><Button size="sm" variant="ghost" className="h-7 text-[8px] font-bold uppercase tracking-widest" asChild><a href={r.reelUrl} target="_blank">Open <ExternalLink className="w-3 h-3 ml-1" /></a></Button></TableCell>
                            </TableRow>
                          )
                        })}
                        {creatorProfileData.reels.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 italic text-muted-foreground text-[10px]">No reels submitted.</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="font-headline font-bold flex items-center gap-2 border-l-4 border-destructive pl-4 uppercase text-sm"><Wallet className="w-4 h-4 text-destructive" /> Payout Audit</h3>
                  <div className="glass-card overflow-hidden">
                    <Table>
                      <TableHeader className="bg-white/5"><TableRow><TableHead className="text-[9px] uppercase font-bold">Date</TableHead><TableHead className="text-[9px] uppercase font-bold">Amount</TableHead><TableHead className="text-[9px] uppercase font-bold">Status</TableHead><TableHead className="text-right text-[9px] uppercase font-bold">Action</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {creatorProfileData.payouts.map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="text-[10px] text-muted-foreground">{p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : 'Pending...'}</TableCell>
                            <TableCell className="font-code font-bold text-secondary">₹{p.amount}</TableCell>
                            <TableCell><Badge className="text-[8px] font-black uppercase tracking-widest">{p.status}</Badge></TableCell>
                            <TableCell className="text-right">
                              {p.status === 'pending' ? (
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" className="bg-green-500 h-7 text-[8px] font-bold" onClick={() => handlePayoutStatus(p.id, 'approved')}>Auth</Button>
                                  <Button size="sm" variant="destructive" className="h-7 text-[8px] font-bold" onClick={() => handlePayoutStatus(p.id, 'rejected')}>Deny</Button>
                                </div>
                              ) : <span className="text-[8px] text-muted-foreground uppercase font-black">Settled</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                        {creatorProfileData.payouts.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 italic text-muted-foreground text-[10px]">No transaction history.</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="glass-card bg-[#131314] max-w-sm border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-destructive font-headline font-bold uppercase">Critical Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">Permanent cloud record removal authorized.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel asChild><Button variant="ghost" disabled={isDeleting} className="text-[10px] font-bold uppercase">Cancel</Button></AlertDialogCancel>
            <AlertDialogAction asChild><Button variant="destructive" onClick={executeDelete} disabled={isDeleting} className="text-[10px] font-bold uppercase">{isDeleting ? <Loader2 className="animate-spin" /> : "Authorize Purge"}</Button></AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ReelAdminCard({ reel, index, onUpdate, onDelete }: { reel: any, index: number, onUpdate: (id: string, v: string, l: string) => Promise<void>, onDelete: () => void }) {
  const [v, setV] = useState(reel.views?.toString() || "0");
  const [l, setL] = useState(reel.likes?.toString() || "0");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(reel.id, v, l);
    setSaving(false);
  };

  return (
    <div className="glass-card overflow-hidden border-white/10 relative group flex flex-col h-full">
      <div className="relative aspect-video w-full bg-black/40 overflow-hidden">
        {reel.thumbnailUrl ? <img src={reel.thumbnailUrl} className="w-full h-full object-cover opacity-80" /> : <div className="w-full h-full flex items-center justify-center bg-black/60"><Play className="w-10 h-10 text-white/20" /></div>}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <Badge className="bg-primary text-black font-black uppercase text-[10px] px-2 py-0.5">Entry #{index}</Badge>
          <Badge variant="outline" className="bg-black/60 text-[8px] uppercase font-bold text-white">{reel.submittedAt?.seconds ? new Date(reel.submittedAt.seconds * 1000).toLocaleDateString() : 'New'}</Badge>
        </div>
        <div className="absolute top-2 right-2 flex gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive bg-black/40 hover:bg-destructive/80 transition-all rounded-full" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
      <div className="p-5 space-y-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-primary">@{reel.instagramHandle}</p>
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 italic">"{reel.description || 'Verified Creator Submission'}"</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest border-white/10" asChild><a href={reel.reelUrl} target="_blank">View <ExternalLink className="w-3 h-3 ml-1" /></a></Button>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-muted-foreground">Views</Label><input type="number" value={v} onChange={e => setV(e.target.value)} className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm font-code font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary" /></div>
          <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-muted-foreground">Likes</Label><input type="number" value={l} onChange={e => setL(e.target.value)} className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm font-code font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary" /></div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-black font-bold h-10 uppercase tracking-widest text-[10px] shadow-lg">
          {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4 mr-2" />} Sync Metrics
        </Button>
      </div>
    </div>
  );
}
