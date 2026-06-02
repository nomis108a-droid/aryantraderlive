import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SupportWidget } from '@/components/support-widget';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const APP_VERSION = "v1.5.0-locked";

export const FALLBACK_DISCLAIMERS = {
  weeklyWar: "🛡️ WEEKLY WAR ELIGIBILITY RULES: 1) ✅ Your Instagram fan page must follow maximum 50 accounts only. 2) ✅ Must be a registered creator on Aryan Gold FanHub. ⚠️ Important: If your fan page is following more than 50 accounts, please unfollow the extra accounts first. Views will only be updated for fan pages following 50 or fewer accounts.",
  rankings: "📢 Follower Update Timing: Creator stats and follower counts are verified daily between 3:00 PM – 5:00 PM IST by our admin team. Global rankings re-sort automatically after each update.",
  dashboard: "📊 How It Works: Our team updates your reel views daily between 3:00 PM – 5:00 PM IST for the first 7 days after you submit your reel. During these 7 days if your reel crosses 50,000 views or 100,000 views our team will automatically process your prize and contact you on your registered WhatsApp number — you do not need to do anything. After 7 days your reel moves to Previous Entries section. If your reel crossed 50,000 views or 100,000 views during the 7 days but you did not receive your prize — send your reel link and a screenshot of your views as proof to noims108a@gmail.com and our team will verify and process your payment. 🏆 Prize: 50,000 views = ₹500 cash. 100,000 views = ₹1,500 cash. Prizes are sent directly to your UPI within 3 working days after verification."
};

export const FALLBACK_SOCIALS = {
  instagram: "https://instagram.com/aryantrader",
  youtube: "https://youtube.com/@aryantrader",
  telegram: "https://t.me/aryantrader"
};

export const FALLBACK_REWARDS = {
  reelRewards: [
    { target: "50,000+", reward: "₹500 Cash" },
    { target: "1,00,000+", reward: "₹1,500 Cash" }
  ],
  milestones: [
    { tier: 1000, reward: "VIP GROUP FREE ACCESS + Reel Incentives Unlocked 🔓" },
    { tier: 10000, reward: "2 Funded Trading Accounts + ₹10,000 cash" },
    { tier: 50000, reward: "iPhone or MacBook" },
    { tier: 100000, reward: "International Trip with Aryan Sir" }
  ]
};

export const FALLBACK_RULES: Metadata = {
  title: 'Aryan Gold FanHub',
  description: 'Professional creator network for traders.',
};

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/60">Syncing Aryan Gold...</p>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Source+Code+Pro:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-[#131314]">
        <FirebaseClientProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <Suspense fallback={<PageLoader />}>
                {children}
              </Suspense>
            </main>
            <Footer />
          </div>
          <SupportWidget />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}