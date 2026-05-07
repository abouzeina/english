'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { 
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      toast.success('تم إنشاء الحساب بنجاح! مرحباً بك.');
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      const message = error.code === 'auth/email-already-in-use'
        ? 'هذا البريد الإلكتروني مستخدم بالفعل'
        : 'حدث خطأ أثناء إنشاء الحساب';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-card border border-border/40 shadow-2xl shadow-primary/5 rounded-3xl p-8 md:p-10"
    >
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-primary/20">
          <Rocket className="w-8 h-8 text-primary animate-bounce" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">ابدأ رحلتك اليوم</h1>
        <p className="text-muted-foreground text-center text-balance">
          انضم إلى آلاف المتعلمين وطور لغتك الإنجليزية بذكاء
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80 px-1" htmlFor="name">
            الاسم الكامل
          </label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              id="name"
              type="text"
              placeholder="أدخل اسمك"
              className="w-full bg-secondary/30 border border-border/50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-right"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80 px-1" htmlFor="email">
            البريد الإلكتروني
          </label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="w-full bg-secondary/30 border border-border/50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-left font-inter"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80 px-1" htmlFor="password">
            كلمة المرور
          </label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full bg-secondary/30 border border-border/50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-left font-inter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              إنشاء الحساب
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform rtl:rotate-180" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-border/50 text-center">
        <p className="text-muted-foreground">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline transition-all">
            سجل دخولك الآن
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
