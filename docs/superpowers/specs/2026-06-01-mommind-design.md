# MomMind AI — Design Spec
**Date:** 2026-06-01  
**Status:** Approved

---

## 1. Product Overview

**MomMind AI** is a subscription-based mobile mental wellness companion for US mothers with children aged 0–4. It provides emotional support, self-reflection tools, educational content, and a daily recovery routine — without diagnosing or treating medical conditions.

**Business model:** 3-day free trial → $9.99/month.

---

## 2. Target Users

### Persona 1 — Emma, 29, First-Time Mom
- 6-week-old infant, on maternity leave
- Experiencing postpartum anxiety, sleep deprivation, identity loss
- Feels guilty for struggling, afraid to burden partner or friends
- Wants validation, not advice; wants to feel less alone at 3 AM
- Frustration: generic chatbots feel cold; therapy waitlists are 6 weeks long

### Persona 2 — Jasmine, 34, Mom of Two
- 18-month-old toddler + newborn, back at work part-time
- Overwhelmed by the mental load; feels invisible and exhausted
- Motivated to be a "good mom" but has no time for herself
- Wants quick, practical daily support — not 45-minute therapy sessions
- Frustration: journaling apps require too much effort; parenting groups feel judgmental

---

## 3. Core Problem

New mothers face an acute emotional health gap:
- **Therapists:** high cost, waitlists, scheduling friction, stigma
- **Generic AI chatbots:** no context, no empathy, no maternal focus
- **Journaling apps:** require effort and self-awareness when depleted
- **Support groups:** vulnerability in front of strangers is a high bar

MomMind fills the gap: always-on, low-friction, maternal-context-aware emotional support.

---

## 4. Value Proposition

| Feature | MomMind | Generic Chatbot | Journaling App | Therapist |
|---|---|---|---|---|
| Available at 3 AM | ✅ | ✅ | ✅ | ❌ |
| Understands motherhood context | ✅ | ❌ | ❌ | ✅ |
| Tracks mood over time | ✅ | ❌ | ✅ | ✅ |
| Daily guided recovery | ✅ | ❌ | ❌ | ✅ |
| Affordable | ✅ ($9.99) | ✅ (free) | ✅ (free) | ❌ ($150+/hr) |
| Zero scheduling friction | ✅ | ✅ | ✅ | ❌ |

---

## 5. Visual Design System

**Direction:** Soft & Feminine — warm, nurturing, non-clinical.

### Color Palette
| Token | Value | Usage |
|---|---|---|
| `primary` | `#C47CA8` | CTAs, active tabs, highlights |
| `primaryLight` | `#E8A0C8` | Buttons, user chat bubbles |
| `primarySurface` | `#F8E8F0` | Card backgrounds, screens |
| `secondary` | `#7B4F72` | Headings, serif text |
| `lavender` | `#D4C5E8` | Accents, onboarding backgrounds |
| `lavenderLight` | `#EDD5E8` | Gradient backgrounds |
| `surface` | `#FFFFFF` | Cards, inputs |
| `background` | `#FDF0F5` | App background |
| `textPrimary` | `#3D2040` | Body text |
| `textSecondary` | `#8A6080` | Subtitles, captions |
| `success` | `#6BAF8A` | Completed tasks |
| `warning` | `#F4C97A` | Mood indicators |

### Typography
- **Headings:** Georgia (serif) — warm, trustworthy
- **Body / UI:** System UI (San Francisco on iOS, Roboto on Android) — readable
- **Scale:** 12 / 14 / 16 / 18 / 24 / 32px

### Spacing
8px base unit: 4 / 8 / 12 / 16 / 24 / 32 / 48px

### Mood Emoji Set
`😀 Great` · `🙂 Okay` · `😴 Tired` · `😞 Sad` · `😫 Overwhelmed`

---

## 6. User Flow

```
Splash (1.5s)
    ↓
Onboarding (5 screens — skippable after first launch)
    ↓
Registration / Login
    ↓
Paywall (3-day free trial → $9.99/month)
    ↓
Home (Dashboard)
    ↓ (bottom tabs)
┌──────────────────────────────────┐
│  Home  │  Chat  │  Mood  │  Learn  │  Me  │
└──────────────────────────────────┘
```

---

## 7. Onboarding (5 Screens)

