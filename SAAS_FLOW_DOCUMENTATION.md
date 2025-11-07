# Café SaaS Backend - Complete API Flow Documentation

## Overview
This is a **Multi-Tenant SaaS Platform** for restaurant/café management. The system has two primary user types:
1. **Super Admin/OWNER** - Manages the platform, all subscriptions, billing, and tenants
2. **Tenant Users** - Restaurant owners/staff who use the platform to manage their operations

---

## Architecture Layers
```
Routes (Express Router)
    ↓
Controllers (Request Handlers)
    ↓
Services (Business Logic)
    ↓
Database (Prisma ORM)
```

---

## 1. AUTHENTICATION ROUTES
**Base Path:** `/api/v1/auth`

### 1.1 User Registration
- **Route:** `POST /api/v1/auth/register`
- **Access:** Public (No auth required)
- **Purpose:** Create new tenant account and user simultaneously
- **Flow:** 
  - Accept email, password, name, tenantName
  - Hash password using bcrypt
  - Create User record with tenant
  - Generate JWT access token + refresh token
  - Return tokens to client
- **Used By:** New restaurant owners signing up
- **Controller:** `AuthController.register()`
- **Service:** `AuthService.register()`

### 1.2 User Login
- **Route:** `POST /api/v1/auth/login`
- **Access:** Public
- **Purpose:** Authenticate user and issue tokens
- **Flow:**
  - Accept email + password
  - Verify user exists and password matches
  - Check if user account is active
  - Generate JWT access token + refresh token
  - Update lastLogin timestamp
  - Return tokens + user details
- **Used By:** Restaurant staff, owners logging in
- **Controller:** `AuthController.login()`
- **Service:** `AuthService.login()`

### 1.3 Token Refresh
- **Route:** `POST /api/v1/auth/refresh`
- **Access:** Public
- **Purpose:** Get new access token using refresh token
- **Flow:**
  - Accept refreshToken from request body
  - Verify refresh token validity
  - Generate new access token
  - Return new tokens
- **Used By:** Client app when access token expires (after 24h)
- **Controller:** `AuthController.refresh()`
- **Service:** `AuthService.refreshToken()`

---

## 2. TENANT MANAGEMENT ROUTES
**Base Path:** `/api/v1/tenants`

### 2.1 Create Tenant
- **Route:** `POST /api/v1/tenants`
- **Access:** Authenticated users only
- **Purpose:** Create new restaurant/café tenant (part of registration flow)
- **Flow:**
  - Verify user is authenticated
  - Accept tenant name, configuration data
  - Create tenant record in database
  - Associate user with tenant as owner
  - Return created tenant details
- **Used By:** Admin creating new restaurant
- **Controller:** `TenantController.createTenant()`
- **Service:** `TenantService.createTenant()`

### 2.2 Get All Tenants
- **Route:** `GET /api/v1/tenants`
- **Access:** Authenticated users (Super Admin sees all, others see own)
- **Purpose:** List all tenants the user can access
- **Flow:**
  - Check user role
  - If ADMIN/OWNER → return all tenants
  - If regular user → return only their tenant
  - Apply pagination + filtering
- **Used By:** Admin dashboard, user profile
- **Controller:** `TenantController.getAllTenants()`
- **Service:** `TenantService.getAllTenants()`

### 2.3 Get Tenant by ID
- **Route:** `GET /api/v1/tenants/:id`
- **Access:** Authenticated users (must belong to tenant)
- **Purpose:** Fetch specific tenant details
- **Flow:**
  - Verify user belongs to this tenant
  - Fetch tenant configuration, branches, stats
  - Return tenant data
- **Used By:** Tenant owner viewing their restaurant profile
- **Controller:** `TenantController.getTenant()`
- **Service:** `TenantService.getTenant()`

---

## 3. SUBSCRIPTION & SaaS BILLING ROUTES
**Base Path:** `/api/v1/subscriptions`

