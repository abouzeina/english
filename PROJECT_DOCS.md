# Wafi (وافي) - Complete Project Documentation

> **Platform**: English learning platform designed for Arabic speakers & Quran teachers
> **Stack**: Next.js 16.2.5 · React 19 · TypeScript · Firebase · Zustand · Tailwind v4 · Framer Motion · Shadcn UI (base-nova)
> **Deployment**: Vercel
> **Direction**: RTL (Arabic-first UI)

---

## 1. Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build (runs content validation first via prebuild)
npm run build

# Create a new word entry
npm run create:word
```

**Environment Variables** (`.env.local`):
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=english-c58f5.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=english-c58f5
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=english-c58f5.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

---

## 2. Project Structure

```
english-platform/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth route group (login, signup)
│   │   │   ├── layout.tsx      # Centered layout with decorative bg
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (main)/             # Main app route group
│   │   │   ├── layout.tsx      # Client-side: navbar, footer, page transitions
│   │   │   ├── page.tsx        # Landing/home page with hero section
│   │   │   ├── levels/         # Level listing & detail pages
│   │   │   ├── lessons/[id]/   # Individual lesson page
│   │   │   ├── dashboard/      # User progress dashboard
│   │   │   ├── favorites/      # Saved words page
│   │   │   ├── review/         # SRS review session page
│   │   │   ├── profile/        # User profile page
│   │   │   ├── quran-guide/    # Quran teacher guide section
│   │   │   └── teacher-guide/  # Teacher guide (empty, placeholder)
│   │   ├── layout.tsx          # Root layout (providers, fonts, metadata)
│   │   ├── globals.css         # Design system (OKLCH colors, utilities)
│   │   ├── manifest.ts         # PWA manifest
│   │   ├── sitemap.ts          # SEO sitemap
│   │   ├── robots.ts           # SEO robots
│   │   ├── error.tsx           # Error boundary page
│   │   └── global-error.tsx    # Global error boundary
│   │
│   ├── components/
│   │   ├── features/           # Core learning components
│   │   │   ├── Flashcard.tsx   # Main flashcard (469 lines, biggest component)
│   │   │   ├── LessonViewer.tsx# Lesson display with 3 modes
│   │   │   ├── ListeningMode.tsx# Auto-play listening mode
│   │   │   ├── QuizEngine.tsx  # Quiz system with scoring
│   │   │   ├── SpeakingPractice.tsx # Mic-based pronunciation practice
│   │   │   ├── YouGlishWidget.tsx   # YouTube pronunciation examples
│   │   │   ├── quran-guide/    # (empty, placeholder)
│   │   │   └── teacher-guide/  # (empty, placeholder)
│   │   ├── ui/                 # Shadcn UI primitives
│   │   │   ├── button.tsx, card.tsx, command.tsx, dialog.tsx
│   │   │   ├── input.tsx, input-group.tsx, sheet.tsx
│   │   │   ├── slider.tsx, sonner.tsx, tabs.tsx, textarea.tsx
│   │   ├── auth/               # Auth-related components
│   │   │   ├── guest-notice.tsx    # Banner for non-logged-in users
│   │   │   ├── hydration-boundary.tsx # SSR hydration safety
│   │   │   └── sync-manager.tsx    # Firestore sync orchestrator (241 lines)
│   │   ├── shared/
│   │   │   └── AudioPlayer.tsx # Shared audio player
│   │   ├── error-boundaries/   # Error boundary wrappers
│   │   ├── auth-provider.tsx   # Firebase auth listener
│   │   ├── theme-provider.tsx  # next-themes wrapper
│   │   ├── theme-toggle.tsx    # Dark/light toggle
│   │   ├── global-search.tsx   # Cmd+K search dialog
│   │   ├── footer.tsx          # Site footer
│   │   ├── page-transition.tsx # Framer Motion page transitions
│   │   ├── route-progress.tsx  # NProgress route loading bar
│   │   └── sync-status-badge.tsx # Cloud sync status indicator
│   │
│   ├── lib/
│   │   ├── content/
│   │   │   ├── loader.ts       # Server-side JSON file reader with cache
│   │   │   └── actions.ts      # Server Actions (getLevels, searchWords, etc.)
│   │   ├── firebase/
│   │   │   ├── config.ts       # Firebase init (auth + Firestore + persistence)
│   │   │   ├── auth-service.ts # Auth helpers (login, logout, token)
│   │   │   └── sync-engine.ts  # Debounced batch Firestore writer (singleton)
│   │   ├── validation/
│   │   │   └── content-schemas.ts # Zod schemas for content validation
│   │   ├── teacher-guide/      # Teacher guide data loader
│   │   ├── srs.ts              # SM-2 spaced repetition algorithm
│   │   ├── speech-service.ts   # Speech recognition abstraction
│   │   ├── analytics.ts        # Analytics event system (placeholder)
│   │   └── utils.ts            # cn() utility (clsx + tailwind-merge)
│   │
│   ├── hooks/
│   │   ├── useAudio.ts         # Web Speech API audio playback
│   │   ├── useSpeechPractice.ts# Speech recognition + scoring hook
│   │   └── use-debounce.ts     # Debounce utility hook
│   │
│   ├── store/                  # Zustand state management
│   │   ├── useAppStore.ts      # Main store (progress, favorites, SRS, sessions)
│   │   ├── useAuthStore.ts     # Auth state (user, loading, initialized)
│   │   ├── useSyncStore.ts     # Sync state (online, syncing, pending changes)
│   │   └── useAudioQueue.ts    # Audio playback queue with Web Speech backend
│   │
│   ├── services/
│   │   └── speech/
│   │       ├── SpeechProvider.ts     # Interface for speech recognition
│   │       └── WebSpeechProvider.ts  # Web Speech API implementation
│   │
│   ├── utils/
│   │   ├── audioVoice.ts       # Best English voice selector
│   │   └── speechScoring.ts    # Levenshtein-based pronunciation scoring
│   │
│   ├── types/
│   │   └── index.ts            # Core TypeScript interfaces
│   │
│   ├── data/                   # Static content data (JSON)
│   │   ├── content/            # Segmented content (production)
│   │   │   ├── levels.json     # All 5 levels metadata
│   │   │   ├── categories.json
│   │   │   ├── search-index.json # ~1MB search index
│   │   │   ├── a1/, a2/, b1/, b2/, c1/  # Per-level folders
│   │   │   │   ├── metadata.json
│   │   │   │   ├── lessons-index.json
│   │   │   │   └── lessons/    # Individual lesson JSON files
│   │   │   └── categories/
│   │   ├── words.json          # Legacy monolithic word file
│   │   ├── lessons.json        # Legacy monolithic lesson file
│   │   ├── levels.json         # Legacy (only A1, A2)
│   │   └── teacher-guide/      # Teacher guide data
│   │
│   └── proxy.ts                # API proxy helper
│
├── scripts/                    # Build & data pipeline scripts
│   ├── validate-content.ts     # Pre-build content validation (Zod)
│   ├── import-a1-data.ts       # A1 level import pipeline
│   ├── import-a2-data.ts       # A2 level import pipeline
│   ├── import-b1-data.ts       # B1 level import pipeline
│   ├── import-b2-data.ts       # B2 level import pipeline
│   ├── import-c1-data.ts       # C1 level import pipeline
│   ├── import-content.ts       # General content importer
│   ├── create-word.ts          # CLI word creation tool
│   ├── segment-data.ts         # Split monolithic → segmented files
│   ├── merge-data.ts           # Merge recovered data
│   ├── generate-final-data.ts  # Generate final production data
│   ├── audit-oxford.ts         # Oxford 5000 alignment audit
│   ├── level-audit.ts          # Level content audit
│   ├── ipa-backfill.ts         # IPA pronunciation backfill
│   ├── localize-lessons.ts     # Lesson localization
│   ├── parse-teacher-guide.*   # Teacher guide PDF parser
│   ├── performance-test.ts     # Performance testing
│   └── gap-recovery/           # Oxford 5000 gap recovery pipeline
│       └── 3-generate-content.ts
│
├── data/                       # Raw/reference data
│   ├── oxford/                 # Oxford vocabulary reference
│   ├── raw/                    # Raw source data
│   ├── structured/             # Structured intermediate data
│   └── teacher-guide/          # Teacher guide source PDFs
│
├── public/images/              # Static images
├── firestore.rules             # Firestore security rules
├── components.json             # Shadcn UI config
├── next.config.ts              # Next.js config (minimal)
├── tsconfig.json               # TypeScript config (strict, path aliases)
└── package.json                # Dependencies & scripts
```

---

## 3. Architecture Deep Dive

### 3.1 Content System (Most Critical)

Content is **100% static JSON** — no database for content. Everything is read from `src/data/content/` at build/request time.

**Content hierarchy:**
```
levels.json → [a1, a2, b1, b2, c1] folders
  └── metadata.json (level info)
  └── lessons-index.json (array of lesson summaries)
  └── lessons/
      └── lsn_xxx.json (full lesson with words array)
