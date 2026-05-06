"use client";

import { useEffect } from "react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry / PostHog logging here
    console.error("Critical Global Error:", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px", textAlign: "center", fontFamily: "sans-serif" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#e11d48" }}>خطأ فادح في النظام</h1>
          <p style={{ color: "#475569", marginBottom: "2rem", maxWidth: "500px" }}>
            حدث خطأ غير متوقع أدى إلى توقف التطبيق. نعتذر عن هذا الخلل.
          </p>
          <button 
            onClick={() => reset()}
            style={{ padding: "10px 20px", backgroundColor: "#059669", color: "white", border: "none", borderRadius: "8px", fontSize: "1rem", cursor: "pointer", fontWeight: "bold" }}
          >
            إعادة تحميل التطبيق
          </button>
        </div>
      </body>
    </html>
  );
}