### 3.1 Get Tenant Subscription
- **Route:** `GET /api/v1/subscriptions/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Get subscription status for specific restaurant
- **Flow:**
  - Verify user belongs to this tenant OR is admin
  - Fetch subscription record (plan, status, expiry date)
  - Check if trial is active or expired
  - Calculate days remaining
  - Return subscription details
- **Used By:** Restaurant owner checking their subscription status
- **Controller:** `SubscriptionController.getSubscription()`
- **Service:** `SubscriptionService.getSubscription()`

### 3.2 Get All Subscriptions (SUPER ADMIN ONLY)
- **Route:** `GET /api/v1/subscriptions/admin`
- **Access:** Super Admin/Owner only
- **Purpose:** Dashboard view of all tenant subscriptions
- **Flow:**
  - Verify user is admin
  - Fetch all subscriptions with filters:
    - status (active, expired, trial, cancelled)
    - plan (basic, premium, enterprise)
    - search by tenant name
  - Apply pagination (page, limit)
  - Return list with metrics
- **Used By:** Super admin monitoring all restaurants
- **Controller:** `SubscriptionController.getAllSubscriptions()`
- **Service:** `SubscriptionService.getAllSubscriptions()`

### 3.3 Create Subscription (SUPER ADMIN ONLY)
- **Route:** `POST /api/v1/subscriptions/admin`
- **Access:** Super Admin only
- **Purpose:** Manually create subscription for new tenant
- **Flow:**
  - Verify admin access
  - Accept: tenantId, plan, provider, billingCycle, amount, trialDays
  - Create subscription record
  - Set trial period if trialDays > 0
  - Set expiry date based on billingCycle
  - Send welcome email with plan details
- **Used By:** Admin onboarding new restaurants
- **Controller:** `SubscriptionController.createSubscription()`
- **Service:** `SubscriptionService.createSubscription()`

### 3.4 Update Subscription (SUPER ADMIN ONLY)
- **Route:** `PATCH /api/v1/subscriptions/admin/:tenantId`
- **Access:** Super Admin only
- **Purpose:** Modify subscription plan/amount (plan upgrade/downgrade)
- **Flow:**
  - Verify admin access
  - Fetch current subscription
  - Update: plan, amount, billingCycle, status
  - Recalculate expiry date
  - Log change in audit trail
  - Send notification email to tenant
- **Used By:** Admin managing subscription changes
- **Controller:** `SubscriptionController.updateSubscription()`
- **Service:** `SubscriptionService.updateSubscription()`

### 3.5 Cancel Subscription (SUPER ADMIN ONLY)
- **Route:** `DELETE /api/v1/subscriptions/admin/:tenantId`
- **Access:** Super Admin only
- **Purpose:** Cancel restaurant subscription
- **Flow:**
  - Verify admin access
  - Check if tenant has pending payments
  - Set subscription status to "cancelled"
  - Optionally revoke access immediately or at period end
  - Send cancellation email
  - Archive tenant data
- **Used By:** Admin cancelling failing restaurants
- **Controller:** `SubscriptionController.cancelSubscription()`
- **Service:** `SubscriptionService.cancelSubscription()`

### 3.6 Get Expiring Subscriptions (SUPER ADMIN ONLY)
- **Route:** `GET /api/v1/subscriptions/admin/expiring/soon`
- **Access:** Super Admin only
- **Purpose:** Identify subscriptions expiring in next N days (for renewal reminders)
- **Flow:**
  - Query subscriptions where expiryDate is within N days
  - Filter by status = "active"
  - Return list with days remaining
  - Used for automated renewal notifications
- **Used By:** Admin renewal pipeline, cron jobs
- **Controller:** `SubscriptionController.getExpiringSubscriptions()`
- **Service:** `SubscriptionService.getExpiringSubscriptions()`

### 3.7 Get Expiring Trials (SUPER ADMIN ONLY)
- **Route:** `GET /api/v1/subscriptions/admin/trials/expiring`
- **Access:** Super Admin only
- **Purpose:** Find trials about to expire (for conversion tracking)
- **Flow:**
  - Query subscriptions where status = "trial"
  - Filter by trialExpiryDate within next N days
  - Return list ready for conversion campaign
- **Used By:** Marketing, conversion tracking
- **Controller:** `SubscriptionController.getExpiringTrials()`
- **Service:** `SubscriptionService.getExpiringTrials()`

### 3.8 Get Expired Trials (SUPER ADMIN ONLY)
- **Route:** `GET /api/v1/subscriptions/admin/trials/expired`
- **Access:** Super Admin only
- **Purpose:** Find expired trials ready to charge/convert
- **Flow:**
  - Query subscriptions where status = "trial" AND trialExpiryDate < NOW
  - Filter unpaid trials
  - Return list for automation (charge card or disable access)
- **Used By:** Billing automation, trial-to-paid conversion
- **Controller:** `SubscriptionController.getExpiredTrials()`
- **Service:** `SubscriptionService.getExpiredTrials()`

### 3.9 Get SaaS Dashboard Metrics (SUPER ADMIN ONLY)
- **Route:** `GET /api/v1/subscriptions/admin/dashboard/metrics`
- **Access:** Super Admin only
- **Purpose:** High-level SaaS metrics for admin dashboard
- **Flow:**
  - Calculate total active subscriptions
  - Calculate MRR (Monthly Recurring Revenue)
  - Calculate ARR (Annual Recurring Revenue)
  - Count trials vs paid vs cancelled
  - Return dashboard metrics
- **Used By:** Admin dashboard, business analytics
- **Controller:** `SubscriptionController.getDashboardMetrics()`
- **Service:** `SubscriptionService.getDashboardMetrics()`

---

## 4. BILLING & INVOICING ROUTES
**Base Path:** `/api/v1/billing`

### 4.1 Get Billing Summary
- **Route:** `GET /api/v1/billing/:tenantId/summary`
- **Access:** Authenticated + tenant verification
- **Purpose:** Get billing overview for restaurant
- **Flow:**
  - Verify user belongs to tenant
  - Calculate total invoices (paid, unpaid, overdue)
  - Sum payment amounts
  - Get next billing date
  - Return summary stats
- **Used By:** Restaurant owner viewing billing dashboard
- **Controller:** `BillingController.getBillingSummary()`
- **Service:** `BillingService.getBillingSummary()`

### 4.2 Get Invoices List
- **Route:** `GET /api/v1/billing/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** List all invoices for restaurant
- **Flow:**
  - Verify tenant access
  - Fetch invoices with pagination
  - Filter by status (paid, unpaid, overdue)
  - Sort by date (newest first)
  - Return invoice list
- **Used By:** Restaurant owner, accountant
- **Controller:** `BillingController.getInvoices()`
- **Service:** `BillingService.getInvoices()`

