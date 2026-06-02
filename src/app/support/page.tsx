"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MessageSquare, Mail, HelpCircle, Send, Sparkles, Loader2, Headset } from "lucide-react"
import { supportAI } from "@/ai/flows/support-ai-flow"
import { useToast } from "@/hooks/use-toast"

export default function SupportPage() {
  const [query, setQuery] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([])
  const { toast } = useToast()

  const handleAiChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    const userMsg = query
    setQuery("")
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }])
    setIsAiLoading(true)

    try {
      const response = await supportAI({ query: userMsg })
      setChatHistory(prev => [...prev, { role: 'ai', content: response.answer }])
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "I'm having a little trouble connecting to the cloud right now. For immediate help, please check the FAQs or email us at noims108a@gmail.com." }])
      toast({
        variant: "destructive",
        title: "Assistant Connection Error",
        description: "Could not reach the AI server."
      })
    } finally {
      setIsAiLoading(false)
    }
  }

  const faqs = [
    { q: "How do I register my fan page?", a: "Go to the Registration page, enter your Instagram details, and upload a screenshot of your dashboard for verification. You'll receive a permanent AT-XXXX ID." },
    { q: "How many reels can I submit?", a: "You can submit unlimited reels! Every reel you submit helps you climb the Showcase leaderboard and work toward milestone rewards." },
    { q: "What are the milestone rewards?", a: "Rewards start at 1K followers (VIP Access), 10K (Funded Accounts + ₹10K), 50K (iPhone/MacBook), and 100K (International Trip with Aryan Sir)." },
    { q: "How long does a payout take?", a: "Once requested, payouts are typically verified and processed within 3-5 business days." },
    { q: "How do I update my follower count?", a: "Follower counts can be updated manually in your profile settings. The leaderboard will reflect your current standing instantly." },
    { q: "Can I register multiple handles?", a: "Each creator should register their primary fan page. For multiple handles, please contact admin support directly." }
  ]

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-5xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold mb-4 uppercase tracking-widest">
          <Headset className="w-4 h-4" /> Help Center
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4">Creator Support</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">Get instant answers from our AI or reach out to the team directly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: AI Chat */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card flex flex-col h-[600px] border-primary/20">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Assistant Agent
              </h2>
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase">Online</span>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {chatHistory.length === 0 && (
                <div className="text-center py-20 text-muted-foreground italic">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p>Ask me about registration, rewards, or payouts!</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === 'user' 
                    ? 'bg-primary text-black font-medium' 
                    : 'bg-white/5 border border-white/10 text-white'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Assistant is typing...</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleAiChat} className="p-6 border-t border-white/10 flex gap-3">
              <Input 
                placeholder="Type your question..." 
                className="bg-white/5 border-white/10 h-12"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit" disabled={isAiLoading || !query.trim()} className="h-12 w-12 p-0 bg-primary text-black">
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>

        {/* Right Column: Email & FAQ */}
        <div className="space-y-6">
          <Card className="glass-card border-secondary/20 bg-secondary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="w-5 h-5 text-secondary" /> Direct Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">For technical issues or specific payout queries, email our team.</p>
              <div className="p-3 bg-white/5 rounded-lg text-center border border-white/10">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Support Email</p>
                <p className="text-sm font-code text-secondary font-bold">noims108a@gmail.com</p>
              </div>
              <Button className="w-full bg-secondary text-black font-bold h-11" asChild>
                <a href="https://mail.google.com/mail/?view=cm&fs=1&to=noims108a@gmail.com&su=Aryan%20Gold%20FanHub%20Support" target="_blank" rel="noopener noreferrer">
                  Send Email
                </a>
              </Button>
            </CardContent>
          </Card>

          <div className="glass-card p-6">
            <h3 className="font-headline font-bold mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" /> Common FAQs
            </h3>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-white/5">
                  <AccordionTrigger className="text-left text-xs font-bold uppercase hover:no-underline">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  )
}
