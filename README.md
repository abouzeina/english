# 🌍 منصة تعلم الإنجليزية (English Learning Platform)

منصة حديثة تفاعلية مبنية بأحدث تقنيات الويب، مخصصة للعرب ولمعلمي القرآن الكريم لتعلم اللغة الإنجليزية بثقة وطلاقة.

![Version](https://img.shields.io/badge/version-1.7.0-emerald.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg)

## ✨ الميزات الرئيسية
- **نظام صوتي متقدم:** نطق آلي، تحكم في السرعة، وإيقاف تلقائي للتداخل.
- **أوضاع تعلم متعددة:** بطاقات تعليمية (Flashcards)، وضع الاستماع (Listening)، ومحرك اختبارات ذكي (Quiz Engine).
- **تصميم Mobile First:** تجربة مستخدم سلسة على الكمبيوتر والموبايل مع دعم الوضع الليلي (Dark Mode).
- **أداء فائق:** استخدام Server Components وميزة Lazy Loading لتقليل حجم التطبيق.

## 🏗️ البنية المعمارية (Architecture)
المشروع مبني ليكون قابلاً للتوسع (Scalable) وجاهزاً للانتقال إلى قاعدة بيانات حقيقية (Supabase) مستقبلاً.
- **Data Layer:** بيانات علائقية (Relational) مقسمة إلى `levels.json`, `lessons.json`, `words.json`, `categories.json`.
- **State Management:** الاعتماد على `Zustand` لإدارة الحالة العامة (المفضلة، تقدم الدروس، ونظام الـ Audio Queue).
- **UI System:** استخدام `shadcn/ui` و `Tailwind CSS v4` و `Framer Motion` للحركات البصرية.

## 🚀 كيفية التشغيل (Setup Guide)

1. **تثبيت الحزم:**
```bash
npm install
```

2. **التحقق من صحة البيانات (Content Validation):**
```bash
npm run prebuild
```

3. **تشغيل بيئة التطوير:**
```bash
npm run dev
```

## ✍️ إدارة المحتوى (Content Management)
بدلاً من إضافة الكلمات يدوياً في ملفات JSON والمخاطرة بالأخطاء، يمكنك استخدام الـ CLI المدمج:
```bash
npm run create:word
```
سيقوم السكربت بإنشاء الـ ID تلقائياً وإضافته لملف `words.json`.

كما يتم فحص جميع الملفات تلقائياً (Zod Validation) أثناء البناء (`build`) للتأكد من عدم وجود أخطاء علائقية (Relation Errors) أو حقول مفقودة.

## 📈 الجاهزية للإنتاج (Production Readiness)
- **SEO & PWA:** المنصة تحتوي على `sitemap.ts`, `robots.ts`, و `manifest.ts` وتدعم محركات البحث بشكل كامل.
- **Analytics:** تم تجهيز طبقة `src/lib/analytics.ts` يمكن ربطها لاحقاً بـ PostHog أو Google Analytics بأسطر قليلة.
- **Accessibility (a11y):** جميع الأزرار تحتوي على `aria-label` و `Focus States` لدعم قارئات الشاشة واستخدام لوحة المفاتيح.

## 🛤️ خارطة الطريق (Roadmap)
- [ ] استبدال `WebSpeech API` بـ `ElevenLabs API` لصوت بشري 100%.
- [ ] ترحيل الـ JSON إلى `Supabase` لدعم حسابات المستخدمين (Authentication).
- [ ] إضافة نظام Streak ومكافآت يومية لتحفيز الاستمرارية.

---
**تم التطوير بإتقان بواسطة الذكاء الاصطناعي.**