### 4.3 Create Invoice
- **Route:** `POST /api/v1/billing/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Create new invoice (manual or automated)
- **Flow:**
  - Verify tenant access
  - Accept: items[], amount, dueDate, description
  - Generate unique invoice number
  - Create invoice record
  - Send invoice email to restaurant
  - Return created invoice
- **Used By:** Admin manual invoicing, subscription billing automation
- **Controller:** `BillingController.createInvoice()`
- **Service:** `BillingService.createInvoice()`

### 4.4 Get Invoice by ID
- **Route:** `GET /api/v1/billing/:tenantId/invoices/:invoiceId`
- **Access:** Authenticated + tenant verification
- **Purpose:** View detailed invoice
- **Flow:**
  - Verify invoice belongs to tenant
  - Fetch full invoice with line items, payments
  - Return invoice details + payment history
- **Used By:** Invoice viewing, PDF generation
- **Controller:** `BillingController.getInvoiceById()`
- **Service:** `BillingService.getInvoiceById()`

### 4.5 Process Payment
- **Route:** `POST /api/v1/billing/:tenantId/invoices/:invoiceId/payments`
- **Access:** Authenticated + tenant verification
- **Purpose:** Record payment for invoice
- **Flow:**
  - Verify invoice belongs to tenant
  - Accept: amount, paymentMethod, transactionId
  - Create payment record
  - Update invoice status to "paid" if full payment
  - Send payment confirmation email
  - Return payment confirmation
- **Used By:** Restaurant paying invoice
- **Controller:** `BillingController.processPayment()`
- **Service:** `BillingService.processPayment()`

---

## 5. MENU MANAGEMENT ROUTES
**Base Path:** `/api/v1/menu`

### 5.1 Get All Menu Items
- **Route:** `GET /api/v1/menu/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** List all menu items for restaurant
- **Flow:**
  - Verify tenant access
  - Fetch menu items with pagination
  - Optional filters: category, active status
  - Return menu list
- **Used By:** Staff viewing menu, frontend app, customers
- **Controller:** `MenuController.getAllMenuItems()`
- **Service:** `MenuService.getAllMenuItems()`

### 5.2 Create Menu Item
- **Route:** `POST /api/v1/menu/:tenantId`
- **Access:** Authenticated + tenant verification (staff/owner)
- **Purpose:** Add new item to menu
- **Flow:**
  - Verify tenant access
  - Accept: name, category, price, description, image, isActive
  - Create menu item record
  - Return created item
- **Used By:** Restaurant staff adding dishes
- **Controller:** `MenuController.createMenuItem()`
- **Service:** `MenuService.createMenuItem()`

### 5.3 Get Menu Item by ID
- **Route:** `GET /api/v1/menu/:tenantId/item/:itemId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Get detailed view of single menu item
- **Flow:**
  - Verify item belongs to tenant
  - Fetch item with all details
  - Return item data
- **Used By:** Item editing, order details
- **Controller:** `MenuController.getMenuItemById()`
- **Service:** `MenuService.getMenuItemById()`

### 5.4 Update Menu Item
- **Route:** `PUT /api/v1/menu/:tenantId/:itemId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Modify menu item details
- **Flow:**
  - Verify item belongs to tenant
  - Accept: name, price, category, description, image
  - Update menu item
  - Return updated item
- **Used By:** Staff updating dish prices/details
- **Controller:** `MenuController.updateMenuItem()`
- **Service:** `MenuService.updateMenuItem()`

### 5.5 Deactivate Menu Item
- **Route:** `PATCH /api/v1/menu/:tenantId/:itemId/deactivate`
- **Access:** Authenticated + tenant verification
- **Purpose:** Hide menu item from orders (soft delete)
- **Flow:**
  - Verify item belongs to tenant
  - Set isActive = false
  - Item remains in history but not available for new orders
  - Return confirmation
- **Used By:** Staff removing out-of-stock items
- **Controller:** `MenuController.deactivateMenuItem()`
- **Service:** `MenuService.deactivateMenuItem()`

### 5.6 Get Menu Categories
- **Route:** `GET /api/v1/menu/:tenantId/categories`
- **Access:** Authenticated + tenant verification
- **Purpose:** List all distinct categories in menu
- **Flow:**
  - Fetch unique categories from menu items
  - Count items per category
  - Return category list
- **Used By:** Frontend category filter
- **Controller:** `MenuController.getMenuCategories()`
- **Service:** `MenuService.getMenuCategories()`

### 5.7 Get Menu Items by Category
- **Route:** `GET /api/v1/menu/:tenantId/category/:category`
- **Access:** Authenticated + tenant verification
- **Purpose:** Filter menu by category
- **Flow:**
  - Fetch items where category = parameter
  - Filter only active items
  - Return categorized menu
- **Used By:** Frontend menu browsing by category
- **Controller:** `MenuController.getMenuItemsByCategory()`
- **Service:** `MenuService.getMenuItemsByCategory()`

---

## 6. ORDER MANAGEMENT ROUTES
**Base Path:** `/api/v1/orders`

### 6.1 Create Order
- **Route:** `POST /api/v1/orders`
- **Access:** Authenticated + tenant verification
- **Purpose:** Create new order in system
- **Flow:**
  - Verify tenant access
  - Accept: items[], customerInfo, totalAmount, orderType (dine-in/takeaway)
  - Create order record with status = "pending"
  - Generate KOT (Kitchen Order Ticket)
  - Send to kitchen display system
  - Return order confirmation
- **Used By:** POS system, online ordering
- **Controller:** `OrderController.createOrder()`
- **Service:** `OrderService.createOrder()`

