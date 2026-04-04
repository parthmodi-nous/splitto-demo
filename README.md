# Splitto

A group expense splitting app for tracking shared costs, calculating balances, and settling debts.

## Tech Stack

- **Framework:** Next.js with React, TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Styling:** Tailwind CSS + shadcn/ui
- **Package Manager:** pnpm

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/installation) (`npm install -g pnpm`)
- [PostgreSQL](https://www.postgresql.org/download/) running locally (or a hosted instance)

---

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd splitto
pnpm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local   # if .env.example exists, otherwise create manually
```

Add the following to `.env.local`:

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<dbname>"
```

**Example for a default local PostgreSQL install:**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/splitto"
```

Replace `postgres`, `password`, and `splitto` with your actual PostgreSQL credentials and desired database name.

### 3. Create the database

Connect to PostgreSQL and create the database:

```bash
psql -U postgres -c "CREATE DATABASE splitto;"
```

Or via `psql` interactive prompt:

```sql
CREATE DATABASE splitto;
```

### 4. Push the schema to the database

This applies the current Drizzle schema directly to your database without running migration files — the quickest way to get started locally:

```bash
pnpm db:push
```

> **Note:** `db:push` is recommended for local development. For production or team environments, use migrations (see below).

### 5. Seed the database

Populate the database with demo data: 4 sample users, a group ("Trip to Japan"), 6 expenses with different split types, a settlement, and activity log entries.

```bash
pnpm db:seed
```

Expected output:

```
🌱 Seeding database...
✅ Created 4 demo users
✅ Created demo group: Trip to Japan 🇯🇵
✅ Added all 4 members to group
✅ Created 6 sample expenses
✅ Created 1 sample settlement
✅ Created activity log entries

🎉 Seed complete!

Demo users:
  Alice Johnson  — alice@demo.com
  Bob Smith      — bob@demo.com
  Carol Williams — carol@demo.com
  Dave Brown     — dave@demo.com
```

### 6. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Scripts

| Command | Description |
|---|---|
| `pnpm db:push` | Push the current schema to the database (no migration files) |
| `pnpm db:generate` | Generate a new migration file from schema changes |
| `pnpm db:migrate` | Run all pending migration files |
| `pnpm db:seed` | Seed the database with demo data (clears existing data first) |
| `pnpm db:studio` | Open Drizzle Studio — a GUI to browse and edit your database |

---

## Using Migrations (instead of db:push)

If you prefer to track schema changes via migration files:

**Generate a migration** after changing `src/lib/db/schema.ts`:

```bash
pnpm db:generate
```

This creates a new `.sql` file in `src/lib/db/migrations/`.

**Apply all pending migrations:**

```bash
pnpm db:migrate
```

---

## Drizzle Studio

To visually inspect your database tables and data:

```bash
pnpm db:studio
```

Opens a local web UI at `https://local.drizzle.studio`.

---

## Demo Data

The seed script (`src/lib/db/seed.ts`) creates:

- **4 users:** Alice Johnson, Bob Smith, Carol Williams, Dave Brown
- **1 group:** "Trip to Japan" (with debt simplification enabled)
- **6 expenses** covering different split types:
  - Equal split — Tokyo Hotel ($480)
  - Exact split — Sushi dinner ($180)
  - Percentage split — JR Rail Pass ($560)
  - Shares split — Tokyo Disneyland ($300)
  - Equal split (partial members) — Ramen lunch ($45)
  - Equal split (JPY currency) — Akihabara electronics (¥240)
- **1 settlement:** Bob paid Alice $50
- **Activity log** entries for all above actions

> **Warning:** Running `pnpm db:seed` will delete all existing data before inserting the demo data.
