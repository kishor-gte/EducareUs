# 🎓 Educarrus Frontend Application

Modern, production-grade **React (JavaScript) + Vite + Tailwind CSS v4** single-page application for the **Educarrus** Higher Education Crowdfunding & Scholarship Aid Platform.

---

## ⚡ Tech Stack

- **Framework:** React 18, Vite 6
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`) with custom Educarrus Deep Navy (`#0A192F`) & Warm Gold (`#D4AF37`) design tokens
- **Routing:** React Router DOM v6
- **State & Server Cache:** TanStack React Query v5
- **Icons & Data Visualization:** Lucide React & Recharts
- **HTTP Client:** Axios with response error extraction & 401 handling
- **Notifications:** React Hot Toast

---

## 📁 Architecture Overview

```plaintext
frontend/
├── src/
│   ├── api/
│   │   └── axios.js            # Base Axios instance (baseURL: '/api', withCredentials: true)
│   ├── context/
│   │   └── AuthContext.jsx      # Global user auth state, login/register/logout methods
│   ├── components/common/
│   │   ├── Navbar.jsx          # Public navbar with dynamic auth state & admin shortcuts
│   │   ├── Footer.jsx          # Comprehensive footer with 80G tax status & links
│   │   ├── ProtectedRoute.jsx  # Role-based route guard (DONOR, BENEFICIARY, ADMIN, SUPER_ADMIN)
│   │   ├── StatCard.jsx        # Dashboard metric card with trends & icon
│   │   ├── StatusBadge.jsx     # Normalized color-coded status badges
│   │   ├── DataTable.jsx       # Reusable table with live search & pagination
│   │   ├── Modal.jsx           # Accessible dialog component
│   │   └── LoadingSpinner.jsx  # Clean SVG loader
│   ├── layouts/
│   │   ├── PublicLayout.jsx    # Navbar + Outlet + Footer
│   │   └── AdminLayout.jsx     # Collapsible 17-screen sidebar + header + telemetry status
│   ├── pages/public/
│   │   ├── LoginPage.jsx       # Auth form with one-click demo credentials
│   │   └── RegisterPage.jsx    # Donor vs. Beneficiary registration form
│   ├── pages/admin/
│   │   ├── AdminDashboard.jsx  # KPIs, Recharts 30-day donation area chart, attention alerts
│   │   ├── AdminDonations.jsx  # Donation ledger with printable 80G tax receipt modal
│   │   ├── AdminUsers.jsx      # User directory with role changes & suspension toggles
│   │   ├── AdminVerifications.jsx # Student verification review queue with document inspection modal
│   │   ├── AdminWithdrawals.jsx # Institutional fee disbursement approval with bank reference
│   │   ├── AdminAnalytics.jsx  # Financial metrics, top donors ranking & one-click CSV export
│   │   ├── AdminAuditLogs.jsx  # Immutable administrative action log with JSON payload viewer
│   │   ├── AdminSupport.jsx    # Helpdesk ticket queue with resolution notes
│   │   ├── AdminSettings.jsx   # Live platform parameters editor (platform name, 80G code)
│   │   └── AdminSystemHealth.jsx # Auto-refreshing diagnostics (PostgreSQL latency, uptime, V8 memory)
│   ├── App.jsx                 # Routing tree wrapped with Providers
│   ├── main.jsx                # DOM entrypoint
│   └── index.css               # Tailwind CSS v4 styling & theme setup
├── index.html
├── vite.config.js              # Vite config with /api proxy to http://localhost:5000
└── package.json
```

---

## 🚀 Running the Frontend

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
Make sure your backend is running on `http://localhost:5000`:
```bash
npm run dev
# App will run at: http://localhost:3000
```

All `/api/*` calls are automatically forwarded to `http://localhost:5000` via Vite's proxy, allowing HTTP-only cookies and cross-origin authentication to work seamlessly.

### 3. Production Build
```bash
npm run build
```
Creates an optimized production bundle inside `/frontend/dist`.
