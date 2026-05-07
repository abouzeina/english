'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useWafiStore } from '@/store/useAppStore';
import { useSyncStore } from '@/store/useSyncStore';
import { 
  User as UserIcon, 
  Mail, 
  Trophy, 
  Flame, 
  BookOpen, 
  Calendar, 
  LogOut, 
  ShieldCheck,
  CloudCheck,
  RefreshCw,
  Sparkles,
  LogIn
} from 'lucide-react';
import { authService } from '@/lib/firebase/auth-service';
import { syncEngine } from '@/lib/firebase/sync-engine';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GuestNotice } from '@/components/auth/guest-notice';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const xp = useWafiStore(s => s.xp) ?? 0;
  const streak = useWafiStore(s => s.streak) ?? 0;
  const completedLessons = useWafiStore(s => s.completedLessons) || [];
  const syncState = useSyncStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      toast.loading('جاري حفظ البيانات وتسجيل الخروج...');
      await syncEngine.forceSync();
      await authService.logout();
      toast.dismiss();
      toast.success('تم تسجيل الخروج بنجاح');
      router.push('/login');
    } catch (error) {
      toast.dismiss();
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  const userLevel = Math.floor(xp / 1000) + 1;
  const xpToNextLevel = 1000 - (xp % 1000);

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12">
      <GuestNotice />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header / Hero Section */}
        <div className="relative bg-card border border-border/40 rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-2xl shadow-primary/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 p-1">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  <UserIcon className="w-16 h-16 text-primary/40" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-background border border-border/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                <ShieldCheck className={user ? "w-4 h-4 text-primary" : "w-4 h-4 text-muted-foreground"} />
                <span className="text-xs font-bold font-inter">{user ? "PRO" : "GUEST"}</span>
              </div>
            </div>

            <div className="text-center md:text-right flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center md:justify-start gap-3">
                {user?.displayName || 'زائر وافي'}
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-inter">{user?.email || 'لم يتم الربط بحساب'}</span>
                </div>
                {user && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">انضم في {new Date(user.metadata.creationTime || '').toLocaleDateString('ar-EG')}</span>
                  </div>
                )}
              </div>
            </div>

            {user ? (
              <button 
                onClick={handleLogout}
                className="bg-secondary/50 hover:bg-destructive/10 hover:text-destructive text-muted-foreground px-6 py-3 rounded-2xl transition-all flex items-center gap-2 font-bold group"
              >
                <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                خروج
              </button>
            ) : (
              <Link href="/login">
                <Button className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-bold gap-2">
                  <LogIn className="w-5 h-5" /> تسجيل الدخول
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border/40 rounded-3xl p-6 flex flex-col items-center text-center group hover:border-primary/20 transition-all">
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4 text-orange-500 group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div className="text-3xl font-black font-inter mb-1">{streak}</div>
            <div className="text-sm text-muted-foreground font-bold">أيام متتالية</div>
          </div>

          <div className="bg-card border border-border/40 rounded-3xl p-6 flex flex-col items-center text-center group hover:border-primary/20 transition-all">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 fill-current" />
            </div>
            <div className="text-3xl font-black font-inter mb-1">{xp}</div>
            <div className="text-sm text-muted-foreground font-bold">إجمالي النقاط (XP)</div>
          </div>

          <div className="bg-card border border-border/40 rounded-3xl p-6 flex flex-col items-center text-center group hover:border-primary/20 transition-all">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 text-blue-500 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black font-inter mb-1">{completedLessons.length}</div>
            <div className="text-sm text-muted-foreground font-bold">دروس مكتملة</div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-card border border-border/40 rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-black text-xl font-inter shadow-lg shadow-primary/20">
                {userLevel}
              </div>
              <span className="font-bold text-lg">المستوى الحالي</span>
            </div>
            <span className="text-sm text-muted-foreground font-bold">باقي {xpToNextLevel} XP للمستوى التالي</span>
          </div>
          <div className="h-4 bg-secondary/50 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(xp % 1000) / 10}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>

        {/* Sync Status - Only show if logged in, or show locked status */}
        {user ? (
          <div className="flex items-center justify-between px-4 text-muted-foreground/60">
            <div className="flex items-center gap-2">
              {syncState.isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CloudCheck className="w-4 h-4" />
              )}
              <span className="text-xs font-bold">
                {syncState.isSyncing ? 'جاري المزامنة...' : 'جميع البيانات متزامنة مع السحاب'}
              </span>
            </div>
            <div className="text-xs font-inter uppercase tracking-widest">
              Last Sync: {syncState.lastSyncedAt ? new Date(syncState.lastSyncedAt).toLocaleTimeString() : 'Just now'}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 p-4 bg-secondary/20 rounded-2xl text-muted-foreground/60 text-xs font-bold">
            <CloudCheck className="w-4 h-4 opacity-20" />
            المزامنة السحابية غير مفعلة للزوار
          </div>
        )}
      </motion.div>
    </div>
  );
}
