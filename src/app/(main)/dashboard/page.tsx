"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, BookOpen, Layers, Flame, Target, Star, Loader2, Sparkles, Brain, ArrowLeft, Headphones } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useWafiStore, useAppStore } from "@/store/useAppStore";
import { isFocusWord } from "@/lib/srs";
import lessonsData from "@/data/lessons.json";
import wordsData from "@/data/words.json";
import { Lesson, WordItem } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  // Use atomic selectors for primitive values
  const completedLessons = useWafiStore(s => s.completedLessons) || [];
  const userWords = useWafiStore(s => s.userWords) || {};
  const xp = useWafiStore(s => s.xp) ?? 0;
  const streak = useWafiStore(s => s.streak) ?? 0;
  
  // Get focus words from state and compute to avoid new reference issues
  const focusWords = useMemo(() => {
    if (!userWords) return [];
    return Object.keys(userWords).filter(id => isFocusWord(userWords[id]));
  }, [userWords]);
  
  const insights = useMemo(() => {
    if (!userWords) return [];
    const items = [];
    const totalWords = Object.keys(userWords).length;
    const masteredWords = Object.values(userWords).filter(w => w.state === 'mastered').length;
    
    if (masteredWords > 0) {
      items.push({ text: `You've mastered ${masteredWords} words perfectly.`, icon: Sparkles });
    }
    
    if (focusWords.length > 0) {
      items.push({ text: `${focusWords.length} words need a bit more focus.`, icon: Brain });
    } else if (totalWords > 5) {
      items.push({ text: "Your retention is looking very strong today.", icon: Trophy });
    }

    return items;
  }, [userWords, focusWords]);

  const stats = useMemo(() => {
    const totalLessons = (lessonsData as Lesson[]).length;
    const totalWords = (wordsData as WordItem[]).length;
    const completedWordsCount = Object.keys(userWords).length;
    const wordProgress = totalWords > 0 ? Math.round((completedWordsCount / totalWords) * 100) : 0;

    return { totalLessons, totalWords, wordProgress, completedWordsCount };
  }, [userWords]);

  if (!userWords) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4 text-editorial">Your Progress.</h1>
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
        <StatCard title="Streak" value={`${streak} days`} icon={<Flame className="w-5 h-5" />} />
        <StatCard title="Knowledge" value={`${stats.completedWordsCount} words`} icon={<Layers className="w-5 h-5" />} />
        <StatCard title="Experience" value={`${xp} XP`} icon={<Star className="w-5 h-5" />} />
        <StatCard title="Lessons" value={`${completedLessons.length} done`} icon={<BookOpen className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8 space-y-12">
          <section>
            <h2 className="text-xl font-bold mb-6 font-cairo opacity-40 uppercase tracking-widest text-[10px]">Learning Momentum</h2>
            <div className="glass-panel p-10 rounded-[2.5rem] border-white/5 bg-secondary/10">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="text-4xl font-bold mb-1">{stats.wordProgress}%</div>
                  <div className="text-sm text-muted-foreground font-cairo">إجمالي الكلمات المكتسبة</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">Mastery</div>
                  <div className="text-xs text-muted-foreground">Keep it up</div>
                </div>
              </div>
              <div className="bg-secondary/30 rounded-full h-2.5 w-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.wordProgress}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.4)]"
                />
              </div>
            </div>
          </section>

          {focusWords.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-6 font-cairo opacity-40 uppercase tracking-widest text-[10px]">Practice Again</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {focusWords.slice(0, 4).map(id => {
                  const word = (wordsData as WordItem[]).find(w => w.id === id);
                  if (!word) return null;
                  return (
                    <div key={id} className="p-6 rounded-3xl bg-secondary/20 border border-white/5 flex items-center justify-between group hover:bg-secondary/40 transition-premium">
                      <div>
                        <div className="font-bold text-lg">{word.en}</div>
                        <div className="text-sm text-muted-foreground font-cairo">{word.ar}</div>
                      </div>
                      <Link href="/review">
                        <Button size="icon" variant="ghost" className="rounded-full opacity-0 group-hover:opacity-100 transition-premium">
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-primary text-primary-foreground shadow-2xl shadow-primary/10 overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-premium duration-1000">
                <Brain className="w-32 h-32" />
             </div>
             <h3 className="text-2xl font-bold mb-2">Review Ready</h3>
             <p className="text-sm opacity-80 mb-8 font-cairo leading-relaxed">لديك كلمات مستحقة للمراجعة الآن. المراجعة المنتظمة هي سر الاستمرارية.</p>
             <Link href="/review">
                <Button className="w-full h-14 bg-white text-primary rounded-2xl font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-premium shadow-xl">
                  ابدأ المراجعة
                </Button>
             </Link>
          </div>
          
          <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-secondary/10">
             <Headphones className="w-6 h-6 mb-4 text-blue-500 opacity-60" />
             <h3 className="text-lg font-bold mb-1">Listening Streak</h3>
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

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
