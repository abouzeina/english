"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function GuestNotice() {
  const user = useAuthStore((state) => state.user);

  if (user) return null;

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-[2rem] p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
         <AlertCircle className="w-32 h-32" />
      </div>
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold font-cairo">أنت تتصفح كضيف</h3>
          <p className="text-sm text-muted-foreground font-cairo">
            يمكنك استخدام كل الميزات، لكن لضمان حفظ تقدمك ومزامنته عبر أجهزتك، نوصي بتسجيل الدخول.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
        <Link href="/signup" className="flex-1 md:flex-none">
          <Button className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold font-cairo px-8">
            إنشاء حساب مجاني
          </Button>
        </Link>
        <Link href="/login" className="flex-1 md:flex-none">
          <Button variant="outline" className="w-full h-12 rounded-2xl font-bold font-cairo px-8">
            دخول
          </Button>
        </Link>
      </div>
    </div>
  );
}
