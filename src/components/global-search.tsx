"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Layers, Zap, Loader2 } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Level, Lesson, Category, WordItem } from "@/types";
import { searchWords } from "@/lib/content/actions";
import { useDebounce } from "@/hooks/use-debounce"; // We need this hook
import { SearchErrorBoundary } from "@/components/error-boundaries";

function GlobalSearchInternal() {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const debouncedQuery = useDebounce(query, 300);
  
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search logic
  React.useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const words = await searchWords(debouncedQuery);
        setResults(words);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        className="relative h-10 w-10 p-0 md:h-11 md:w-64 md:justify-start md:px-4 text-muted-foreground bg-secondary/20 border border-white/5 rounded-xl"
      >
        <Search className="h-4 w-4 md:mr-2 opacity-50" />
        <span className="hidden md:inline-flex mx-2 font-sans text-sm font-medium">Search...</span>
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        className="relative h-10 w-10 p-0 md:h-11 md:w-64 md:justify-start md:px-4 text-muted-foreground bg-secondary/20 hover:bg-secondary/40 hover:text-foreground border border-white/5 rounded-xl transition-premium group shadow-none"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 md:mr-2 opacity-50 group-hover:opacity-100 transition-premium" />
        <span className="hidden md:inline-flex mx-2 font-cairo text-sm font-medium">بحث...</span>
        <kbd className="pointer-events-none absolute right-2 top-2.5 hidden h-6 select-none items-center gap-1 rounded-lg bg-background px-2 font-sans text-[10px] font-bold text-muted-foreground border border-white/10 opacity-100 md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-none border-none shadow-none" shouldFilter={false}>
          <div className="flex items-center border-b border-white/5 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              value={query}
              onValueChange={setQuery}
              placeholder="ابحث عن أي شيء..." 
              dir="rtl" 
              className="font-cairo text-right h-12 text-base md:text-sm" 
            />
            {isSearching && <Loader2 className="h-4 w-4 animate-spin opacity-20 ml-2" />}
          </div>
          <CommandList dir="rtl" className="max-h-[400px] overflow-y-auto p-2">
            {query.length > 0 && results.length === 0 && !isSearching && (
              <CommandEmpty className="font-cairo py-12 text-center text-muted-foreground text-sm">
                لا توجد نتائج.
              </CommandEmpty>
            )}
            
            {results.length > 0 && (
              <CommandGroup heading="المفردات" className="font-cairo px-2 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {results.map((word) => (
                  <CommandItem
                    key={word.id}
                    onSelect={() => runCommand(() => router.push(`/lessons/${word.lessonId}?level=${word.levelId}`))}
                    className="rounded-xl px-4 py-3 mb-1 cursor-pointer transition-premium"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center justify-between gap-3 w-full">
                        <div className="flex items-center gap-3">
                          <Layers className="w-4 h-4 opacity-40" />
                          <span className="font-bold text-foreground">{word.en}</span>
                        </div>
                        <span className="text-sm text-muted-foreground font-cairo">{word.ar}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {query.length === 0 && (
               <div className="py-12 text-center text-muted-foreground font-cairo text-xs opacity-40">
                  ابدأ البحث بكتابة حرفين على الأقل...
               </div>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

export function GlobalSearch() {
  return (
    <SearchErrorBoundary>
      <GlobalSearchInternal />
    </SearchErrorBoundary>
  );
}
