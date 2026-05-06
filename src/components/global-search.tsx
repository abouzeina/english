"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Layers, Zap } from "lucide-react";
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
import levelsData from "@/data/levels.json";
import lessonsData from "@/data/lessons.json";
import categoriesData from "@/data/categories.json";
import wordsData from "@/data/words.json";
import { Level, Lesson, Category, WordItem } from "@/types";

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
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

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const levels = (levelsData as Level[]) || [];
  const lessons = (lessonsData as Lesson[]) || [];
  const words = (wordsData as WordItem[]) || [];
  const categories = ((categoriesData as Category[]) || []).filter(c => c.type === 'quran');

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
        <span className="hidden md:inline-flex mx-2 font-sans text-sm font-medium">Search...</span>
        <kbd className="pointer-events-none absolute right-2 top-2.5 hidden h-6 select-none items-center gap-1 rounded-lg bg-background px-2 font-sans text-[10px] font-bold text-muted-foreground border border-white/10 opacity-100 md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-none border-none shadow-none">
          <div className="flex items-center border-b border-white/5 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput placeholder="Search everything..." dir="rtl" className="font-cairo text-right h-12" />
          </div>
          <CommandList dir="rtl" className="max-h-[400px] overflow-y-auto p-2">
            <CommandEmpty className="font-cairo py-12 text-center text-muted-foreground text-sm">
              No results found.
            </CommandEmpty>
            
            <CommandGroup heading="Lessons & Levels" className="font-cairo px-2 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {lessons.map((lesson) => {
                const level = levels.find(l => l.id === lesson.levelId);
                return (
                  <CommandItem
                    key={lesson.id}
                    value={`${level?.nameAr || ''} ${level?.name || ''} ${lesson.titleAr || ''} ${lesson.title || ''}`}
                    onSelect={() => runCommand(() => router.push(`/lessons/${lesson.id}`))}
                    className="rounded-xl px-4 py-3 mb-1 cursor-pointer transition-premium"
                  >
                    <div className="flex items-center gap-3 text-right w-full">
                      <BookOpen className="w-4 h-4 opacity-40" />
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{lesson.titleAr}</span>
                        <span className="text-[10px] text-muted-foreground">{level?.nameAr}</span>
                      </div>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            <CommandGroup heading="Vocabulary" className="font-cairo px-2 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-t border-white/5">
              {words.slice(0, 100).map((word) => (
                <CommandItem
                  key={word.id}
                  value={`${word.en} ${word.ar}`}
                  onSelect={() => runCommand(() => router.push(`/levels`))}
                  className="rounded-xl px-4 py-3 mb-1 cursor-pointer transition-premium"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 opacity-40" />
                      <span className="font-bold text-foreground">{word.en}</span>
                    </div>
                    <span className="text-sm text-muted-foreground font-cairo">{word.ar}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Guides" className="font-cairo px-2 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-t border-white/5">
              {categories.map((cat) => (
                <CommandItem
                  key={cat.id}
                  value={`${cat.titleAr} ${cat.title}`}
                  onSelect={() => runCommand(() => router.push(`/quran-guide`))}
                  className="rounded-xl px-4 py-3 mb-1 cursor-pointer transition-premium"
                >
                  <div className="flex items-center gap-3 text-right w-full">
                    <Zap className="w-4 h-4 opacity-40" />
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{cat.titleAr}</span>
                      <span className="text-xs text-muted-foreground">دليل المعلم</span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
