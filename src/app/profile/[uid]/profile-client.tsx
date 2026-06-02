"use client"

import { useFirestore, useUser, useCollection } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Instagram, Award, CircleCheck, Clock, XCircle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useMemoFirebase } from "@/firebase/firestore/use-memo-firebase"

export function UserProfileClient({ uid }: { uid: string }) {
  const db = useFirestore()
  const { user } = useUser()

  const userRegsQuery = useMemoFirebase(() => {
    if (!db || !uid) return null
    return query(collection(db, "registrations"), where("userId", "==", uid as string))
  }, [db, uid])

  const { data: userRegs, loading } = useCollection<any>(userRegsQuery)

  if (loading) {
    return <div className="container mx-auto py-20 text-center text-muted-foreground">Syncing cloud profile...</div>
  }

  const isOwner = user?.uid === uid

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-5xl">
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary text-3xl font-bold">
          {user?.displayName?.[0] || "U"}
        </div>
        <div>
          <h1 className="text-4xl font-headline font-bold mb-2">{user?.displayName || "Creator Profile"}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Verified Creator Hub Member • {userRegs?.length || 0} Registrations Found
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-2xl font-headline font-bold">Verified Fan Pages</h2>
          {userRegs && userRegs.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {userRegs.map((reg: any) => (
                <div key={reg.id} className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                      <Instagram className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">@{reg.handle}</h3>
                      <p className="text-sm text-muted-foreground">{reg.creatorName}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center sm:items-end gap-2">
                    <div className="flex items-center gap-2">
                      {reg.status === "approved" && (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                          <CircleCheck className="w-3 h-3" /> APPROVED
                        </span>
                      )}
                      {reg.status === "pending" && (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                          <Clock className="w-3 h-3" /> PENDING
                        </span>
                      )}
                      {reg.status === "rejected" && (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded">
                          <XCircle className="w-3 h-3" /> REJECTED
                        </span>
                      )}
                    </div>
                    <Link href={`/fanpage/${reg.id}`}>
                      <Button variant="link" className="text-secondary p-0 h-auto font-bold text-xs uppercase">
                        Public Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center border-dashed border-white/10">
              <p className="text-muted-foreground mb-6">No cloud-synced fan pages found.</p>
              {isOwner && (
                <Link href="/register">
                  <Button className="bg-primary text-black font-bold">Register Now</Button>
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-sm text-muted-foreground">Combined Reach</span>
                <span className="font-code font-bold text-secondary">
                  {userRegs?.reduce((acc: number, p: any) => acc + (p.followerCount || 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-sm text-muted-foreground">Milestones</span>
                <span className="flex items-center gap-1 text-green-400 font-bold">
                  <TrendingUp className="w-4 h-4" /> Global Verified
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