```

**Content Loader** (`src/lib/content/loader.ts`):
- Runs **server-side only** (uses `fs` module)
- In-memory cache (`Record<string, any>`) to avoid re-reads
- Functions: `getLevels()`, `getLevel(slug)`, `getLessons(levelSlug)`, `getLesson(levelSlug, lessonSlug)`, `searchWords(query)`
- Search uses a pre-built `search-index.json` (~1MB) with normalized text matching
- Search is capped at 30 results with exact→prefix→contains sorting

**Server Actions** (`src/lib/content/actions.ts`):
- `'use server'` wrapper around loader functions
- Safely importable by client components
- `fetchWordsByIds()` — resolves word IDs to full WordItem objects by traversing lessons

**Content Validation** (`scripts/validate-content.ts`):
- Runs automatically before every build (`prebuild` script)
- Validates against Zod schemas in `src/lib/validation/content-schemas.ts`
- Checks: schema conformance, duplicate IDs, relational integrity (levelId→level exists, etc.)
- Exits with code 1 on failure → blocks deployment

**ID Conventions:**
- Levels: `lvl_1`, `lvl_2`, `lvl_b1`, `lvl_b2`, `lvl_c1`
- Lessons: `lsn_xxx` (e.g., `lsn_a1_001`)
- Words: `w_xxx`
- Categories: `cat_xxx`

### 3.2 Data Levels

| Level | Slug | Words | Lessons | Status |
|-------|------|-------|---------|--------|
| A1 Beginner | `a1` | 935 | 51 | ✅ Complete |
| A2 Elementary | `a2` | 800 | 45 | ✅ Complete |
| B1 Intermediate | `b1` | 862 | 45 | ✅ Complete |
| B2 Upper Intermediate | `b2` | 1455 | 70 | ✅ Complete |
| C1 Advanced | `c1` | 1393 | 70 | ✅ Complete |
| **Total** | | **~5445** | **281** | |

All content aligned to **Oxford 5000** vocabulary list.

### 3.3 TypeScript Types

```typescript
interface Level {
  id: string; slug: string;
  name: string; nameAr: string;
  description: string; descriptionAr: string;
  wordCount?: number;
}

