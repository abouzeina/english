"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, BookOpen, Layers, Flame, Star, Loader2, Sparkles, Brain, ArrowLeft, Headphones } from "lucide-react";
import { useWafiStore } from "@/store/useAppStore";
import { isFocusWord } from "@/lib/srs";
import { WordItem } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { fetchWordsByIds } from "@/lib/content/actions";
import { GuestNotice } from "@/components/auth/guest-notice";

interface DashboardClientProps {
  totalLessons: number;
  totalWords: number;
}

export default function DashboardClient({ totalLessons, totalWords }: DashboardClientProps) {
  const completedLessons = useWafiStore(s => s.completedLessons) || [];
  const userWords = useWafiStore(s => s.userWords) || {};
  const xp = useWafiStore(s => s.xp) ?? 0;
  const streak = useWafiStore(s => s.streak) ?? 0;
  
  const [focusWordDetails, setFocusWordDetails] = useState<WordItem[]>([]);
  const [isLoadingFocus, setIsLoadingFocus] = useState(false);

  const focusWordIds = useMemo(() => {
    if (!userWords) return [];
    return Object.keys(userWords).filter(id => isFocusWord(userWords[id]));
  }, [userWords]);

  // Fetch details for focus words on demand
  useEffect(() => {
    if (focusWordIds.length > 0) {
      setIsLoadingFocus(true);
      fetchWordsByIds(focusWordIds.slice(0, 4)).then(words => {
        setFocusWordDetails(words);
        setIsLoadingFocus(false);
      });
    }
  }, [focusWordIds]);
  
  const insights = useMemo(() => {
    if (!userWords) return [];
    const items = [];
    const totalMasteredWords = Object.values(userWords).filter(w => w.state === 'mastered').length;
    
    if (totalMasteredWords > 0) {
      items.push({ text: `لقد أتقنت ${totalMasteredWords} كلمة بشكل مثالي.`, icon: Sparkles });
    }
    
    if (focusWordIds.length > 0) {
      items.push({ text: `هناك ${focusWordIds.length} كلمات تحتاج إلى مزيد من التركيز.`, icon: Brain });
    }

    return items;
  }, [userWords, focusWordIds]);

  const wordProgress = totalWords > 0 ? Math.round((Object.keys(userWords).length / totalWords) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <GuestNotice />
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4 font-cairo">تقدمك الدراسي.</h1>
        <div className="flex flex-col gap-3">
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="flex items-center gap-3 text-muted-foreground font-cairo text-lg"
              >
                <Icon className="w-5 h-5 text-primary opacity-60" />
                <span>{insight.text}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
        <StatCard title="الحماس" value={`${streak} يوم`} icon={<Flame className="w-5 h-5" />} />
        <StatCard title="المصطلحات" value={`${Object.keys(userWords).length} كلمة`} icon={<Layers className="w-5 h-5" />} />
        <StatCard title="الخبرة" value={`${xp} XP`} icon={<Star className="w-5 h-5" />} />
        <StatCard title="الوحدات" value={`${completedLessons.length} مكتمل`} icon={<BookOpen className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8 space-y-12">
          <section>
            <h2 className="text-xl font-bold mb-6 font-cairo opacity-40 uppercase tracking-widest text-[10px]">قوة التعلم</h2>
            <div className="glass-panel p-10 rounded-[2.5rem] border-white/5 bg-secondary/10">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="text-4xl font-bold mb-1">{wordProgress}%</div>
                  <div className="text-sm text-muted-foreground font-cairo">إجمالي الكلمات المكتسبة</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary font-cairo">الإتقان</div>
                  <div className="text-xs text-muted-foreground font-cairo">استمر في التقدم</div>
                </div>
              </div>
              <div className="bg-secondary/30 rounded-full h-2.5 w-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${wordProgress}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.4)]"
                />
              </div>
            </div>
          </section>

          {focusWordIds.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-6 font-cairo opacity-40 uppercase tracking-widest text-[10px]">تحتاج لمراجعة</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isLoadingFocus ? (
                   [1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-3xl bg-secondary/10 animate-pulse" />)
                ) : (
                  focusWordDetails.map(word => (
                    <div key={word.id} className="p-6 rounded-3xl bg-secondary/20 border border-white/5 flex items-center justify-between group hover:bg-secondary/40 transition-premium">
                      <div>
                        <div className="font-bold text-lg">{word.en}</div>
                        <div className="text-sm text-muted-foreground font-cairo">{word.ar}</div>
                      </div>
                      <Link href="/review">
                        <Button size="icon" variant="ghost" className="rounded-full opacity-0 group-hover:opacity-100 transition-premium">
                          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-primary text-primary-foreground shadow-2xl shadow-primary/10 overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-premium duration-1000">
                <Brain className="w-32 h-32" />
             </div>
             <h3 className="text-2xl font-bold mb-2 font-cairo">جاهز للمراجعة؟</h3>
             <p className="text-sm opacity-80 mb-8 font-cairo leading-relaxed">لديك كلمات مستحقة للمراجعة الآن. المراجعة المنتظمة هي سر الاستمرارية.</p>
             <Link href="/review">
                <Button className="w-full h-14 bg-white text-primary rounded-2xl font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-premium shadow-xl font-cairo">
                   ابدأ المراجعة
                </Button>
             </Link>
          </div>
          
          <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-secondary/10">
             <Headphones className="w-6 h-6 mb-4 text-blue-500 opacity-60" />
             <h3 className="text-lg font-bold mb-1 font-cairo">تحدي الاستماع</h3>
             <p className="text-xs text-muted-foreground font-cairo mb-4">أكمل 3 جلسات استماع هذا الأسبوع لزيادة الدقة.</p>
             <div className="flex gap-2">
                {[1, 1, 0, 0, 0].map((v, i) => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full", v ? "bg-blue-500" : "bg-secondary")} />
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="glass-panel p-6 rounded-3xl border-white/5 bg-secondary/10 flex items-center gap-4 group hover:bg-secondary/20 transition-premium">
        <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center text-primary border border-white/5 group-hover:scale-110 transition-premium">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <h3 className="text-xl font-bold">{value}</h3>
        </div>
      </div>
    </motion.div>
  );
}