### 6.2 Get Order by ID
- **Route:** `GET /api/v1/orders/:id`
- **Access:** Authenticated + tenant verification
- **Purpose:** Get order details
- **Flow:**
  - Verify order belongs to tenant
  - Fetch order with items, payment status, KOT details
  - Return full order info
- **Used By:** Order tracking, receipt printing
- **Controller:** `OrderController.getOrder()`
- **Service:** `OrderService.getOrder()`

---

## 7. KITCHEN ORDER TICKET (KOT) ROUTES
**Base Path:** `/api/v1/kot`

### 7.1 List KOT by Branch
- **Route:** `GET /api/v1/kot/branch/:branchId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Get all KOTs for kitchen display system
- **Flow:**
  - Verify branch belongs to tenant
  - Fetch KOTs with status: pending, in-progress, ready
  - Sort by creation time (oldest first)
  - Return KOT list for kitchen
- **Used By:** Kitchen staff, kitchen display system
- **Controller:** `KOTController.listByBranch()`
- **Service:** `KOTService.listByBranch()`

### 7.2 Print KOT
- **Route:** `POST /api/v1/kot/:id/print`
- **Access:** Authenticated + tenant verification
- **Purpose:** Print kitchen ticket
- **Flow:**
  - Verify KOT belongs to tenant
  - Format KOT data for thermal printer
  - Send to printer queue service
  - Update KOT status to "printed"
  - Return print confirmation
- **Used By:** Kitchen staff printing orders
- **Controller:** `KOTController.printKOT()`
- **Service:** `KOTService.printKOT()`

---

## 8. INVENTORY MANAGEMENT ROUTES
**Base Path:** `/api/v1/inventory`

### 8.1 Get Inventory Items
- **Route:** `GET /api/v1/inventory/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** List all inventory items
- **Flow:**
  - Verify tenant access
  - Fetch items with current quantity, unit cost, valuation
  - Apply filters: category, low-stock status
  - Return inventory list
- **Used By:** Inventory manager dashboard
- **Controller:** `InventoryController.getInventoryItems()`
- **Service:** `InventoryService.getInventoryItems()`

### 8.2 Create Inventory Item
- **Route:** `POST /api/v1/inventory/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Add new item to inventory
- **Flow:**
  - Verify tenant access
  - Accept: name, sku, quantity, unit, unitCost, reorderLevel
  - Create inventory item
  - Return created item
- **Used By:** Stock management
- **Controller:** `InventoryController.createInventoryItem()`
- **Service:** `InventoryService.createInventoryItem()`

### 8.3 Update Inventory Item
- **Route:** `PUT /api/v1/inventory/:itemId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Update item quantity or details
- **Flow:**
  - Verify item belongs to tenant
  - Accept: quantity, unitCost, reorderLevel
  - Update inventory record
  - Log transaction (for audit trail)
  - Return updated item
- **Used By:** Stock adjustments, receiving goods
- **Controller:** `InventoryController.updateInventoryItem()`
- **Service:** `InventoryService.updateInventoryItem()`

### 8.4 Delete Inventory Item
- **Route:** `DELETE /api/v1/inventory/:itemId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Remove item from inventory
- **Flow:**
  - Verify item belongs to tenant
  - Mark as inactive or delete record
  - Update inventory valuation
  - Return confirmation
- **Used By:** Inventory cleanup
- **Controller:** `InventoryController.deleteInventoryItem()`
- **Service:** `InventoryService.deleteInventoryItem()`

### 8.5 Get Low Stock Items
- **Route:** `GET /api/v1/inventory/:tenantId/low-stock`
- **Access:** Authenticated + tenant verification
- **Purpose:** Alert on items needing reorder
- **Flow:**
  - Fetch items where quantity < reorderLevel
  - Include supplier info for quick ordering
  - Sort by urgency (lowest stock first)
  - Return low-stock alerts
- **Used By:** Purchase manager, alerts dashboard
- **Controller:** `InventoryController.getLowStockItems()`
- **Service:** `InventoryService.getLowStockItems()`

---

## 9. STAFF MANAGEMENT ROUTES
**Base Path:** `/api/v1/staff`

### 9.1 Get All Staff
- **Route:** `GET /api/v1/staff/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** List all staff members
- **Flow:**
  - Verify tenant access
  - Fetch staff with roles, active status
  - Apply filters: role, branch, active/inactive
  - Return staff list
- **Used By:** HR dashboard, staff management
- **Controller:** `StaffController.getAllStaff()`
- **Service:** `StaffService.getAllStaff()`

### 9.2 Create Staff
- **Route:** `POST /api/v1/staff/:tenantId`
- **Access:** Authenticated + tenant verification (manager+)
- **Purpose:** Add new staff member
- **Flow:**
  - Verify tenant access
  - Accept: name, email, phone, role, branch, salary, joinDate
  - Create staff record
  - Send welcome email with login credentials
  - Return created staff
- **Used By:** HR onboarding staff
- **Controller:** `StaffController.createStaff()`
- **Service:** `StaffService.createStaff()`

