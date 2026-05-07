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
    template: "%s | Wafi - منصة إتقان الإنجليزية",
    default: "Wafi | وافي - طريقك لإتقان الإنجليزية بدقة",
  },
  description: "المنصة الأولى المصممة خصيصاً للعرب ولمعلمي القرآن الكريم لتعلم الإنجليزية بأسلوب عصري، بسيط، ومركز. تدعم الاستماع التفاعلي، المفضلة، والمتابعة الذكية.",
  keywords: ["تعلم الانجليزية", "معلمي القرآن", "وافي", "Wafi English", "English for Arabs", "تطبيق تعليمي"],
  openGraph: {
    title: "Wafi | وافي - منصة تعلم الإنجليزية الذكية",
    description: "تطبيق تفاعلي حديث لتعلم اللغة الإنجليزية مصمم للعرب ومعلمي القرآن.",
    type: "website",
    locale: "ar_SA",
    siteName: "وافي",
  },
  twitter: {
    card: "summary_large_image",
    title: "وافي - أتقن الإنجليزية بكل دقة",
    description: "المنصة العصرية لتعلم الإنجليزية للعرب.",
  }
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
