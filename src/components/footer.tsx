"use client"

import { useState, useEffect } from "react"
import { AdminAccessModal } from "./admin-access-modal"
import Link from "next/link"

export function Footer() {
  const [clickCount, setClickCount] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)
  const [showModal, setShowModal] = useState(false)

  const handleTriggerClick = () => {
    const now = Date.now()
    if (now - lastClickTime < 2000) {
      const newCount = clickCount + 1
      setClickCount(newCount)
      if (newCount >= 5) {
        setShowModal(true)
        setClickCount(0)
      }
    } else {
      setClickCount(1)
    }
    setLastClickTime(now)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setClickCount(0)
    }, 3000)
    return () => clearTimeout(timer)
  }, [lastClickTime])

  return (
    <footer className="w-full py-12 border-t border-white/5 bg-black/20 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
          <div className="text-center md:text-left">
            <h3 className="font-headline font-bold text-primary mb-2 uppercase tracking-tighter">Aryan Gold FanHub</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Empowering Trading Content Creators</p>
          </div>
          
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/rules" className="hover:text-primary transition-colors">Rules</Link>
            <Link href="/leaderboard" className="hover:text-primary transition-colors">Rankings</Link>
            <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
            <a href="mailto:noims108a@gmail.com" className="hover:text-primary transition-colors">Email</a>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <button 
            onClick={handleTriggerClick}
            className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors uppercase tracking-widest font-bold"
          >
            © Aryan Gold FanHub
          </button>
          <p className="text-[8px] text-muted-foreground/30 uppercase tracking-widest">Verification Status: Cloud Synchronized</p>
        </div>
      </div>
      <AdminAccessModal open={showModal} onOpenChange={setShowModal} />
    </footer>
  )
}