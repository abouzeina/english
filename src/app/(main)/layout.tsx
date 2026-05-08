"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";
import { SyncStatusBadge } from "@/components/sync-status-badge";
import { Home, BookOpen, BookText, Heart, LayoutDashboard, Menu, Sparkles, User } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

import { Footer } from "@/components/footer";
import { PageTransition } from "@/components/page-transition";

const navItems = [
  { name: "الرئيسية", href: "/", icon: Home },
  { name: "المستويات", href: "/levels", icon: BookOpen },
  { name: "دليل المعلم", href: "/quran-guide", icon: BookText },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  // Memoize nav items to avoid recalculation
  const displayNavItems = useMemo(() => [
    ...navItems, 
    { name: "المتابعة", href: "/dashboard", icon: LayoutDashboard }, 
    { name: "المفضلة", href: "/favorites", icon: Heart }, 
    { name: "الملف الشخصي", href: "/profile", icon: User }
  ], []);

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans selection:bg-primary/20">
      {/* Premium Minimal Navbar */}
      <header className="sticky top-0 z-50 w-full bg-background/60 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-center px-6">
        {/* ... (rest of header code) */}
        <div className="max-w-7xl w-full flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex-1 flex items-center gap-2">
            <Link href="/" className="group flex items-center gap-1.5 transition-premium hover:opacity-80">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-premium shadow-lg shadow-primary/20">
                <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground/90">
                Wafi<span className="text-primary">.</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav - Floating Pill Style inside Nav */}
          <div className="hidden md:flex items-center bg-secondary/30 border border-white/5 p-1 rounded-full backdrop-blur-md">
            <nav className="flex items-center gap-1">
              {displayNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative px-5 py-2 rounded-full text-sm font-bold transition-premium font-cairo overflow-hidden",
                      isActive 
                        ? "text-foreground bg-background shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Actions */}
          <div className="flex-1 flex items-center justify-end gap-3">
            <div className="hidden sm:block">
              <GlobalSearch />
            </div>
            
            <SyncStatusBadge />
            
            <ThemeToggle />
            
            {user && (
              <Link 
                href="/profile" 
                className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden hover:scale-105 transition-transform"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </Link>
            )}

            {!user && (
              <Link 
                href="/login" 
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
              >
                تسجيل الدخول
              </Link>
            )}
            
            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground bg-secondary/50 rounded-xl">
                      <Menu className="w-5 h-5" />
                    </Button>
                  }
                />
                <SheetContent side="bottom" className="rounded-t-[2.5rem] border-white/5 bg-background/95 backdrop-blur-2xl p-8 shadow-2xl">
                  <SheetHeader className="mb-8 text-center">
                    <SheetTitle className="font-bold text-2xl tracking-tighter">
                      Wafi<span className="text-primary">.</span>
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div className="mb-6">
                      <GlobalSearch />
                    </div>
                    {displayNavItems.map((item) => {
                      const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-4 px-6 py-4 rounded-2xl text-lg font-bold transition-premium font-cairo",
                            isActive 
                              ? "bg-primary/10 text-primary" 
                              : "text-muted-foreground hover:bg-secondary/50"
                          )}
                        >
                          <Icon className={cn("w-6 h-6", isActive ? "text-primary" : "opacity-50")} />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center w-full">
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      <Footer />
    </div>
  );
}
