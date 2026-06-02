
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ShieldAlert, Lock, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const ADMINS = [
  { user: "admin1", pass: "aryan2024" },
  { user: "admin2", pass: "aryan2024" },
  { user: "admin3", pass: "aryan2024" },
  { user: "admin4", pass: "aryan2024" },
  { user: "admin5", pass: "aryan2024" },
]

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({ username: "", password: "" })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const admin = ADMINS.find(a => a.user === formData.username && a.pass === formData.password)

    if (admin) {
      const mockAdminUser = {
        uid: "admin-" + admin.user,
        displayName: "System Administrator",
        handle: admin.user,
        isAdmin: true
      }
      localStorage.setItem('mock_user', JSON.stringify(mockAdminUser))
      window.dispatchEvent(new Event('mock-auth-change'))
      toast({ title: "Admin Authenticated", description: "Welcome back to the command center." })
      router.push("/admin")
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Invalid admin credentials." })
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-32 flex justify-center">
      <Card className="glass-card border-destructive/20 max-w-md w-full">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2 border border-destructive/20">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-headline font-bold uppercase tracking-widest text-destructive">Secure Admin Entry</CardTitle>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Restricted Access Area</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="user">Admin ID</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="user" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="pl-10 bg-white/5 border-white/10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass">Security Passcode</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="pass" 
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="pl-10 bg-white/5 border-white/10"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-destructive text-white font-bold h-12 hover:bg-destructive/80 transition-all">
              {loading ? "Initializing..." : "Initialize Admin Session"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