### 9.3 Get Staff by ID
- **Route:** `GET /api/v1/staff/:tenantId/:staffId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Get individual staff details
- **Flow:**
  - Verify staff belongs to tenant
  - Fetch staff with roles, permissions
  - Return staff profile
- **Used By:** Staff editing, payroll
- **Controller:** `StaffController.getStaffById()`
- **Service:** `StaffService.getStaffById()`

### 9.4 Update Staff
- **Route:** `PUT /api/v1/staff/:tenantId/:staffId`
- **Access:** Authenticated + tenant verification (manager+)
- **Purpose:** Update staff details
- **Flow:**
  - Verify staff belongs to tenant
  - Accept: name, email, phone, salary, address, etc.
  - Update staff record
  - Return updated staff
- **Used By:** HR updating staff info
- **Controller:** `StaffController.updateStaff()`
- **Service:** `StaffService.updateStaff()`

### 9.5 Deactivate Staff
- **Route:** `PATCH /api/v1/staff/:tenantId/:staffId/deactivate`
- **Access:** Authenticated + tenant verification
- **Purpose:** Deactivate staff account (resignation/termination)
- **Flow:**
  - Verify staff belongs to tenant
  - Set isActive = false
  - Revoke login credentials
  - Archive staff data
  - Return confirmation
- **Used By:** HR terminating staff
- **Controller:** `StaffController.deactivateStaff()`
- **Service:** `StaffService.deactivateStaff()`

### 9.6 Assign Role
- **Route:** `POST /api/v1/staff/:tenantId/:staffId/role`
- **Access:** Authenticated + tenant verification (owner+)
- **Purpose:** Change staff role/permissions
- **Flow:**
  - Verify staff belongs to tenant
  - Accept: newRole (manager, cashier, chef, waiter, etc.)
  - Update user role
  - Log permission change
  - Return confirmation
- **Used By:** Promoting/changing staff roles
- **Controller:** `StaffController.assignRole()`
- **Service:** `StaffService.assignRole()`

### 9.7 Get Staff by Branch
- **Route:** `GET /api/v1/staff/:tenantId/branch/:branchId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Get staff assigned to specific branch
- **Flow:**
  - Verify tenant and branch access
  - Fetch staff where branch = branchId
  - Return branch staff list
- **Used By:** Branch manager viewing team
- **Controller:** `StaffController.getStaffByBranch()`
- **Service:** `StaffService.getStaffByBranch()`

---

## 10. DASHBOARD & ANALYTICS ROUTES
**Base Path:** `/api/v1/dashboard`

### 10.1 Get Dashboard Overview
- **Route:** `GET /api/v1/dashboard/overview/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Quick snapshot of restaurant performance
- **Flow:**
  - Verify tenant access
  - Calculate today's sales, orders, customers
  - Get top items, peak hours
  - Calculate KPIs (average order value, customer count)
  - Return overview stats
- **Used By:** Owner home dashboard
- **Controller:** `DashboardController.getDashboardOverview()`
- **Service:** `DashboardService.getDashboardOverview()`

### 10.2 Get Sales Analytics
- **Route:** `GET /api/v1/dashboard/analytics/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Detailed sales analysis
- **Flow:**
  - Accept filters: startDate, endDate, granularity (daily/weekly/monthly)
  - Calculate sales by period
  - Break down by payment method, category
  - Return time-series analytics
- **Used By:** Manager analyzing sales trends
- **Controller:** `DashboardController.getSalesAnalytics()`
- **Service:** `DashboardService.getSalesAnalytics()`

### 10.3 Get Revenue Charts
- **Route:** `GET /api/v1/dashboard/charts/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Chart data for visualization
- **Flow:**
  - Generate data for: revenue trend, category breakdown, branch comparison
  - Calculate month-on-month growth
  - Return chart-ready data
- **Used By:** Frontend dashboard charts
- **Controller:** `DashboardController.getRevenueCharts()`
- **Service:** `DashboardService.getRevenueCharts()`

### 10.4 Get Top Products
- **Route:** `GET /api/v1/dashboard/top-products/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Best-selling items analysis
- **Flow:**
  - Accept filter: limit (top N), period
  - Rank items by sales volume or revenue
  - Include margin analysis
  - Return top products list
- **Used By:** Menu optimization decisions
- **Controller:** `DashboardController.getTopProducts()`
- **Service:** `DashboardService.getTopProducts()`

---

## 11. REPORTING ROUTES
**Base Path:** `/api/v1/report`

### 11.1 Get Sales Report
- **Route:** `GET /api/v1/report/sales/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Comprehensive sales report
- **Flow:**
  - Accept filters: startDate, endDate, paymentMethod, status
  - Query all orders in period
  - Calculate: total revenue, order count, average order value, discounts
  - Group by date/category/branch
  - Return detailed report
- **Used By:** Financial reporting, tax compliance
- **Controller:** `ReportController.getSalesReport()`
- **Service:** `ReportService.getSalesReport()`

### 11.2 Get Inventory Report
- **Route:** `GET /api/v1/report/inventory/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Stock level and valuation report
- **Flow:**
  - Query all inventory items
  - Calculate: total inventory value, items by category, stock aging
  - Identify: low stock, expired items, slow movers
  - Return inventory analysis
- **Used By:** Stock counting, audit compliance
- **Controller:** `ReportController.getInventoryReport()`
- **Service:** `ReportService.getInventoryReport()`

### 11.3 Get Staff Performance Report
- **Route:** `GET /api/v1/report/staff/:tenantId`
- **Access:** Authenticated + tenant verification (manager+)
- **Purpose:** Staff productivity metrics
- **Flow:**
  - Accept filter: period, staff member (optional)
  - Calculate per staff: sales processed, orders handled, hours, efficiency
  - Rank by performance
  - Return staff metrics
- **Used By:** Performance review, incentive calculation
- **Controller:** `ReportController.getStaffPerformanceReport()`
- **Service:** `ReportService.getStaffPerformanceReport()`