interface Lesson {
  id: string; levelId: string; slug: string;
  title: string; titleAr: string;
  description: string; descriptionAr: string;
  order: number; wordCount?: number;
}

interface WordItem {
  id: string;
  lessonId: string | null;
  categoryId: string | null;
  en: string; ar: string;
  exampleEn?: string; exampleAr?: string;
  examples?: { en: string; ar: string }[];
  audioUrl?: string;
  tags?: string[];
}

interface Category {
  id: string; slug: string;
  title: string; titleAr: string;
  type: string;
  subcategories?: { id: string; titleAr: string; wordCount: number; words: any[] }[];
}
```

---

## 4. State Management (Zustand)

### 4.1 `useAppStore` — Main Store (persisted to localStorage)

**Storage key**: `wafi-learning-storage-v4`

**State:**
- `userWords: Record<string, SRSMetadata>` — per-word learning data
- `favorites: string[]` — favorited word IDs
- `completedLessons: string[]` — completed lesson IDs
- `lastStudiedLesson: string | null`
- `xp: number`, `streak: number`, `lastActivityDate: string | null`
- `currentSession: SessionStats | null` — active review session
- `modifiedWords: Record<string, boolean>` — dirty tracking for sync

**Key Actions:**
- `toggleFavorite(id)`, `markLessonCompleted(id)`
- `updateWordProgress(wordId, quality)` — runs SM-2 algorithm, updates XP/streak
- `getReviewQueue()` — returns word IDs due for review
- `getFocusWords()` — returns weak words needing extra practice
- `startSession()`, `endSession()` — review session lifecycle

**Hydration Safety**: `useWafiStore<T>(selector)` — custom hook that handles SSR hydration mismatch by deferring first render.

### 4.2 `useAuthStore` — Auth State (not persisted)
- `user: User | null`, `isLoading`, `isInitialized`, `error`

### 4.3 `useSyncStore` — Sync State (not persisted)
- `isOnline`, `isSyncing`, `lastSyncedAt`, `pendingChanges`

### 4.4 `useAudioQueue` — Audio Playback (not persisted)
- Queue-based audio system with `WebSpeechBackend`
- Supports: `playItem()`, `playQueue()`, `stopAll()`, `pauseQueue()`, `resumeQueue()`, `next()`, `prev()`
- Backend is **swappable** via `AudioBackend` interface (for future ElevenLabs/Azure)

---

## 5. Firebase Integration

### 5.1 Configuration (`src/lib/firebase/config.ts`)
- **Build Safety**: If API key is missing (e.g., during Vercel build), provides mock objects to prevent crashes
- **Persistence**: `browserLocalPersistence` for auth, `enableIndexedDbPersistence` for Firestore (offline support)
- **Multi-tab**: Handles `failed-precondition` error gracefully

### 5.2 Auth Flow
- **Provider**: `AuthProvider` component listens to `onAuthStateChanged`
- Sets Firebase user in Zustand store
- Sets `wafi_token` cookie for potential middleware use
- Supports **guest mode** — all features work without login (data stays in localStorage)

### 5.3 Sync Engine (`src/lib/firebase/sync-engine.ts`)
- **Singleton** pattern with debounced batch writes (5 second debounce)
- Two queues: `queue` (general docs) and `wordQueue` (individual words)
- Uses Firestore `writeBatch()` for atomic writes
- Re-queues on failure; auto-syncs when coming back online
- Updates `useSyncStore` for UI feedback

### 5.4 Sync Manager (`src/components/auth/sync-manager.tsx`)
- **Headless component** (renders `null`)
- **Initial Sync**: On login, performs data migration from localStorage → Firestore
- **Migration V1**: Push all local state to Firestore (single docs)
- **Migration V2**: Split SRS single doc → individual word sub-collection (Firestore 1MB limit)
- **Pull**: Merges remote data with local using `resolveSRSConflict()` (newest wins)
- **Real-time Listeners**: `onSnapshot` for progress and favorites
- **Continuous Sync**: Watches Zustand state changes, enqueues to SyncEngine
- **Tab Close Safety**: `beforeunload` forces sync attempt

### 5.5 Firestore Data Structure
```
users/{userId}/
  ├── (root doc)     → { migrationCompleted, migrationV2Completed }
  ├── progress/data  → { xp, streak, completedLessons, lastActivityDate }
  ├── favorites/data → { list: string[] }
  └── words/{wordId} → { ...SRSMetadata, _syncTimestamp }
