"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useUser, useFirestore } from "@/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut, LayoutDashboard, Wallet, ChevronDown, LogIn, ShieldAlert, Loader2, Star, Headset, FileVideo, ShieldCheck, Settings, Gavel } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export function Navbar() {
  const { user } = useUser()
  const db = useFirestore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginData, setLoginData] = useState({ handle: "" })
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const handleTrigger = () => setShowLoginDialog(true);
    window.addEventListener('trigger-login-dialog', handleTrigger);
    return () => window.removeEventListener('trigger-login-dialog', handleTrigger);
  }, []);

  const handleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return

    setIsLoggingIn(true)
    const handle = loginData.handle.replace('@', '').toLowerCase().trim()
    
    try {
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("handle", "==", handle))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        toast({ 
          variant: "destructive", 
          title: "ID Not Found", 
          description: "Please register your fan page first to create your permanent cloud profile." 
        })
      } else {
        const userData = snapshot.docs[0].data()
        localStorage.setItem('mock_user', JSON.stringify(userData))
        window.dispatchEvent(new Event('mock-auth-change'))
        setShowLoginDialog(false)
        setLoginData({ handle: "" })
        toast({ title: "Welcome back!", description: `Successfully synced @${handle}` })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Cloud database sync failed." })
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('mock_user')
    localStorage.removeItem('isAdmin')
    window.dispatchEvent(new Event('mock-auth-change'))
    toast({ title: "Signed out", description: "Session cleared." })
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#131314]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-headline text-base md:text-xl font-bold gold-gradient-text tracking-tight uppercase">Aryan Gold Hub</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Home</Link>
            <Link href="/rules" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Gavel className="w-3.5 h-3.5" /> Rules
            </Link>
            <Link href="/leaderboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Rankings</Link>
            <Link href="/competition" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Weekly War</Link>
            <Link href="/content-vault" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <FileVideo className="w-3.5 h-3.5" /> Content Vault
            </Link>
            <Link href="/support" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Headset className="w-3.5 h-3.5" /> Support
            </Link>
            
            {user ? (
              <div className="flex items-center gap-2">
                {(user.isAdmin || (user as any).role === 'admin') && (
                  <Badge className="bg-primary/20 text-primary border-primary flex items-center gap-1 text-[10px] font-bold px-2 py-0.5">
                    <ShieldCheck className="w-3 h-3" /> ADMIN
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-full hover:bg-white/5 border border-white/5 transition-all">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                        {user.handle?.[0] || 'U'}
                      </div>
                      <span className="text-xs font-bold text-secondary">@{user.handle}</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-card w-56 border-white/10 text-white mt-2">
                    <DropdownMenuLabel className="uppercase text-[10px] tracking-widest text-muted-foreground">Member: {user.uid}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <Link href="/dashboard"><DropdownMenuItem className="cursor-pointer"><LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard</DropdownMenuItem></Link>
                    <Link href="/payout"><DropdownMenuItem className="cursor-pointer"><Wallet className="w-4 h-4 mr-2" /> My Earnings</DropdownMenuItem></Link>
                    {(user.isAdmin || (user as any).role === 'admin') && (
                      <>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <Link href="/admin-dashboard"><DropdownMenuItem className="cursor-pointer text-primary font-bold"><Settings className="w-4 h-4 mr-2" /> Admin Dashboard</DropdownMenuItem></Link>
                      </>
                    )}
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-400 cursor-pointer font-bold"><LogOut className="w-4 h-4 mr-2" /> Log Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button size="sm" variant="ghost" onClick={() => setShowLoginDialog(true)} className="text-xs font-bold uppercase hover:text-primary">
                  Login
                </Button>
                <Link href="/register">
                  <Button size="sm" className="neon-gold bg-primary text-black font-bold h-9 uppercase text-[10px] tracking-widest">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <button className="md:hidden text-muted-foreground p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-[#131314] border-b border-white/10 py-8 px-6 flex flex-col gap-6 animate-in slide-in-from-top duration-300">
            <Link href="/" className="text-xl font-headline font-bold" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link href="/rules" className="text-xl font-headline font-bold" onClick={() => setIsMobileMenuOpen(false)}>Official Rules</Link>
            <Link href="/leaderboard" className="text-xl font-headline font-bold" onClick={() => setIsMobileMenuOpen(false)}>Rankings</Link>
            <Link href="/competition" className="text-xl font-headline font-bold" onClick={() => setIsMobileMenuOpen(false)}>Weekly War</Link>
            <Link href="/content-vault" className="text-xl font-headline font-bold" onClick={() => setIsMobileMenuOpen(false)}>Content Vault</Link>
            <Link href="/support" className="text-xl font-headline font-bold" onClick={() => setIsMobileMenuOpen(false)}>Support Center</Link>
            
            {user ? (
              <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
                <Link href="/dashboard" className="text-lg font-bold text-secondary" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                {(user.isAdmin || (user as any).role === 'admin') && <Link href="/admin-dashboard" className="text-lg font-bold text-primary" onClick={() => setIsMobileMenuOpen(false)}>Admin Dashboard</Link>}
                <Link href="/payout" className="text-lg font-bold text-secondary" onClick={() => setIsMobileMenuOpen(false)}>Earnings</Link>
                <Button onClick={handleLogout} variant="outline" className="justify-start border-white/10 text-red-400 font-bold">
                  <LogOut className="w-4 h-4 mr-2" /> Log Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
                <Button onClick={() => { setShowLoginDialog(true); setIsMobileMenuOpen(false); }} className="w-full h-12 bg-white/5 text-white border-white/10 font-bold">
                  Login
                </Button>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full h-12 bg-primary text-black font-bold">Register Now</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="glass-card border-primary/20 max-w-[90vw] sm:max-w-md bg-[#131314]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold text-primary">Creator Login</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Enter your unique creator handle to access your cloud profile</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMockLogin} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Instagram Handle</Label>
              <Input placeholder="@handle" className="bg-white/5 border-white/10 h-12" required value={loginData.handle} onChange={(e) => setLoginData({...loginData, handle: e.target.value})} />
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Sync cloud data with your unique creator handle.</p>
            </div>
            <Button type="submit" disabled={isLoggingIn} className="w-full bg-primary text-black font-bold h-12 uppercase tracking-widest text-[10px]">
              {isLoggingIn ? <Loader2 className="animate-spin" /> : "Access Profile"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
