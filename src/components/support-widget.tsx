"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Headset, X, Sparkles, Mail, MessageSquare } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            className="w-14 h-14 rounded-full bg-primary text-black shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-110 transition-transform p-0 border-2 border-primary-foreground/20"
            aria-label="Support Options"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Headset className="w-6 h-6" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="glass-card w-72 p-0 border-primary/20 bg-[#131314] overflow-hidden">
          {isOpen && (
            <>
              <div className="bg-primary p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-black/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="text-sm font-bold text-black uppercase leading-tight">Hub Support</p>
                  <p className="text-[10px] text-black/70 font-bold uppercase tracking-widest">How can we help?</p>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <Link href="/support" onClick={() => setIsOpen(false)}>
                  <button className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-4 text-left group">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest">Chat with AI</p>
                      <p className="text-[10px] text-muted-foreground">Instant answers</p>
                    </div>
                  </button>
                </Link>

                <a href="mailto:noims108a@gmail.com" onClick={() => setIsOpen(false)}>
                  <button className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-4 text-left group">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-black transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest">Email Us</p>
                      <p className="text-[10px] text-muted-foreground">Team assistance</p>
                    </div>
                  </button>
                </a>
              </div>

              <div className="p-3 bg-white/5 text-center">
                <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">Powered by Aryan Gold AI</p>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}