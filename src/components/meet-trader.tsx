
"use client"

import { useUser, useFirestore, useDoc } from "@/firebase"
import { doc } from "firebase/firestore"
import { CheckCircle2, Instagram, Youtube, Send } from "lucide-react"
import { useMemoFirebase } from "@/firebase/firestore/use-memo-firebase"
import { FALLBACK_SOCIALS } from "@/app/layout"

const DEFAULT_BIO = "Aryan Trader is a veteran market analyst and educator dedicated to empowering the next generation of financial creators. With a focus on risk management and consistent growth, Aryan provides the tools and insights needed to navigate global markets successfully.";

export function MeetTrader() {
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => db ? doc(db, "siteConfig", "traderProfile") : null, [db]);
  const { data: profile, loading } = useDoc<any>(profileRef);

  const ensureExternalLink = (url: string | undefined, fallback: string) => {
    if (!url || url.trim() === "" || url === "#") return fallback;
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    return `https://${trimmed}`;
  };

  if (loading) return <div className="container mx-auto px-4 py-20 text-center uppercase tracking-widest text-[10px] font-bold opacity-30">Syncing Trader Profile...</div>;

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="relative group">
          <div className="glass-card p-2 border-primary/30 relative overflow-hidden aspect-[4/5] shadow-[0_0_30px_rgba(255,215,0,0.1)]">
            <img 
              src={profile?.photoURL || "https://picsum.photos/seed/trader/800/1000"} 
              alt="Aryan Trader" 
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div className="mt-6 flex items-center justify-center lg:justify-start gap-2">
            <h3 className="text-3xl font-headline font-black text-primary italic tracking-tighter uppercase">
              Aryan Trader
            </h3>
            <CheckCircle2 className="w-6 h-6 text-primary fill-primary/20" />
          </div>
        </div>

        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-4">
              <h2 className="text-4xl font-headline font-bold text-white tracking-tight">About Aryan Trader</h2>
            </div>
            <p className="text-muted-foreground text-sm uppercase tracking-[0.3em] font-bold">Veteran Market Analyst</p>
            <p className="text-lg leading-relaxed text-muted-foreground/80 italic font-medium">
              "{profile?.bio || DEFAULT_BIO}"
            </p>
          </div>

          <div className="flex flex-wrap justify-center lg:justify-start gap-4">
            <a 
              href={ensureExternalLink(profile?.instagramURL, FALLBACK_SOCIALS.instagram)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-4 rounded-full bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white font-bold text-sm shadow-lg hover:scale-105 transition-all group"
            >
              <Instagram className="w-5 h-5" />
              Follow on Instagram
            </a>

            <a 
              href={ensureExternalLink(profile?.youtubeURL, FALLBACK_SOCIALS.youtube)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-4 rounded-full bg-red-600 text-white font-bold text-sm shadow-lg hover:scale-105 transition-all group"
            >
              <Youtube className="w-5 h-5" />
              Subscribe on YouTube
            </a>

            <a 
              href={ensureExternalLink(profile?.telegramURL, FALLBACK_SOCIALS.telegram)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-4 rounded-full bg-blue-500 text-white font-bold text-sm shadow-lg hover:scale-105 transition-all group"
            >
              <Send className="w-5 h-5" />
              Join Telegram
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
