
"use client"

import { Shield, ShieldAlert, Eye, Info, Coins, CheckCircle, TrendingUp, Clock, ArrowRight, Mail, Skull, Ban } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function RulesPage() {
  const rules = [
    {
      id: 1,
      title: "Following Limit Rule 🔒",
      description: "Your Instagram fan page must follow maximum 50 accounts only. If you are following more than 50 accounts please unfollow the extra accounts first. Views will only be updated for fan pages following 50 or fewer accounts. Fan pages with more than 50 following will not receive any prize or views update.",
      icon: <ShieldAlert className="w-8 h-8 text-destructive" />,
      variant: "destructive",
      style: "border-destructive/40 shadow-[0_0_20px_rgba(255,0,0,0.15)] bg-destructive/5"
    },
    {
      id: 2,
      title: "View Count Visibility Rule 👁️",
      description: "Make sure the Hide View Count option on your Instagram reel is turned OFF. Go to your reel settings and check that view counts are visible to everyone. Only reels with visible view counts will be verified and updated by our admin team. If view count is hidden your reel will not be counted.",
      icon: <Eye className="w-8 h-8 text-primary" />,
      variant: "gold",
      style: "border-primary/40 shadow-[0_0_20px_rgba(255,215,0,0.15)] bg-primary/5"
    },
    {
      id: 3,
      title: "Cash Incentives Eligibility Rule 💰",
      description: "To be eligible for Cash Incentives you must first reach 1,000 followers on your Instagram fan page. Only after crossing 1,000 followers your reel submissions will be counted for cash prizes. Important rules: Step 1 - First grow your fan page to 1,000 followers. Step 2 - After reaching 1,000 followers you become eligible for cash incentives. Step 3 - Only reels submitted AFTER crossing 1,000 followers will count for prizes. Reels submitted before reaching 1,000 followers will NOT be counted for any cash prize even if they get high views later. Cash Prize Structure: 50,000 views on an eligible reel = ₹500 cash. 1,00,000 views on an eligible reel = ₹1,500 cash. Note: Views are updated daily between 3:00 PM to 5:00 PM IST by our admin team.",
      icon: <Coins className="w-8 h-8 text-primary" />,
      variant: "gold",
      style: "border-primary/40 shadow-[0_0_20px_rgba(255,215,0,0.15)] bg-primary/5 md:col-span-2",
      checklist: [
        "1000+ followers achieved",
        "Reel submitted after 1000 followers",
        "View count visible on reel"
      ]
    },
    {
      id: 4,
      title: "How Prize Payment Works 📊",
      description: "Our team updates your reel views daily between 3:00 PM – 5:00 PM IST for the first 7 days after you submit your reel. During these 7 days if your reel crosses 50,000 views or 1,00,000 views our team will automatically process your prize and contact you on your registered WhatsApp number — you do not need to do anything. After 7 days your reel moves to Previous Entries section. If your reel crossed 50,000 views or 1,00,000 views during the 7 days but you did not receive your prize — send your reel link and a screenshot of your views as proof to noims108a@gmail.com and our team will verify and process your payment. Prize Structure: 50,000 views = ₹500 cash. 1,00,000 views = ₹1,500 cash. Prizes are sent directly to your UPI within 3 working days after verification.",
      icon: <TrendingUp className="w-8 h-8 text-secondary" />,
      variant: "secondary",
      style: "border-secondary/40 shadow-[0_0_20px_rgba(0,238,252,0.15)] bg-secondary/5 md:col-span-2",
      timeline: [
        { label: "Day 1-7", desc: "Views Tracked" },
        { label: "Threshold", desc: "Prize Crossed" },
        { label: "WhatsApp", desc: "Team Contacts" },
        { label: "3 Days", desc: "UPI Payment" }
      ],
      emailAction: true
    },
    {
      id: 5,
      title: "Zero Tolerance for Fake Activity 🚫",
      description: "STRICT RULE - NO FAKE FOLLOWERS OR FAKE VIEWS ALLOWED. If our admin team detects that your Instagram fan page has fake followers or fake views on any reel: 1) You will NOT receive any cash prize for that reel. 2) Your account will be PERMANENTLY TERMINATED from Aryan Gold FanHub. 3) All your earned rewards will be cancelled immediately. 4) You will be banned from re-registering on this platform forever. Our team manually verifies every reel before processing any payment. We check for suspicious view patterns, bot activity, and fake engagement. Any creator found using third party apps to boost views or followers will be immediately disqualified and permanently banned. ⚠️ Warning: Buying followers or views is a violation of Instagram Terms of Service and our platform rules. Play fair and win real prizes!",
      icon: <Skull className="w-8 h-8 text-destructive" />,
      variant: "destructive",
      specialBadge: "ZERO TOLERANCE",
      style: "border-destructive/60 shadow-[0_0_30px_rgba(255,0,0,0.25)] bg-destructive/10 md:col-span-2"
    }
  ]

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-5xl">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-[0.3em] mb-6">
          <Shield className="w-5 h-5" /> Official Protocol
        </div>
        <h1 className="font-headline text-4xl md:text-7xl font-bold mb-6 tracking-tight">
          OFFICIAL <span className="gold-gradient-text">RULES</span> & GUIDELINES
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          To maintain the integrity of the Aryan Gold Network and ensure fair reward distribution, all creators must adhere to these verified hub regulations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {rules.map((rule) => (
          <div 
            key={rule.id} 
            className={`glass-card p-8 md:p-10 flex flex-col items-start gap-6 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${rule.style}`}
          >
            <div className="absolute -top-4 -right-4 w-32 h-32 opacity-10 bg-current rounded-full blur-3xl" />
            
            <div className="flex items-center justify-between w-full">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                {rule.icon}
              </div>
              <Badge className={`uppercase font-black text-[10px] tracking-widest px-4 py-1 ${
                rule.variant === 'destructive' ? 'bg-destructive text-white' : 
                rule.variant === 'secondary' ? 'bg-secondary text-black shadow-[0_0_10px_#00EEFC]' :
                'bg-primary text-black shadow-[0_0_10px_#FFD700]'
              }`}>
                {rule.specialBadge || `Rule ${rule.id}`}
              </Badge>
            </div>

            <div className="space-y-6 w-full">
              <h3 className="text-2xl font-headline font-bold text-white uppercase tracking-tight">{rule.title}</h3>
              <div className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed italic border-l-2 border-white/10 pl-4">
                {rule.description}
              </div>

              {rule.checklist && (
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {rule.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-[10px] font-black uppercase text-white leading-tight tracking-wider">{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {rule.timeline && (
                <div className="pt-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
                    <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 hidden md:block" />
                    {rule.timeline.map((step, idx) => (
                      <div key={idx} className="relative z-10 flex flex-col items-center gap-2 text-center group/step w-full md:w-auto">
                        <div className="w-10 h-10 rounded-full bg-[#131314] border-2 border-secondary flex items-center justify-center text-[10px] font-black text-secondary group-hover/step:bg-secondary group-hover/step:text-black transition-colors">
                          {idx + 1}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-white uppercase tracking-tighter">{step.label}</p>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rule.emailAction && (
                <div className="pt-4">
                  <Button className="w-full bg-secondary text-black font-bold h-12 uppercase tracking-widest text-[10px] neon-blue" asChild>
                    <a href="mailto:noims108a@gmail.com?subject=Prize%20Claim%20Verification">
                      <Mail className="w-4 h-4 mr-2" /> Send Prize Proof to Team
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-8 border-white/5 bg-white/[0.02] text-center relative overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
            <Info className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm md:text-base font-bold text-muted-foreground uppercase tracking-[0.2em] italic opacity-60">
            More rules coming soon. Stay tuned!
          </p>
        </div>
      </div>
    </div>
  )
}