1. **Welcome** — "Welcome to MomMind AI" + "A supportive companion for your motherhood journey." + illustration
2. **Child Age** — Select one: 0–6 months / 6–12 months / 1–2 years / 2–4 years
3. **Primary Challenge** — Select one: Anxiety / Exhaustion / Loneliness / Guilt / Stress
4. **Goals** — Multi-select: Feel emotionally better / Reduce anxiety / Build healthy habits / Get support
5. **Personalization Summary** — Shows selected answers + "We've personalized your experience." + CTA: "Continue"

Onboarding answers stored in AsyncStorage immediately; synced to backend after registration.

---

## 8. Authentication

### Registration
- Fields: email, password, confirm password
- Validation: email format, password ≥ 8 chars, passwords match, unique email
- On success: JWT access token + refresh token stored in Expo SecureStore

### Login
- Fields: email, password

### Token Strategy
- Access token: 15-minute expiry
- Refresh token: 30-day expiry, stored in SecureStore
- Auto-refresh via Axios interceptor on 401

### Backend Endpoints
```
POST /api/v1/auth/register   → { access_token, refresh_token, user }
POST /api/v1/auth/login      → { access_token, refresh_token, user }
POST /api/v1/auth/refresh    → { access_token }
```

---

## 9. Paywall (Post-Registration)

- Shown immediately after registration (first-time only)
- Title: "Start Your Emotional Recovery Journey"
- Benefits listed: Unlimited AI conversations / Personalized recovery plans / Mood insights / Premium educational content
- Price: 3-day free trial, then $9.99/month
- CTAs: **"Start Free Trial"** (primary) / "Maybe Later" (secondary, dismisses to Home)
- MVP: mocked payment — tapping "Start Free Trial" calls `POST /api/v1/subscription` with `{ plan: "trial" }`
- Subscription states: `trial` / `active` / `expired`

---

## 10. Navigation

**5 Bottom Tabs** (Expo Router `(tabs)` layout):

| Tab | Icon | Route |
|---|---|---|
| Home | 🏠 | `/(tabs)/` |
| Chat | 💬 | `/(tabs)/chat` |
| Mood | 😊 | `/(tabs)/mood` |
| Learn | 📚 | `/(tabs)/learn` |
| Me | 👤 | `/(tabs)/me` |

Recovery Plan is a section within Home screen (not a separate tab).

---

## 11. Home Screen (Dashboard Grid)

Layout:
1. Personalized greeting — "Good morning, [name] 🌸" + streak ("Day 14 of your journey")
2. 2×2 quick-action cards:
   - Log Mood (😊) → Mood tab
   - Chat with AI (💬) → Chat tab
   - Today's Plan (📋) → inline plan section below
   - Read Today (📚) → Learn tab
3. Recovery Plan progress strip — shows today's tasks with completion count
4. Featured article card

---

## 12. AI Chat Screen