```

### 5.6 Security Rules
- Only authenticated users can read/write their own data
- Sub-collections inherit parent access rules
- Everything else is denied by default

---

## 6. Core Components

### 6.1 Flashcard (`src/components/features/Flashcard.tsx`)
The biggest and most important component (469 lines). Features:
- **Two modes**: `study` (audio controls) and `review` (SRS rating buttons: Forgot/Hard/Easy)
- **Listen-First mode**: Hides text, shows "Listen first..." with eye icon
- **Expand modal**: Click to open full-screen portal with examples, speaking practice, YouGlish
- **AudioControls**: Memoized sub-component with repeat (1x/3x/5x/10x) and speed (0.75x/1x/1.25x)
- **Performance**: Uses `memo()`, atomic Zustand selectors, memoized callbacks
- **Portal rendering**: Modal uses `createPortal(document.body)` to avoid scroll/z-index issues

### 6.2 LessonViewer (`src/components/features/LessonViewer.tsx`)
Three study modes with tab switching:
1. **Flashcards** — Grid of Flashcard components + "Mark Complete" button
2. **Listening** — Auto-play through all words (dynamically imported)
3. **Quiz** — Interactive quiz engine (dynamically imported)
- Mobile: Fixed bottom tab bar for mode switching

### 6.3 QuizEngine (`src/components/features/QuizEngine.tsx`)
- Generates questions from lesson words (translation or listening type)
- 4 multiple-choice options per question
- XP scoring (10 per correct)
- Auto-advances on correct, shows correct answer on wrong
- Marks lesson as completed when finished
- Wrapped in `QuizErrorBoundary`

### 6.4 SpeakingPractice (`src/components/features/SpeakingPractice.tsx`)
- "Warming up" phase while mic initializes (prevents cutting first word)
- Records audio via `MediaRecorder` for playback ("اسمع صوتي")
- Word-by-word accuracy visualization (green=correct, red=error, gray=missed, yellow=extra)
- Privacy note: "Voice is processed locally and never stored"

### 6.5 GlobalSearch (`src/components/global-search.tsx`)
- `Cmd+K` / `Ctrl+K` shortcut to open
- Debounced server action search (300ms)
- Uses `cmdk` library for command palette UI
- Navigates to lesson page on word selection
- Wrapped in `SearchErrorBoundary`

---

## 7. SRS Algorithm (`src/lib/srs.ts`)

Implementation of **SM-2 (SuperMemo 2)** spaced repetition:

**Quality Mapping**: 0=Forgot, 1=Hard, 2=Easy → SM-2 scale: 0, 3, 5

**Learning States**: `new` → `learning` → `reviewing` → `mastered` (≥8 repetitions)

**SRSMetadata**:
```typescript
{
  easeFactor: number;     // Starting 2.5, min 1.3
  interval: number;       // Days until next review
  repetitions: number;    // Consecutive correct answers
  nextReview: string;     // ISO date string
  lastReview?: string;
  state: 'new' | 'learning' | 'reviewing' | 'mastered';
  history: number[];      // Last 10 quality scores
  accuracy: number;       // 0-1 based on history
  failCount: number;
  totalReviews: number;
}
```

**Focus Words**: Words with <60% accuracy OR most recent answer was "Forgot" (after ≥3 reviews).

---

## 8. Audio System

### Voice Selection (`src/utils/audioVoice.ts`)
Priority: Google US/UK → Microsoft Natural → Any online English → Any English → First available. Cached after first lookup.

### Audio Queue (`src/store/useAudioQueue.ts`)
- `WebSpeechBackend` wraps `window.speechSynthesis`
- Handles overlap prevention (cancel before new speak)
- 50ms delay between cancel and new utterance (browser quirk)
- Queue auto-advances through items

### Speech Scoring (`src/utils/speechScoring.ts`)
- **Levenshtein distance** at word level (Dynamic Programming)
- Backtracking for optimal word alignment
- Returns: accuracy %, per-word status (correct/incorrect/missing/extra), pass/fail (≥80%)

---

## 9. Design System

### Color System (OKLCH)
```css
/* Light Mode */
--primary: oklch(0.6 0.12 160);        /* Emerald */
--background: oklch(0.98 0.01 240);
--foreground: oklch(0.25 0.02 240);

