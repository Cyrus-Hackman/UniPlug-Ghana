# Student Marketplace (Ghana Tertiary Institutions)

A production-ready peer-to-peer campus marketplace designed specifically for university and tertiary students in Ghana. The platform allows students to buy, sell, exchange/swap, lend, and borrow textbooks, electronics, dorm essentials, and academic supplies within their university communities.

---

## 🚀 Key Highlights & Implemented Features

### 1. Multi-Mode Commerce
- **Buy & Sell**: Direct purchase of items with fixed or negotiable pricing in Ghana Cedis (GH₵).
- **Exchange / Swap**: Trade textbooks or gadgets with or without cash adjustment.
- **Lend & Borrow**: Daily/weekly rental rates, security deposits, lending terms, return dates, and loan tracking.
- **Free Giveaways**: Senior students donating Level 100 books and dorm gear to freshers.

### 2. Campus & Academic Localization
- **10+ Pre-Configured Ghanaian Tertiary Institutions**:
  - University of Ghana (UG - Legon, Korle-Bu, City Campus)
  - Kwame Nkrumah University of Science and Technology (KNUST - Kumasi)
  - University of Cape Coast (UCC - Cape Coast)
  - University of Education, Winneba (UEW)
  - Ashesi University (Berekuso)
  - Ghana Institute of Management and Public Administration (GIMPA)
  - University for Development Studies (UDS)
  - Accra Technical University (ATU)
  - Takoradi Technical University (TTU)
- **Campus Filters**: Browse items specifically available at your campus, hall of residence, or hostel.

### 3. Student Trust & Safety System
- **Tiered Verification**:
  - `UNVERIFIED`: Fresh signups
  - `EMAIL_VERIFIED`: Official student email domain verification (e.g. `@st.ug.edu.gh`, `@st.knust.edu.gh`)
  - `STUDENT_VERIFIED`: Student ID card verification
  - `FULLY_VERIFIED`: Complete identity verification
- **Ratings & Reviews**: 1–5 star ratings and reviews following completed campus transactions.
- **Reporting & Moderation**: Report suspicious listings or scams directly to administrators.

### 4. Real-Time Communication & Price Negotiation
- **In-App Messaging**: Instant chat tied to specific listings.
- **Price Offers & Counter-Offers**: Submit price bids, accept, reject, or counter-offer with custom amounts.
- **Transaction Tracker**: Order lifecycle tracking from agreement to physical campus meetup.

### 5. Administration & Moderation
- **Admin Dashboard** (`/admin`): Metrics on users, active listings, reported items, and safety actions.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack, Server Actions)
- **Language**: TypeScript & React 19
- **Styling**: Tailwind CSS & Modern Design Tokens (Green & Gold Ghana Palette)
- **Database & ORM**: PostgreSQL (Supabase) + Prisma ORM
- **Authentication**: NextAuth.js v5 (JWT Strategy, Credentials Provider)
- **Icons**: Lucide React
- **Payments / MoMo**: Paystack integration architecture
- **Transactional Emails**: Resend API integration

---

## 📁 Project Structure

```
student-marketplace/
├── prisma/
│   ├── schema.prisma         # Full database schema (Users, Listings, Offers, etc.)
│   └── seed.ts               # Database seed script with Ghanaian universities & items
├── public/                   # Static assets & icons
├── src/
│   ├── app/
│   │   ├── (auth)/           # Auth group
│   │   ├── admin/            # Administrative dashboard
│   │   ├── api/              # API Route handlers
│   │   │   ├── admin/        # Admin management endpoints
│   │   │   ├── auth/         # NextAuth route handlers & registration
│   │   │   ├── borrowings/   # Loan and rental endpoints
│   │   │   ├── categories/   # Category & subcategory endpoints
│   │   │   ├── conversations/# Messaging conversation endpoints
│   │   │   ├── institutions/ # Ghanaian universities & campuses
│   │   │   ├── listings/     # Listings CRUD, search, and filtering
│   │   │   ├── messages/     # In-app chat messages
│   │   │   ├── notifications/# User notifications
│   │   │   ├── offers/       # Price negotiation offers
│   │   │   ├── profile/      # User profile updates
│   │   │   ├── reports/      # Safety reports
│   │   │   ├── reviews/      # Peer ratings and reviews
│   │   │   ├── upload/       # File upload handler
│   │   │   └── users/        # User management & passwords
│   │   ├── borrowings/       # Borrowing & lending manager page
│   │   ├── dashboard/        # Student dashboard with stats
│   │   ├── favourites/       # Wishlist / saved items page
│   │   ├── listing/[slug]/   # Detailed product view & offer modal
│   │   ├── login/            # Sign in page
│   │   ├── marketplace/      # Search, filter, and discover products
│   │   ├── messages/         # Real-time chat interface
│   │   ├── my-listings/      # Manage your listings (Active, Sold, Reserved)
│   │   ├── notifications/    # Notifications center
│   │   ├── offers/           # Price offer negotiation manager
│   │   ├── profile/          # Profile redirect handler
│   │   ├── register/         # Student signup with university selection
│   │   ├── sell/             # Multi-step listing creation wizard
│   │   ├── settings/         # Profile edit & Student ID verification upload
│   │   ├── transactions/     # Purchase history & peer review submission
│   │   ├── user/[userId]/    # Public student profile with badges & feedback
│   │   ├── globals.css       # Tailwind CSS & design system tokens
│   │   ├── layout.tsx        # Root layout with Auth & Toast providers
│   │   └── page.tsx          # Homepage with featured items, search & stats
│   ├── components/
│   │   ├── layout/           # Sticky Navbar & Footer
│   │   ├── marketplace/      # ListingCard & Product components
│   │   ├── ui/               # Toast notifications & UI elements
│   │   └── providers.tsx     # SessionProvider & Global state
│   ├── lib/
│   │   ├── api-response.ts   # Standardized JSON response utilities
│   │   ├── auth.ts           # NextAuth configuration & callbacks
│   │   ├── helpers.ts        # Session & authorization helpers
│   │   ├── mock-data.ts      # Offline fallback demo data
│   │   ├── prisma.ts         # Prisma client singleton
│   │   └── utils.ts          # Ghana Cedis (GH₵) & date formatters
│   └── proxy.ts              # Route protection & role-based middleware
├── .env.example              # Environment variables template
├── .env.local                # Local environment configuration
├── next.config.ts            # Next.js configuration & image domains
├── package.json              # Dependencies and run scripts
└── tsconfig.json             # TypeScript configuration
```

