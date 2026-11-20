# 🎓 Educarrus Backend API

Production-grade Node.js, Express, and PostgreSQL backend for the **Educarrus** Crowdfunding, Student Scholarship & Donation Management Platform.

---

## 🏗️ Architecture & Highlights

- **Framework:** Express (ES Modules) with strict modular layered architecture (`routes` -> `controllers` -> `services` -> `prisma`).
- **ORM & Database:** PostgreSQL with Prisma ORM, utilizing high-precision `@db.Decimal(12, 2)` for currency calculations.
- **Security:** Helmet, CORS with dynamic origins, JWT authentication via HTTP-only cookies or Bearer tokens, Bcrypt password hashing, and Express Rate Limiting.
- **Strict Validation:** Request body, query, and parameter schema enforcement with Zod.
- **Atomic Payment Flow:** Integrated with the Razorpay SDK. Webhooks and client callbacks are verified cryptographically (HMAC SHA-256) and execute inside a `prisma.$transaction` to guarantee atomicity and prevent double-counting.
- **Automated Audit Logging:** Automatic interception and recording of all state-changing `/api/admin/*` actions in the `AuditLog` table.
- **Database Telemetry:** Real-time system health checks measuring PostgreSQL round-trip latency, process uptime, and memory heap statistics.

---

## 📁 Directory Structure

```plaintext
backend/
├── prisma/
│   └── seed.js             # Initial database seeder migrating realistic prototype mock data
├── src/
│   ├── config/
│   │   ├── env.js          # Zod-validated environment configurations
│   │   ├── db.js           # Prisma client singleton
│   │   └── razorpay.js     # Razorpay payment gateway client instance
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT authentication & session verification
│   │   ├── rbacMiddleware.js   # Role-based access control (DONOR, BENEFICIARY, ADMIN, SUPER_ADMIN)
│   │   ├── auditLogger.js      # Automatic administrative audit trail recorder
│   │   ├── validateRequest.js  # Zod schema validation middleware
│   │   └── errorHandler.js    # Centralized global error handling with Prisma error parsing
│   ├── services/
│   │   ├── auth.service.js      # User registration, login, and profiles
│   │   ├── donations.service.js # Atomic payment transactions & Razorpay orders
│   │   ├── admin.service.js     # User moderation, verifications, withdrawals, settings
│   │   └── analytics.service.js # Prisma aggregate & groupBy KPI reports and trends
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── donations.controller.js
│   │   ├── webhooks.controller.js
│   │   ├── admin.controller.js
│   │   └── public.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── public.routes.js
│   │   ├── donations.routes.js
│   │   ├── webhooks.routes.js
│   │   ├── admin.routes.js
│   │   └── index.js
│   ├── app.js              # Express app setup, security middlewares, and route mounting
│   └── server.js           # Server bootstrapper with graceful shutdown handling
├── .env.example            # Sample environment variables
└── package.json
```

---

## 🚀 Setup & Execution

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+) running locally or on a cloud provider (e.g., Supabase, Neon, AWS RDS)

### 2. Configure Environment
Copy `.env.example` to `.env` and configure your database connection and secrets:
```bash
cp .env.example .env
```

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/educarrus_db?schema=public"
JWT_SECRET="your_production_grade_jwt_secret_key"
RAZORPAY_KEY_ID="rzp_test_YourKey"
RAZORPAY_KEY_SECRET="YourSecret"
RAZORPAY_WEBHOOK_SECRET="YourWebhookSecret"
```

### 3. Run Prisma Schema Migrations & Generate Client
```bash
# Validate Prisma schema
npx prisma validate

# Generate Prisma Client
npx prisma generate

# Push schema to database (development mode)
npx prisma db push
# OR run migrations
npx prisma migrate dev --name init
```

### 4. Seed the Database
```bash
npm run prisma:seed
```

**Default Seed Credentials:**
- **Super Admin:** `admin@educarrus.org` / `AdminPassword123!` (also `admin@educareus.org` / `admin@admin.com`)

### 5. Start Development Server
```bash
npm run dev
# Server will run at: http://localhost:5000
```

---

## 📡 Key API Endpoints

| Category | Method | Endpoint | Description | Auth / Access |
|---|---|---|---|---|
| **Health** | `GET` | `/health` | Basic API liveness check | Public |
| **Auth** | `POST` | `/api/auth/register` | Register new Donor or Beneficiary | Public |
| | `POST` | `/api/auth/login` | Login and receive JWT cookie & token | Public |
| | `GET` | `/api/auth/me` | Fetch authenticated user profile | Authenticated |
| **Donations** | `POST` | `/api/donations/create-order` | Create Razorpay order & pending record | Public / Donor |
| | `POST` | `/api/donations/verify` | Verify payment callback from client | Public / Donor |
| | `GET` | `/api/donations/receipt/:no` | View tax exemption 80G receipt | Public |
| **Webhooks** | `POST` | `/api/webhooks/razorpay` | Cryptographic HMAC SHA-256 webhook | Razorpay Server |
| **Admin** | `GET` | `/api/admin/system-health` | Live PostgreSQL latency & server uptime | Admin / Super Admin |
| | `GET` | `/api/admin/analytics/kpis` | KPI metrics for dashboard | Admin / Super Admin |
| | `GET` | `/api/admin/analytics/trends` | 7d, 30d, 6m, 1y donation trends | Admin / Super Admin |
| | `GET` | `/api/admin/analytics/top-donors` | Top donors ranking aggregation | Admin / Super Admin |
| | `GET` | `/api/admin/users` | List all platform users & filters | Admin / Super Admin |
| | `PATCH` | `/api/admin/users/:id` | Suspend user or change role | Super Admin |
| | `GET` | `/api/admin/verifications` | List document verification queue | Admin / Super Admin |
| | `PATCH` | `/api/admin/verifications/:id/review` | Approve/Reject student documents | Admin / Super Admin |
| | `GET` | `/api/admin/withdrawals` | Payout requests from students | Admin / Super Admin |
| | `PATCH` | `/api/admin/withdrawals/:id/review` | Approve payout with transaction ref | Admin / Super Admin |
| | `GET` | `/api/admin/audit-logs` | Filterable administrative audit log | Admin / Super Admin |
| | `GET` | `/api/admin/settings` | Get platform global settings | Admin / Super Admin |
| | `PUT` | `/api/admin/settings/:key` | Save settings (Platform name, 80G, etc.) | Super Admin |
