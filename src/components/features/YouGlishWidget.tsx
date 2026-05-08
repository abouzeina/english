"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface YouGlishWidgetProps {
  word: string;
  className?: string;
}

export function YouGlishWidget({ word, className }: YouGlishWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create a unique deterministic ID for the widget container
  const widgetId = useMemo(() => {
    return `yg-widget-${word.replace(/[^a-zA-Z0-9]/g, '')}-${Math.random().toString(36).substring(7)}`;
  }, [word]);

  useEffect(() => {
    let isMounted = true;

    const initWidget = () => {
      if (!isMounted) return;
      
      const YG = (window as any).YG;
      if (YG && containerRef.current) {
        // Clear container if any previous iframe exists
        containerRef.current.innerHTML = '';
        
        // Calculate a safe width based on the screen size for mobile responsiveness
        const width = Math.min(600, window.innerWidth - 64);
        
        // Initialize the widget
        widgetRef.current = new YG.Widget(widgetId, {
          width: width,
          components: 8415, // Standard video + caption + controls
          events: {
            onFetchDone: (e: any) => {
              if (isMounted) setIsLoading(false);
            }
          }
        });
        
        // Fetch the word in all accents
        widgetRef.current.fetch(word, "english", "all");
      }
    };

    let timeoutId: NodeJS.Timeout;

    // Load script if not exists
    if (!(window as any).YG) {
      const script = document.createElement("script");
      script.src = "https://youglish.com/public/emb/widget.js";
      script.async = true;
      script.onload = initWidget;
      document.body.appendChild(script);
    } else {
      // Small timeout to allow container to mount fully in the DOM during modal expansion
      timeoutId = setTimeout(initWidget, 100);
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [word, widgetId]);

  return (
    <div className={cn("w-full relative flex flex-col items-center", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 rounded-[2rem] border border-white/5 z-10 backdrop-blur-sm min-h-[350px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-sans animate-pulse">Searching YouTube...</span>
        </div>
      )}
      <div 
        id={widgetId} 
        ref={containerRef} 
        className="w-full max-w-[600px] min-h-[350px] rounded-[2rem] overflow-hidden shadow-2xl flex justify-center bg-black/5"
      >
        {/* YouGlish IFrame will be injected here */}
      </div>
      
      <div className="mt-3 text-center opacity-50">
        <span className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider font-bold">
          Powered by YouGlish
        </span>
      </div>
    </div>
  );
}