---

## ⚙️ Setup & Local Installation

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **npm** or **pnpm**
- (Optional) PostgreSQL database instance or Supabase project

### 2. Clone and Install Dependencies
```bash
cd student-marketplace
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your secrets:
```env
# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Student Marketplace"

# Database (Supabase or Local PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# NextAuth.js Secret
AUTH_SECRET="generate-a-secure-random-32-char-string"
NEXTAUTH_URL="http://localhost:3000"

# Admin Seed
ADMIN_EMAIL="admin@studentmarketplace.gh"
ADMIN_PASSWORD="Admin@123456"

# Third-Party Integrations (Optional for local testing)
RESEND_API_KEY="re_your_api_key"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
PAYSTACK_SECRET_KEY="sk_test_your_key"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_your_key"
```

> **Note on Offline Testing**: The application includes a built-in fallback system (`src/lib/mock-data.ts`). Even if your database credentials are not yet configured, all public pages, browse views, filters, and search functions run smoothly for demonstration and review!

### 4. Database Setup & Seeding
Generate Prisma Client and push the schema to your database:
```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed Ghanaian institutions, categories, student accounts, and listings
npm run db:seed
```

### 5. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 👥 Demo Accounts

The database seed provides pre-configured student and admin accounts:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@studentmarketplace.gh` | `Admin@123456` | Full platform administration |
| **Student (UG)** | `kwame.mensah@st.ug.edu.gh` | `Student@123` | University of Ghana (Legon) |
| **Student (UG)** | `ama.asante@st.ug.edu.gh` | `Student@123` | University of Ghana |
| **Student (KNUST)** | `kofi.boateng@st.knust.edu.gh` | `Student@123` | KNUST (Kumasi) |
| **Student (KNUST)** | `abena.osei@st.knust.edu.gh` | `Student@123` | KNUST College of Health Sciences |
| **Student (Ashesi)** | `yaw.darko@ashesi.edu.gh` | `Student@123` | Ashesi University |

---

## 🧪 Testing Guide

1. **Marketplace Discovery**:
   - Navigate to `/marketplace`.
   - Filter by University (e.g. *University of Ghana* or *KNUST*).
   - Filter by Category (e.g. *Textbooks*, *Electronics*).
   - Test text search (e.g., search for "Calculus" or "Casio").
2. **View Listing & Offers**:
   - Click on any product (e.g., `/listing/calculus-for-engineers-stroud-7th-edition-ug001`).
   - Check pricing, seller rating, and campus meeting location.
3. **Authentication & Student Signup**:
   - Navigate to `/register`.
   - Register a new account choosing your Ghanaian institution and campus.
4. **Post an Item**:
   - Log in and visit `/sell`.
   - Select Listing Type: *Sell*, *Exchange*, *Lend*, or *Giveaway*.
5. **Manage Listings & Offers**:
   - Visit `/my-listings` to toggle items between *Active*, *Reserved*, and *Sold*.
   - Visit `/offers` to inspect received price bids, accept them, or send counter-offers.
6. **Student Verification**:
   - Visit `/settings` to verify your student email domain or upload a photo of your student ID card.

---

## 🚢 Production Deployment (Vercel + Supabase)

1. **Database**: Create a project on [Supabase](https://supabase.com). Copy the connection pooler URL into `DATABASE_URL` and direct URL into `DIRECT_URL`.
2. **Deploy to Vercel**:
   - Import the GitHub repository into Vercel.
   - Add all environment variables from `.env.local`.
   - Set Build Command: `prisma generate && next build`.
3. **Run Migrations on Production**:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```
#   U n i P l u g - G h a n a  
 #   U n i P l u g - G h a n a  
 