/* Dark Mode - "Premium Deep Emerald Black" */
--primary: oklch(0.75 0.12 160);
--background: oklch(0.12 0.015 160);
```

### Fonts
- **Inter** (`--font-inter`): Latin text, headings
- **Cairo** (`--font-cairo`): Arabic text (`.font-cairo`)

### Custom Utilities
- `.glass-panel` — Glassmorphism with blur + gradient + border
- `.text-gradient` — Emerald→Teal gradient text
- `.transition-premium` — Smooth cubic-bezier transitions (0.4s)
- `.animate-float` — Floating animation (6s infinite)
- `.hover-lift` — Lift on hover (-4px)

### Component Style
- Heavy use of rounded corners (`rounded-2xl`, `rounded-[2.5rem]`, `rounded-[3rem]`)
- Consistent use of `border-white/5` for subtle borders
- `bg-secondary/30` patterns for subtle backgrounds
- Framer Motion for all page/component animations

---

## 10. Routing & Pages

| Route | Type | Description |
|-------|------|-------------|
| `/` | Client | Landing page with hero, features, CTA |
| `/levels` | Server→Client | All 5 levels grid (server fetches metadata) |
| `/levels/[id]` | Server→Client | Level detail with lesson list |
| `/lessons/[id]` | Server | Lesson viewer (flashcards/listening/quiz) |
| `/dashboard` | Server→Client | Progress stats, focus words, review CTA |
| `/favorites` | Client | Favorited words list |
| `/review` | Client | SRS review session (swipe through due words) |
| `/profile` | Client | User profile, settings, logout |
| `/quran-guide` | Server→Client | Quran teacher vocabulary guide |
| `/login` | Client | Firebase email auth login |
| `/signup` | Client | Firebase email auth signup |

**Pattern**: Server Components fetch data → pass to Client Components for interactivity.

---

## 11. Build & Scripts

### Build Pipeline
```
npm run build
  → prebuild: tsx scripts/validate-content.ts (Zod validation)
  → next build (generates .next output)