### 11.4 Get Payment Report
- **Route:** `GET /api/v1/report/payment/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Payment reconciliation and cash flow
- **Flow:**
  - Query all payments/invoices
  - Calculate: collected, pending, overdue amounts
  - Break down by payment method
  - Flag outstanding invoices
  - Return payment summary
- **Used By:** Accounting, cash flow management
- **Controller:** `ReportController.getPaymentReport()`
- **Service:** `ReportService.getPaymentReport()`

### 11.5 Get Dashboard Summary
- **Route:** `GET /api/v1/report/dashboard/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Executive summary of key reports
- **Flow:**
  - Aggregate data from sales, inventory, staff, payment reports
  - Highlight key metrics and alerts
  - Return high-level summary
- **Used By:** Executive dashboard, quick review
- **Controller:** `ReportController.getDashboardSummary()`
- **Service:** `ReportService.getDashboardSummary()`

### 11.6 Export Sales Data
- **Route:** `POST /api/v1/report/export/sales/:tenantId`
- **Access:** Authenticated + tenant verification
- **Purpose:** Export sales data to Excel/CSV
- **Flow:**
  - Accept filters: startDate, endDate, format (xlsx/csv)
  - Query sales data
  - Format and generate file
  - Return downloadable file URL
- **Used By:** External analysis, accounting software
- **Controller:** `ReportController.exportSalesData()`
- **Service:** `ReportService.exportSalesData()`

---

## 12. BOOKING MANAGEMENT ROUTES
**Base Path:** `/api/v1/bookings`

### 12.1 Create Booking
- **Route:** `POST /api/v1/bookings`
- **Access:** Authenticated + tenant verification
- **Purpose:** Reserve table/seat
- **Flow:**
  - Verify tenant access
  - Accept: customerName, phone, email, date, time, partySize, notes
  - Check table availability
  - Create booking record
  - Send confirmation email to customer
  - Return booking confirmation
- **Used By:** Reservation system, phone bookings
- **Controller:** `BookingController.createBooking()`
- **Service:** `BookingService.createBooking()`

### 12.2 List Bookings by Branch
- **Route:** `GET /api/v1/bookings/branch/:branchId`
- **Access:** Authenticated + tenant verification
- **Purpose:** View all bookings for branch
- **Flow:**
  - Verify branch belongs to tenant
  - Fetch bookings with filters: date, status (pending, confirmed, cancelled, served)
  - Sort by reservation time
  - Return booking list
- **Used By:** Reservation desk, host management
- **Controller:** `BookingController.listByBranch()`
- **Service:** `BookingService.listByBranch()`

---

## 13. FILE UPLOAD ROUTES
**Base Path:** `/api/v1/upload`

### 13.1 Bulk Upload
- **Route:** `POST /api/v1/upload/bulk`
- **Access:** Authenticated + tenant verification
- **Purpose:** Import data (menu items, staff, inventory) via Excel/CSV
- **Flow:**
  - Verify tenant access
  - Accept: file (multipart), uploadType (menu/staff/inventory)
  - Parse file
  - Validate data format
  - Create bulk records in database
  - Return import summary (success, errors, warnings)
- **Used By:** Data migration, bulk operations
- **Controller:** `UploadController.bulkUpload()`
- **Service:** `UploadService.bulkUpload()`

---

## SaaS ARCHITECTURE FLOW

### User Journey - New Restaurant (Tenant Signup)

```
1. POST /api/v1/auth/register
   ├─ Create User account
   ├─ Create Tenant (restaurant)
   ├─ Create default Subscription (trial)
   └─ Return JWT tokens

2. POST /api/v1/tenants (optional - admin)
   └─ Setup additional tenants

3. GET /api/v1/subscriptions/:tenantId (customer view)
   └─ Check subscription status

4. Restaurant Staff Management
   ├─ POST /api/v1/staff/:tenantId
   ├─ POST /api/v1/staff/:tenantId/:staffId/role
   └─ GET /api/v1/staff/:tenantId

5. Menu Setup
   ├─ POST /api/v1/menu/:tenantId (single item)
   └─ POST /api/v1/upload/bulk (bulk import)

6. Start Operations
   ├─ POST /api/v1/orders (create orders)
   ├─ GET /api/v1/dashboard/overview/:tenantId (monitor sales)
   └─ GET /api/v1/report/sales/:tenantId (view reports)
```

### Super Admin Flow - Subscription Management

```
1. GET /api/v1/subscriptions/admin
   └─ View all tenant subscriptions

2. POST /api/v1/subscriptions/admin
   └─ Create subscription for new tenant

3. PATCH /api/v1/subscriptions/admin/:tenantId
   └─ Upgrade/downgrade subscription

4. GET /api/v1/subscriptions/admin/expiring/soon
   └─ Identify subscriptions to renew

5. GET /api/v1/subscriptions/admin/trials/expired
   └─ Convert expired trials (charge card)

6. GET /api/v1/subscriptions/admin/dashboard/metrics
   └─ Monitor MRR, ARR, churn

7. POST /api/v1/billing/admin/:tenantId (if needed)
   └─ Create invoice for subscription
```

### Super Admin Flow - Billing Management

```
1. POST /api/v1/billing/admin/:tenantId
   └─ Create monthly subscription invoice

2. GET /api/v1/billing/admin
   └─ View all pending payments

3. Send reminder: GET unpaid > 30 days
   └─ Automated payment reminders

4. POST /api/v1/billing/:tenantId/invoices/:invoiceId/payments
   └─ Record payment when received
```

