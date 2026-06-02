
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Lock, ShieldAlert, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminAccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminAccessModal({ open, onOpenChange }: AdminAccessModalProps) {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const { toast } = useToast()

  const ADMIN_CODE = "93463962569392846256"

  const handleUnlock = () => {
    setLoading(true)
    setError(false)

    // Small delay for effect
    setTimeout(() => {
      if (password === ADMIN_CODE) {
        localStorage.setItem("isAdmin", "true")
        window.dispatchEvent(new Event("mock-auth-change"))
        toast({
          title: "Admin Access Granted",
          description: "Administrative features are now unlocked.",
        })
        onOpenChange(false)
        setPassword("")
      } else {
        setError(true)
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "The security code entered is invalid.",
        })
      }
      setLoading(false)
    }, 800)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/30 max-w-sm bg-[#131314] p-8">
        <DialogHeader className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-headline font-bold text-white uppercase tracking-widest">Admin Access</DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground uppercase tracking-wider">
            Restricted Area. Enter Security Credentials.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="admin-pass" className="text-[10px] font-bold uppercase tracking-widest text-primary">Master Passcode</Label>
            <Input 
              id="admin-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`bg-white/5 border-white/10 text-center tracking-[0.5em] font-bold h-12 ${error ? 'border-destructive ring-1 ring-destructive' : ''}`}
              placeholder="••••••••••••"
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            {error && <p className="text-[10px] text-destructive font-bold text-center mt-2">INVALID CODE</p>}
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleUnlock}
            disabled={loading || !password}
            className="w-full bg-primary text-black font-bold h-12 neon-gold hover:scale-[1.02] transition-transform"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "AUTHENTICATE"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