- **AI avatar:** 🌸 in a soft lavender circle
- **AI bubbles:** white, rounded, left-aligned
- **User bubbles:** `primaryLight` (#E8A0C8), right-aligned
- **Suggested reply chips:** shown below each AI message (2–3 chips max)
- **Typing indicator:** animated 3-dot pulse
- **Input bar:** rounded text input + send button
- **Session persistence:** conversation history loaded on mount
- **Subscription gate:** expired/no subscription shows upsell modal

### System Prompt
```
You are a compassionate emotional support assistant for mothers experiencing 
postpartum stress, anxiety, loneliness and emotional exhaustion.
You provide empathy, validation, reflection, and encouragement.
You never diagnose medical conditions.
You encourage professional help when appropriate.
Keep responses supportive and concise.
```

---

## 13. Mood Tracker Screen

- Daily check-in prompt at top (dismissed once logged for today)
- 5 emoji mood options (tappable)
- Optional text note
- Weekly mood chart (bar or line) below
- History list — past 7 days
- Offline-first: saved to SQLite immediately, synced when online

---

## 14. Recovery Plan (Home Section)

- Generated daily tasks (5 tasks/day seeded from a fixed set for MVP)
- Examples: Drink a glass of water / Take a 5-min walk / Box breathing / Gratitude note / Text a friend
- Checkbox completion, persisted to SQLite + synced
- Progress bar: X/5 completed

---

## 15. Learning Center

- Article list grouped by category
- Categories: Postpartum Emotions / Managing Anxiety / Self-Care / Sleep & Mood / Support Systems
- Article detail with readable typography
- Local cache in SQLite — full content stored for offline reading
- Background refresh on app foreground

---

## 16. Profile (Me) Screen

- Email, child age group, selected goals
- Subscription status + "Manage Subscription" button
- "View my answers" — shows onboarding selections
- Logout button

---

## 17. Architecture

### High-Level
```
React Native (Expo)
    ↓ TanStack Query + Zustand
Repository Layer (TypeScript interfaces)
    ↓
SQLite (offline-first local store)     ←→     Sync Service
                                                    ↓
                                          FastAPI Backend
                                                    ↓
                                          PostgreSQL + OpenAI
```

### Offline-First Rule
- All writes go to SQLite first with `sync_status: "pending"`
- Sync service runs in background, flushes pending records
- Reads come from SQLite; TanStack Query refreshes from API when online
- Conflict resolution: latest `updated_at` wins

### Zustand Stores
| Store | Responsibilities |
|---|---|
| `authStore` | JWT tokens, current user, login/logout actions |
| `userStore` | Profile data, onboarding answers |
| `subscriptionStore` | Plan status, trial expiry |
| `chatStore` | Active session, messages, loading state |
| `moodStore` | Today's mood, weekly history |
| `planStore` | Today's tasks, completion state |
| `syncStore` | Sync queue length, last sync time, network status |

---

## 18. Backend Architecture

```
backend/
  app/
    api/v1/          ← route handlers (thin)
    core/            ← config, security utils
    db/              ← SQLAlchemy engine, session
    models/          ← SQLAlchemy ORM models
    schemas/         ← Pydantic request/response models
    repositories/    ← DB query logic (no business logic)
    services/        ← business logic (auth, chat, sync)
    ai/              ← OpenAI client, prompt management
  migrations/        ← Alembic migrations
```

---

## 19. Database Schema

### PostgreSQL Tables
- **users** — id, email, password_hash, created_at, onboarding_completed, subscription_status, child_age_group, goals (JSON), primary_challenge
- **subscriptions** — id, user_id, plan (trial/active/expired), started_at, expires_at
- **mood_entries** — id, user_id, mood, note, created_at, updated_at, client_id (for dedup)
- **chat_sessions** — id, user_id, created_at, updated_at
- **chat_messages** — id, session_id, role (user/assistant), content, created_at
- **daily_plans** — id, user_id, title, completed, date, updated_at, client_id
- **articles** — id, title, category, content, updated_at
- **sync_events** — id, user_id, entity_type, entity_id, action, created_at

### SQLite Tables (mobile)
- **users** — local profile cache
- **mood_entries** — id, mood, note, created_at, updated_at, sync_status, server_id
- **daily_plans** — id, title, completed, date, updated_at, sync_status, server_id
- **articles** — id, title, category, content, updated_at, cached_at
- **sync_queue** — id, entity_type, entity_id, action, payload (JSON), created_at, retry_count

---

## 20. API Endpoints

```
Auth
  POST /api/v1/auth/register
  POST /api/v1/auth/login
  POST /api/v1/auth/refresh

Mood
  GET  /api/v1/moods          → list (paginated)
  POST /api/v1/moods          → create

Plans
  GET  /api/v1/plans          → today's tasks
  POST /api/v1/plans          → create task
  PATCH /api/v1/plans/{id}    → toggle completion

Articles
  GET  /api/v1/articles       → list
  GET  /api/v1/articles/{id}  → detail

Chat
  POST /api/v1/chat           → send message, returns AI response

Subscription
  GET  /api/v1/subscription   → current status
  POST /api/v1/subscription   → activate trial (mocked)
```

---

## 21. Folder Structure

### Frontend
```
app/
  (auth)/
    login.tsx
    register.tsx
  (onboarding)/
    index.tsx          ← 5-screen flow
  (tabs)/
    index.tsx          ← Home
    chat.tsx
    mood.tsx
    learn.tsx
    me.tsx
  paywall.tsx
  index.tsx            ← Splash / redirect logic
src/
  components/          ← shared UI (Button, Card, MoodPicker...)
  features/
    auth/
    chat/
    mood/
    plan/
    learn/
    profile/
  database/            ← SQLite setup + migrations
  repositories/        ← local DB query wrappers
  services/
    api.ts             ← Axios instance
    syncService.ts
  store/               ← Zustand stores
  hooks/               ← useAuth, useMood, etc.
  types/               ← shared TypeScript types
  constants/           ← colors, spacing, routes
  utils/
```

### Backend
```
backend/
  app/
    api/v1/
      auth.py
      moods.py
      plans.py
      articles.py
      chat.py
      subscription.py
    core/
      config.py
      security.py
    db/
      base.py
      session.py
    models/
      user.py
      mood.py
      plan.py
      article.py
      chat.py
      subscription.py
    schemas/
      auth.py
      mood.py
      plan.py
      article.py
      chat.py
      subscription.py
    repositories/
      user_repo.py
      mood_repo.py
      plan_repo.py
      article_repo.py
      chat_repo.py
    services/
      auth_service.py
      chat_service.py
      subscription_service.py
    ai/
      client.py
      prompts.py
  migrations/
  main.py
  requirements.txt
```

---

## 22. Wireframes

### Onboarding Screen 3 (Challenge)
```
┌─────────────────────────────┐
│                             │
│        [illustration]       │
│                             │
│  What's your biggest        │
│  challenge right now?       │
│                             │
│  ┌─────────────────────┐   │
│  │  😰 Anxiety          │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │  😮‍💨 Exhaustion       │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │  🥺 Loneliness       │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │  😔 Guilt            │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │  😤 Stress           │   │
│  └─────────────────────┘   │
│                             │
│       [● ● ● ○ ○]          │
└─────────────────────────────┘
```

### Home Screen
```
┌─────────────────────────────┐
│ Good morning, Sarah 🌸      │
│ Day 14 of your journey      │
│                             │
│  ┌──────────┐ ┌──────────┐ │
│  │ 😊       │ │ 💬       │ │
│  │ Log Mood │ │ Chat AI  │ │
│  └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ │
│  │ 📋       │ │ 📚       │ │
│  │ 3/5 done │ │ Read     │ │
│  └──────────┘ └──────────┘ │
│                             │
│ Today's Recovery Plan       │
│  ☑ Drink water              │
│  ☑ Breathing exercise       │
│  ☐ Short walk               │
│  ☐ Gratitude note           │
│  ☐ Text a friend            │
│  ████████░░░ 2/5            │
│                             │
│ [Featured Article Card]     │
├─────────────────────────────┤
│  🏠  │  💬  │  😊  │  📚  │  👤 │
└─────────────────────────────┘
```

### Chat Screen
```
┌─────────────────────────────┐
│ ← MomMind AI          🌸   │
├─────────────────────────────┤
│                             │
│ 🌸  I hear you. Feeling    │
│     overwhelmed after a    │
│     sleepless night is     │
│     completely normal.     │
│                             │
│    [Tell me more] [Help?]  │
│                             │
│               I haven't   │
│               slept in 3  │
│               days...     │
│                             │
│ 🌸  ● ● ●                 │
│                             │
├─────────────────────────────┤
│ [Type a message...   ] [→] │
└─────────────────────────────┘
```

### Mood Tracker
```
┌─────────────────────────────┐
│ How are you feeling today?  │
│                             │
│ 😀   🙂   😴   😞   😫    │
│                  [Tired ✓]  │
│                             │
│ Add a note (optional)       │
│ ┌─────────────────────────┐ │
│ │ Exhausted after bath... │ │
│ └─────────────────────────┘ │
│                             │
│ [Save Check-in]             │
│ ─────────────────────────── │
│ This week                   │
│  M  T  W  T  F  S  S       │
│  🙂 😴 😫 😞 😴  -   -   │
│                             │
└─────────────────────────────┘
```

### Paywall
```
┌─────────────────────────────┐
│                             │
│        [illustration]       │
│                             │
│  Start Your Emotional       │
│  Recovery Journey           │
│                             │
│  ✓ Unlimited AI conversations│
│  ✓ Personalized recovery    │
│  ✓ Mood insights            │
│  ✓ Premium content          │
│                             │
│  ┌─────────────────────┐   │
│  │  3 days FREE        │   │
│  │  then $9.99/month   │   │
│  │                     │   │
│  │  Start Free Trial   │   │
│  └─────────────────────┘   │
│                             │
│      Maybe Later            │
└─────────────────────────────┘
```

---

## 23. Implementation Phases

| Phase | Focus | Est. Time |
|---|---|---|
| 1 | Backend foundation: FastAPI setup, DB models, Alembic, seeded articles | 4h |
| 2 | Authentication: register/login/refresh endpoints + JWT | 3h |
| 3 | Mobile foundation: Expo project, navigation, design system, SQLite | 4h |
| 4 | Onboarding + Registration + Paywall screens | 4h |
| 5 | Core features: Chat, Mood Tracker, Recovery Plan, Learning Center | 8h |
| 6 | Home screen + Profile screen | 2h |
| 7 | Offline sync: SyncService + queue + background sync | 4h |
| 8 | Polish: loading states, error states, empty states | 2h |

**Total estimate: ~31h (~4 working days for one engineer)**
