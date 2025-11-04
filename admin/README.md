# Admin Dashboard Frontend Setup

## Quick Start

```bash
# Navigate to admin folder
cd admin

# Install dependencies
npm install

# Start dev server (runs on port 3001)
npm run dev

# Build for production
npm run build
```

## Frontend Structure

```
admin/
├── src/
│   ├── pages/
│   │   ├── AdminLoginPage.tsx          (Admin authentication)
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx       (Overview, stats, revenue)
│   │   ├── tenants/
│   │   │   └── TenantsPage.tsx         (Manage all cafes)
│   │   ├── billing/
│   │   │   └── BillingPage.tsx         (Subscription management)
│   │   ├── payments/
│   │   │   └── PaymentsPage.tsx        (Payment processing & history)
│   │   ├── analytics/
│   │   │   └── AnalyticsPage.tsx       (Usage analytics)
│   │   ├── users/
│   │   │   └── UsersPage.tsx           (User management)
│   │   └── settings/
│   │       └── SettingsPage.tsx        (System settings)
│   ├── components/
│   │   ├── AdminNavbar.tsx
│   │   └── AdminSidebar.tsx
│   ├── api/
│   │   ├── client.ts                   (Axios with JWT)
│   │   └── services.ts                 (Admin API endpoints)
│   ├── store/
│   │   └── index.ts                    (Zustand admin store)
│   ├── types/
│   │   └── admin.types.ts              (Admin data types)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vite.config.ts
├── tsconfig.json
├── package.json
└── index.html
```

## Key Features to Implement

### 1. Dashboard (Overview)

- Total tenants count
- Total revenue this month
- Active cafes
- Pending payments
- Recent transactions
- Top performing cafes

### 2. Tenants Management

- List all cafe tenants
- Create new tenant
- View tenant details
- Activate/Deactivate tenant
- View tenant statistics
- Send messages to cafe owner

### 3. Billing & Subscriptions

- Subscription plans
- Active subscriptions by cafe
- Invoice management
- Subscription renewal dates
- Edit subscription details

### 4. Payments

- Payment processing
- Payment history
- Failed payments
- Refund management
- Revenue reports by payment method

### 5. Analytics

- System usage statistics
- Total orders processed
- Revenue trends
- User activity
- Performance metrics

### 6. Users

- Manage admin users
- Create new admin
- Reset passwords
- View audit logs
- Activity tracking

### 7. Settings

- System configuration
- Payment gateway settings
- Email templates
- API keys
- Subscription pricing

## Admin Authentication

### Login Process

```
1. Admin goes to https://admin.cafepos.com
2. Enters email + password
3. System checks if user.role = 'ADMIN' or 'SUPER_ADMIN'
4. Returns JWT with admin permissions
5. All API calls include admin JWT
```

### Create Admin User

In database (or via admin endpoint):

```sql
INSERT INTO User (
  email,
  password,
  name,
  role,
  tenantId,
  isActive
) VALUES (
  'admin@company.com',
  'hashed_password',
  'Admin Name',
  'ADMIN',
  NULL,  -- Admin has no tenant (company-level)
  true
);
```

## API Integration

### Backend Admin Endpoints (To be created)

```typescript
// Tenant Management
GET /api/v1/admin/tenants
  → Get all cafe tenants

POST /api/v1/admin/tenants
  → Create new tenant

GET /api/v1/admin/tenants/:tenantId
  → Get tenant details

PUT /api/v1/admin/tenants/:tenantId
  → Update tenant

DELETE /api/v1/admin/tenants/:tenantId
  → Deactivate/Archive tenant

// Billing
GET /api/v1/admin/billing
  → Get all billing info

GET /api/v1/admin/billing/:tenantId
  → Get cafe billing

PUT /api/v1/admin/billing/:tenantId
  → Update subscription

// Payments
GET /api/v1/admin/payments
  → Get all payments

POST /api/v1/admin/payments
  → Process payment

GET /api/v1/admin/payments/:tenantId
  → Get tenant payments

// Analytics
GET /api/v1/admin/analytics
  → System analytics

GET /api/v1/admin/analytics/:tenantId
  → Tenant analytics

// Users
GET /api/v1/admin/users
  → Get all admin users

POST /api/v1/admin/users
  → Create admin user

// Revenue
GET /api/v1/admin/revenue
  → Revenue reports
```

## Deployment

### Development

```bash
# Terminal 1: Backend on port 4000
cd backend && npm run dev

# Terminal 2: Cafe frontend on port 3000
cd frontend && npm run dev

# Terminal 3: Admin frontend on port 3001
cd admin && npm run dev
```

### Production

```bash
# Build all three
cd backend && npm run build
cd frontend && npm run build
cd admin && npm run build

# Deploy to:
# - Backend: api.cafepos.com (port 4000)
# - Frontend: app.cafepos.com (port 3000)
# - Admin: admin.cafepos.com (port 3001)
```

## Environment Setup

Create `.env` file in admin folder:

```
VITE_API_URL=http://localhost:4000/api/v1
VITE_ADMIN_API_URL=http://localhost:4000/api/v1/admin
```

## Next Steps

1. ✅ Admin frontend scaffolding created
2. ⏳ Implement page components
3. ⏳ Create API service layer
4. ⏳ Add payment gateway integration
5. ⏳ Setup admin backend endpoints
6. ⏳ Deploy to production

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **Zustand** - State management
- **TailwindCSS** - Styling
- **Recharts** - Analytics charts
- **React Hot Toast** - Notifications
