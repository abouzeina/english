import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden px-4 py-8">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-3xl animate-pulse delay-700" />
      
      <div className="w-full max-w-md z-10">
        {children}
      </div>
      
      <footer className="mt-8 text-sm text-muted-foreground/60 font-inter">
        &copy; {new Date().getFullYear()} Wafi. Built for excellence.
      </footer>
    </div>
  );
}