```

### Import Scripts (in `scripts/`)
Each level has its own import script (`import-a1-data.ts` through `import-c1-data.ts`):
1. Reads raw vocabulary data
2. Validates with Zod schemas
3. Generates deterministic IDs
4. Chunks words into lessons (~20 words each)
5. Creates segmented JSON files in `src/data/content/{level}/`
6. Rebuilds `search-index.json`

### Data Pipeline Scripts
- `audit-oxford.ts` — Compares platform words against Oxford 5000 list
- `ipa-backfill.ts` — Fills missing IPA pronunciations
- `gap-recovery/` — Multi-step pipeline to recover missing Oxford words
- `segment-data.ts` — Converts monolithic JSON to per-level/per-lesson files
- `merge-data.ts` — Merges multiple data sources

---

## 12. Key Patterns & Conventions

### Server vs Client Components
- Pages that need data: **Server Component** fetches, passes props to **Client Component** (suffix `Client.tsx`)
- Example: `levels/page.tsx` (server) → `LevelsClient.tsx` (client)

### Hydration Safety
- `useWafiStore()` custom hook prevents SSR/client mismatch
- `HydrationBoundary` component wraps app
- `suppressHydrationWarning` on html/body tags
- Components that need browser APIs use `useEffect(() => setMounted(true), [])`

### Error Handling
- `BaseErrorBoundary` with specialized wrappers (`QuizErrorBoundary`, `SearchErrorBoundary`)
- Global `error.tsx` and `global-error.tsx` for page-level errors
- Firebase config gracefully degrades with mock objects during build

### Performance Optimizations
- `memo()` on Flashcard and AudioControls
- Atomic Zustand selectors (subscribe to specific fields only)
- `useCallback` on all event handlers
- Dynamic imports for heavy components (ListeningMode, QuizEngine)
- Content loader uses in-memory cache
- Search capped at 30 results

### Naming
- Arabic text: `nameAr`, `titleAr`, `descriptionAr`
- Slugs: lowercase short identifiers (a1, a2, b1, etc.)
- CSS: Tailwind utilities + custom utility classes

---

## 13. Deployment (Vercel)

- `.vercel/` directory exists (connected to Vercel project)
- Build command: `npm run build` (includes prebuild validation)
- Firebase config provided via Vercel environment variables
- `scratch/` directory excluded from TypeScript compilation (tsconfig `exclude`)
- Static content is bundled with the app (no external CMS)

---

## 14. Known Technical Details

1. **Two `levels.json` files**: `src/data/levels.json` (legacy, only A1+A2) and `src/data/content/levels.json` (production, all 5 levels). The content loader uses `src/data/content/`.

2. **Legacy monolithic files**: `src/data/words.json`, `lessons.json` still exist but the app uses segmented files in `content/`.

3. **Firebase offline**: IndexedDB persistence enabled for Firestore. SyncEngine re-queues failed writes and auto-syncs when online.

4. **Firestore migration**: Two migration phases tracked by flags on user doc. V1=localStorage→Firestore, V2=single SRS doc→per-word collection.

5. **Audio**: Uses Web Speech API only (no audio files). Voice quality depends on user's browser/OS.

6. **Speech Recognition**: Web Speech API only. `SpeechProvider` interface exists for future providers.

7. **PWA**: Manifest exists but no service worker implementation yet.

8. **Analytics**: Event system scaffolded but sends to `console.log` only. Ready for PostHog/Plausible integration.

9. **Tailwind v4**: Uses `@import "tailwindcss"` syntax (not v3 `@tailwind` directives). Shadcn uses `base-nova` style.

10. **Next.js 16**: May have breaking changes from training data. Check `node_modules/next/dist/docs/` for current API docs.

---

## 15. Files Not To Touch

- `src/data/content/**/*.json` — Generated by import scripts, don't hand-edit
- `search-index.json` — Auto-generated, ~1MB
- `tsconfig.tsbuildinfo` — TypeScript incremental build cache
- `.next/` — Build output
- Root-level `*.json` reports — Audit/import artifacts (can be cleaned up)
