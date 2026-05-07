'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import React from 'react';

const variants = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.99,
    filter: 'blur(4px)',
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.25, ease: "easeOut" as any },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 1.01,
    filter: 'blur(2px)',
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variants as any}
        className="w-full h-full flex-1 flex flex-col items-center"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
