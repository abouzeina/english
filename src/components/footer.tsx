"use client";

import Link from "next/link";
import { Sparkles, ArrowUp, Globe, Heart, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full relative mt-20 border-t border-white/5 bg-secondary/30 backdrop-blur-sm overflow-hidden">
      {/* Top Border Highlight */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      {/* Background Decorative Blur */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-32 bg-primary/10 blur-[100px] -z-10 rounded-full" />
      
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20 items-start mb-20">
          
          {/* Brand Info */}
          <div className="md:col-span-5 flex flex-col items-start">
            <Link href="/" className="group flex items-center gap-1.5 transition-premium hover:opacity-80 mb-6">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-premium shadow-lg shadow-primary/20">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-foreground/90">
                Wafi<span className="text-primary">.</span>
              </span>
            </Link>
            <p className="text-muted-foreground font-cairo leading-relaxed max-w-sm mb-8 text-lg">
              المنصة الأولى المتكاملة لتعلم اللغة الإنجليزية، مصممة بأحدث التقنيات لخدمة المجتمع العربي ومعلمي القرآن الكريم.
            </p>
            <div className="flex gap-4">
              <SocialButton icon={<Globe className="w-5 h-5" />} />
              <SocialButton icon={<Send className="w-5 h-5" />} />
              <SocialButton icon={<Heart className="w-5 h-5" />} />
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/40 mb-8 font-cairo">المنصة</h4>
            <ul className="space-y-4 font-cairo font-bold">
              <li><FooterLink href="/levels">المستويات الدراسية</FooterLink></li>
              <li><FooterLink href="/dashboard">لوحة المتابعة</FooterLink></li>
              <li><FooterLink href="/quran-guide">دليل معلمي القرآن</FooterLink></li>
              <li><FooterLink href="/favorites">الكلمات المفضلة</FooterLink></li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/40 mb-8 font-cairo">الدعم</h4>
            <ul className="space-y-4 font-cairo font-bold">
              <li><FooterLink href="#">الخصوصية</FooterLink></li>
              <li><FooterLink href="#">الشروط</FooterLink></li>
              <li><FooterLink href="#">اتصل بنا</FooterLink></li>
            </ul>
          </div>

          {/* Back to Top */}
          <div className="md:col-span-2 flex md:justify-end">
            <Button 
              onClick={scrollToTop}
              size="icon" 
              variant="outline" 
              className="w-14 h-14 rounded-2xl bg-secondary/30 border-white/5 hover:bg-primary hover:text-primary-foreground transition-premium group"
            >
              <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-premium" />
            </Button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-muted-foreground font-cairo text-sm font-medium">
            © {new Date().getFullYear()} منصة وافي. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">System Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="text-muted-foreground/80 hover:text-primary transition-premium flex items-center group gap-2"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-primary scale-0 group-hover:scale-100 transition-premium" />
      {children}
    </Link>
  );
}

function SocialButton({ icon }: { icon: React.ReactNode }) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="w-12 h-12 rounded-xl bg-secondary/30 border border-white/5 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-premium"
    >
      {icon}
    </Button>
  );
}
