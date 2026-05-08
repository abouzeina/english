"use client";

import React from "react";
import { BaseErrorBoundary } from "./BaseErrorBoundary";

export function AudioErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <BaseErrorBoundary fallbackMessage="تعذر تشغيل الصوت. يرجى التأكد من صلاحيات المتصفح.">
      {children}
    </BaseErrorBoundary>
  );
}

export function SearchErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <BaseErrorBoundary fallbackMessage="تعذر تحميل نظام البحث.">
      {children}
    </BaseErrorBoundary>
  );
}

export function QuizErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <BaseErrorBoundary fallbackMessage="حدث خطأ في تحميل الاختبار.">
      {children}
    </BaseErrorBoundary>
  );
}

export function SyncErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <BaseErrorBoundary fallbackMessage="تعذر مزامنة البيانات.">
      {children}
    </BaseErrorBoundary>
  );
}

export function SpeechErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <BaseErrorBoundary fallbackMessage="حدث خطأ في نظام التعرف على الصوت.">
      {children}
    </BaseErrorBoundary>
  );
}