---

## MIDDLEWARE STACK

### Auth Middleware (`authMiddleware`)
- **Purpose:** Verify JWT token validity
- **Applied To:** Most protected routes (all except /auth)
- **Function:**
  - Extract token from Authorization header
  - Verify JWT signature
  - Attach user object to request
  - Reject if no token or invalid token

### Tenant Middleware (`tenantMiddleware`)
- **Purpose:** Verify user belongs to the tenant
- **Applied To:** Routes with `:tenantId` parameter
- **Function:**
  - Extract tenantId from URL params
  - Compare with user.tenantId from JWT
  - Reject if tenant mismatch
  - Protect against unauthorized tenant access

### Validate Middleware (`validateRequest`, `validateParams`, `validateQuery`)
- **Purpose:** Validate incoming request data
- **Applied To:** POST/PUT/PATCH routes
- **Function:**
  - Validate request body using Joi schemas
  - Validate URL parameters
  - Validate query parameters
  - Return 400 if validation fails

### Error Middleware (`errorMiddleware`)
- **Purpose:** Centralized error handling
- **Applied To:** Last in middleware chain (catches all errors)
- **Function:**
  - Log errors
  - Format error response
  - Return appropriate HTTP status code

### Rate Limiter Middleware (`rateLimiter.middleware`)
- **Purpose:** Prevent abuse
- **Applied To:** Auth routes, billing routes
- **Function:**
  - Limit requests per IP
  - Return 429 if rate limit exceeded

---

## DATABASE SCHEMA CONCEPTS

Based on controllers and services:

### Core Entities:
1. **User** - Login credentials, profile (email, name, password)
2. **Tenant** - Restaurant/café (name, branchCount, active status)
3. **Subscription** - SaaS plan (plan type, amount, expiry, status: active/trial/cancelled)
4. **Invoice** - Billing record (amount, dueDate, status: paid/unpaid/overdue)
5. **Menu Item** - Dish (name, price, category, active status)
6. **Order** - Customer transaction (items[], total, status, timestamp)
7. **Inventory Item** - Stock (quantity, unitCost, reorderLevel, sku)
8. **Staff** - Employee (role, branch, salary, active status)
9. **Booking** - Table reservation (date, time, partySize, status)
10. **KOT** - Kitchen Order (items to prepare, status: pending/in-progress/ready)

### Relationships:
- User → Tenant (many users per tenant)
- Tenant → Subscription (one subscription per tenant)
- Tenant → Staff (many staff per tenant)
- Tenant → Menu Item (many items per tenant)
- Tenant → Order (many orders per tenant)
- Tenant → Inventory Item (many items per tenant)
- Tenant → Invoice (many invoices per tenant)
- Tenant → Booking (many bookings per tenant)
- Tenant → KOT (many KOTs per tenant)
- Order → KOT (one KOT per order)

---

## ROLE-BASED ACCESS CONTROL (RBAC)

### Super Admin Role
- Access to ALL `/admin` endpoints
- Can manage all subscriptions, tenants, billing
- Can view all reports and analytics
- Can manage admin users

### Owner Role
- Access to own tenant data only
- Can create/manage staff
- Can create/manage menu items
- Can view own subscription
- Can view own invoices and reports

### Manager Role
- Same as Owner but limited to assigned branch
- Can create orders, view orders
- Can manage inventory
- Cannot change subscription or billing

### Staff Role
- Can create/process orders
- Can view menu items
- Limited to their assigned branch
- Cannot access financial data

### Cashier Role
- Can process payments
- Can view invoices
- Can create orders
- Cannot manage staff or inventory

---

## ENDPOINT SUMMARY TABLE

