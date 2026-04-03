---
name: SplitLedger Project Status
description: Current build status and architecture of SplitLedger expense splitting app
type: project
---

SplitLedger is a full-stack Next.js 16 expense tracking and splitting app being built at C:\Users\parthrm\Documents\Projects\splitto.

**Why:** Building a production-grade Splitwise-style app with the full tech stack as defined in the project prompt.

**How to apply:** When continuing this project, check this memory for current state and resume from where we left off.

## Build Status (as of 2026-04-01)

### Completed (Phases 1-6):
- All npm dependencies installed (94 TypeScript source files created)
- Database schema defined with Drizzle ORM (8 tables: users, groups, group_members, expenses, expense_splits, settlements, group_invites, activity_log)
- Migration generated at src/lib/db/migrations/
- Mock auth system (getCurrentUser via cookie `splitledger-current-user`)
- Seed script at src/lib/db/seed.ts (4 demo users + Japan trip group)
- Complete app layout (sidebar, mobile nav, header, page transitions)
- UserSwitcher component (dropdown in header)
- All server actions (expenses, groups, settlements, invites, users, activity)
- Group CRUD pages
- Expense form with all 5 split types (equal, exact, percentage, shares, adjustment)
- Balance calculation & debt simplification algorithm
- Settlement recording and history
- Analytics page with 4 Recharts charts
- PDF export via @react-pdf/renderer
- Invite system with token-based links
- Activity feed page
- Dark mode support

### Blocked:
- Database connection failing — wrong credentials in .env.local
- Current: `postgresql://postgres:password@localhost:5432/splitledger`
- Need: correct PostgreSQL credentials from user

### Key Scripts:
- `pnpm dev` — start dev server (runs on localhost:3000)
- `pnpm db:push` — push schema to PostgreSQL
- `pnpm db:seed` — seed demo data (4 users, Japan trip group, sample expenses)
- `pnpm db:generate` — generate new migrations

### Tech Stack:
Next.js 16, TypeScript strict, Tailwind v4, shadcn/ui, framer-motion, Drizzle ORM + PostgreSQL, Zod v4, Zustand, TanStack Query v5, Recharts, @react-pdf/renderer, currency.js, date-fns, sonner

### Architecture Notes:
- Route groups: `(dashboard)` layout wraps all main pages
- Server Components fetch data; Client Components handle interactions
- `getCurrentUser()` in src/lib/auth.ts is the single auth point (TODO: replace with real auth)
- All server actions return `ActionResponse<T>` = `{ success: true, data: T } | { success: false, error: string }`
- Zod v4 uses `.issues[0]` not `.errors[0]` for error access
