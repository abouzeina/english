import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { HydrationBoundary } from "@/components/auth/hydration-boundary";
import { SyncManager } from "@/components/auth/sync-manager";
import { RouteProgress } from "@/components/route-progress";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: {
    template: "%s | منصة تعلم الإنجليزية",
    default: "منصة تعلم الإنجليزية الذكية",
  },
  description: "منصة حديثة لتعلم اللغة الإنجليزية مصممة خصيصاً للعرب ولمعلمي القرآن الكريم. تدعم الاستماع التفاعلي، المفضلة، والمتابعة.",
  openGraph: {
    title: "منصة تعلم الإنجليزية الذكية",
    description: "تطبيق تفاعلي حديث لتعلم اللغة الإنجليزية لمعلمي القرآن والعرب",
    type: "website",
    locale: "ar_SA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${inter.variable} ${cairo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col font-cairo bg-background text-foreground transition-colors duration-300"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <AuthProvider>
            <HydrationBoundary>
              <Suspense fallback={null}>
                <RouteProgress />
              </Suspense>
              <SyncManager />
              {children}
              <Toaster position="top-center" richColors />
            </HydrationBoundary>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
