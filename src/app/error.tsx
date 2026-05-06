"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service like Sentry
    console.error("App Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-3xl font-bold font-cairo text-slate-900 dark:text-white mb-4">
        عذراً، حدث خطأ غير متوقع!
      </h2>
      <p className="text-slate-600 dark:text-slate-400 font-cairo max-w-md mx-auto mb-8">
        نأسف لهذا العطل. فريقنا تم إبلاغه بالمشكلة وسيقوم بحلها في أسرع وقت. يمكنك المحاولة مرة أخرى أو العودة للرئيسية.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-cairo font-bold gap-2">
          <RotateCcw className="w-4 h-4" />
          حاول مرة أخرى
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/'} className="rounded-xl font-cairo font-bold">
          العودة للرئيسية
        </Button>
      </div>
    </div>
  );
}