| Module | Method | Endpoint | Auth | Purpose |
|--------|--------|----------|------|---------|
| Auth | POST | /auth/register | ❌ | New user signup |
| Auth | POST | /auth/login | ❌ | User login |
| Auth | POST | /auth/refresh | ❌ | Refresh token |
| Tenant | POST | /tenants | ✅ | Create tenant |
| Tenant | GET | /tenants | ✅ | List tenants |
| Tenant | GET | /tenants/:id | ✅ | Get tenant |
| Subscription | GET | /subscriptions/:tenantId | ✅ | Get subscription |
| Subscription | GET | /subscriptions/admin | ✅🔒 | List all subscriptions |
| Subscription | POST | /subscriptions/admin | ✅🔒 | Create subscription |
| Subscription | PATCH | /subscriptions/admin/:tenantId | ✅🔒 | Update subscription |
| Subscription | DELETE | /subscriptions/admin/:tenantId | ✅🔒 | Cancel subscription |
| Subscription | GET | /subscriptions/admin/expiring/soon | ✅🔒 | Get expiring subs |
| Subscription | GET | /subscriptions/admin/trials/expiring | ✅🔒 | Get expiring trials |
| Subscription | GET | /subscriptions/admin/trials/expired | ✅🔒 | Get expired trials |
| Subscription | GET | /subscriptions/admin/dashboard/metrics | ✅🔒 | SaaS metrics |
| Billing | GET | /billing/:tenantId/summary | ✅ | Billing overview |
| Billing | GET | /billing/:tenantId | ✅ | List invoices |
| Billing | POST | /billing/:tenantId | ✅ | Create invoice |
| Billing | GET | /billing/:tenantId/invoices/:invoiceId | ✅ | Get invoice |
| Billing | POST | /billing/:tenantId/invoices/:invoiceId/payments | ✅ | Pay invoice |
| Menu | GET | /menu/:tenantId | ✅ | List menu |
| Menu | POST | /menu/:tenantId | ✅ | Add menu item |
| Menu | GET | /menu/:tenantId/item/:itemId | ✅ | Get item |
| Menu | PUT | /menu/:tenantId/:itemId | ✅ | Update item |
| Menu | PATCH | /menu/:tenantId/:itemId/deactivate | ✅ | Deactivate item |
| Menu | GET | /menu/:tenantId/categories | ✅ | List categories |
| Menu | GET | /menu/:tenantId/category/:category | ✅ | Filter by category |
| Order | POST | /orders | ✅ | Create order |
| Order | GET | /orders/:id | ✅ | Get order |
| KOT | GET | /kot/branch/:branchId | ✅ | KOT list |
| KOT | POST | /kot/:id/print | ✅ | Print KOT |
| Inventory | GET | /inventory/:tenantId | ✅ | List inventory |
| Inventory | POST | /inventory/:tenantId | ✅ | Add item |
| Inventory | PUT | /inventory/:itemId | ✅ | Update item |
| Inventory | DELETE | /inventory/:itemId | ✅ | Delete item |
| Inventory | GET | /inventory/:tenantId/low-stock | ✅ | Low stock alert |
| Staff | GET | /staff/:tenantId | ✅ | List staff |
| Staff | POST | /staff/:tenantId | ✅ | Add staff |
| Staff | GET | /staff/:tenantId/:staffId | ✅ | Get staff |
| Staff | PUT | /staff/:tenantId/:staffId | ✅ | Update staff |
| Staff | PATCH | /staff/:tenantId/:staffId/deactivate | ✅ | Remove staff |
| Staff | POST | /staff/:tenantId/:staffId/role | ✅ | Assign role |
| Staff | GET | /staff/:tenantId/branch/:branchId | ✅ | Branch staff |
| Dashboard | GET | /dashboard/overview/:tenantId | ✅ | Dashboard view |
| Dashboard | GET | /dashboard/analytics/:tenantId | ✅ | Sales analytics |
| Dashboard | GET | /dashboard/charts/:tenantId | ✅ | Charts data |
| Dashboard | GET | /dashboard/top-products/:tenantId | ✅ | Top items |
| Report | GET | /report/sales/:tenantId | ✅ | Sales report |
| Report | GET | /report/inventory/:tenantId | ✅ | Inventory report |
| Report | GET | /report/staff/:tenantId | ✅ | Staff report |
| Report | GET | /report/payment/:tenantId | ✅ | Payment report |
| Report | GET | /report/dashboard/:tenantId | ✅ | Summary report |
| Report | POST | /report/export/sales/:tenantId | ✅ | Export sales |
| Booking | POST | /bookings | ✅ | Create booking |
| Booking | GET | /bookings/branch/:branchId | ✅ | List bookings |
| Upload | POST | /upload/bulk | ✅ | Bulk import |

**Legend:** ✅ = Authentication Required | 🔒 = Super Admin Only

---

## KEY DESIGN PATTERNS

### 1. Multi-Tenancy Pattern
- Every endpoint includes `tenantId` parameter
- Tenant middleware verifies user owns tenant
- Database queries always filtered by tenant
- Ensures complete data isolation

### 2. Soft Deletes
- Items marked as inactive rather than deleted
- Maintains audit trail and history
- Examples: menu items, staff, inventory

### 3. Status-Based State Machine
- Subscriptions: active → expiring → expired → cancelled
- Orders: pending → in-progress → ready → completed
- Invoices: draft → issued → pending → paid/overdue

### 4. Audit Trail
- Track all state changes
- Log who made changes and when
- Important for compliance and disputes

### 5. Service Layer Architecture
- Controllers only handle HTTP layer
- Services contain business logic
- Reusable logic across multiple endpoints
- Easy to test business logic independently

---

## CONFIGURATION & ENVIRONMENT

Key environment variables needed:
```
JWT_SECRET = private key for token signing
REFRESH_TOKEN_SECRET = key for refresh token signing
JWT_EXPIRES_IN = e.g., "24h"
DATABASE_URL = PostgreSQL connection string
PAYMENT_GATEWAY_KEY = Stripe/Razorpay API key
EMAIL_SERVICE_KEY = SendGrid/AWS SES credentials
LOG_LEVEL = debug/info/warn/error
NODE_ENV = production/development
```

---

## NEXT STEPS FOR PRODUCTION

1. **Authentication Enhancements**
   - Add MFA (2FA) support
   - Implement token blacklisting/revocation
   - Add password reset flow
   - Account lockout after failed attempts

2. **Payment Integration**
   - Integrate Stripe/Razorpay for automatic billing
   - Implement webhook handlers for payment status
   - Add PCI compliance for card handling

3. **Monitoring & Alerts**
   - Add logging and alerting for failed payments
   - Monitor subscription expiry and send reminders
   - Alert on low inventory

4. **Advanced Features**
   - Multi-branch support
   - Advanced analytics and business intelligence
   - Integration with accounting software
   - Mobile app push notifications

5. **Security**
   - Rate limiting on all endpoints
   - CORS whitelist management
   - CSRF protection
   - SQL injection prevention (already handled by Prisma)
   - Input validation and sanitization

---

**Document Generated:** November 7, 2025
**Backend Framework:** Express.js + TypeScript
**Database:** PostgreSQL (Prisma ORM)
**Auth Method:** JWT (Access Token + Refresh Token)
