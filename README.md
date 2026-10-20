# UniPlug Ghana

A campus marketplace for students at Ghanaian tertiary institutions. Students can discover, buy, sell, exchange, lend, and borrow items within their campus communities.

## Features

- Browse listings by keyword, category, institution, campus, condition, type, and price.
- Create listings for items for sale, exchanges, lending, and giveaways.
- Save listings in the browser for quick access.
- Student accounts, profiles, messaging, offers, borrowing requests, reviews, and reports.
- Admin dashboard and moderation-oriented API routes.
- Demo data fallback for browsing when the database is unavailable.

> **Integration status:** The project uses Prisma with PostgreSQL and can use a Supabase-hosted database. Supabase Storage helpers are also present. Configure real credentials before expecting persistent database or image-upload behavior. Resend is required to deliver registration verification codes. Paystack configuration is optional and should be tested before production use.

## Technology

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4
- PostgreSQL via Prisma ORM (Supabase is supported)
- NextAuth credentials authentication
- Supabase Storage client
- Paystack and Resend configuration points

## Requirements

- Node.js 20 or later
- npm
- A PostgreSQL database for persistent data (optional for exploring the demo)

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

   On Windows PowerShell, use:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Configure the environment variables described below.

4. Generate the Prisma client:

   ```bash
   npm run db:generate
   ```

5. For a connected database, apply the Prisma schema and optionally seed demo records:

   ```bash
   npm run db:push
   npm run db:seed
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Running without a database

The homepage, marketplace listing API, categories, and institutions include demo-data fallbacks for browsing without a configured database. Database-backed account actions, listing management, messaging, and transactions require a reachable PostgreSQL database. Saved listings can be stored locally in the browser.

## Environment variables

Copy `.env.example` to `.env.local` and set only the values for integrations you intend to use.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public base URL of the app, such as `http://localhost:3000`. |
| `NEXT_PUBLIC_APP_NAME` | Display name for the app. |
| `DATABASE_URL` | PostgreSQL connection string. For Supabase, use the connection pooler URL recommended for the runtime. |
| `DIRECT_URL` | Direct PostgreSQL connection string used by Prisma for schema operations. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL, used by Supabase clients and Storage. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key. This is intended for browser use; secure access with Supabase policies. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service role key for privileged Storage operations. Never expose or commit it. |
| `AUTH_SECRET` | A unique, strong secret for NextAuth. |
| `NEXTAUTH_URL` | Canonical app URL used by authentication, such as `http://localhost:3000`. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Credentials used by the seed script for the initial admin account. Change the password after setup. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Required for email verification during signup. Verify the sender domain with Resend so messages can be delivered to users. |
| `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Optional Paystack configuration. Do not use test credentials for real transactions. |
| `MAX_FILE_SIZE` | Maximum upload size in bytes where supported. |

### Supabase database setup

1. Create a project in [Supabase](https://supabase.com/).
2. In the project settings, obtain the PostgreSQL connection strings and API credentials.
3. Set `DATABASE_URL` to the pooler connection string and `DIRECT_URL` to the direct connection string. Use the correct password and connection options provided by Supabase.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Set `SUPABASE_SERVICE_ROLE_KEY` only in server-side environment configuration. Never prefix it with `NEXT_PUBLIC_`.
6. Apply the schema with `npm run db:push`, then seed optional demo records with `npm run db:seed`.

For image uploads, create a Supabase Storage bucket named `listings` and configure its access policies intentionally. Server-side uploads use the service role key, which must remain private.

### Email verification setup

Registration sends a six-digit code through Resend. Set `RESEND_API_KEY` and `EMAIL_FROM` in `.env.local` (and in your deployment environment), and verify the sender domain in Resend. New accounts cannot sign in until the code is verified. After changing the Prisma schema, run `npm run db:push` to create the email verification table.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Generate Prisma Client and create a production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint. |
| `npm run db:generate` | Generate Prisma Client. |
| `npm run db:push` | Apply the Prisma schema to the configured database. |
| `npm run db:migrate` | Create and apply a Prisma development migration. |
| `npm run db:seed` | Seed demo institutions, categories, users, and listings. |
| `npm run db:reset` | Reset the configured database and reseed it. **This deletes database data.** |
| `npm run db:studio` | Open Prisma Studio. |

## Project layout

```text
prisma/
  schema.prisma       Database schema
  seed.ts             Demo and initial data seed
public/               Static assets
src/
  app/                Pages and API routes
  components/         Shared UI and layout components
  lib/                Auth, Prisma, Supabase, validation, and utilities
  types/              Shared TypeScript declarations
  proxy.ts            Route protection
```

## Demo accounts

The seed script defines demo student and administrator accounts. Their exact credentials are in [`prisma/seed.ts`](./prisma/seed.ts). Seed accounts are for local development only; replace default credentials and remove or disable demo accounts before production use.

## Production notes

- Set strong, unique production values for `AUTH_SECRET` and administrator credentials.
- Configure all production environment variables in the hosting provider; do not commit `.env.local`.
- Use database migrations and backups as part of deployment and operations.
- Review authentication, authorization, upload limits, Supabase Storage policies, and moderation workflows before opening the service to users.
- Verify payment and email integrations in their respective test environments before enabling them in production.

## License

No license is currently specified. Contact the repository owner before reusing or distributing this project.
