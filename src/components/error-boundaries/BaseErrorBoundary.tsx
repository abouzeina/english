"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class BaseErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error("Uncaught error:", error, errorInfo);
    }
    // Future: report to error reporting service
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center bg-destructive/10 rounded-xl border border-destructive/20 m-4">
          <AlertCircle className="w-8 h-8 text-destructive mb-3 opacity-80" />
          <h2 className="text-lg font-bold font-cairo text-destructive mb-2">عذراً، حدث خطأ ما</h2>
          <p className="text-sm font-cairo text-muted-foreground mb-4">
            {this.props.fallbackMessage || "واجه هذا المكوّن مشكلة أثناء التحميل."}
          </p>
          <button
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-cairo text-sm transition-premium hover:bg-secondary/80"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            حاول مرة أخرى
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
