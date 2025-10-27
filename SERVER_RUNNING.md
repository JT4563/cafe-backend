# 🚀 Café SaaS Backend - RUNNING SUCCESSFULLY

**Server Status:** ✅ **ONLINE**
**Port:** 4000
**Environment:** Development
**Last Started:** October 27, 2025

---

## ✅ Server Startup Verification

```
✅ Socket.IO initialized
✅ API server listening on port 4000
✅ Database connected (Prisma client ready)
✅ Redis client ready (queues available)
✅ Watch mode enabled (auto-reload on changes)
```

---

## 📡 Available API Endpoints

All endpoints are prefixed with `/api/v1`

### 1. **Authentication** (`/auth`)

```
POST   /api/v1/auth/login        - User login
POST   /api/v1/auth/register     - New user registration
POST   /api/v1/auth/refresh      - Refresh JWT token
POST   /api/v1/auth/logout       - User logout
```

### 2. **Tenants** (`/tenants`)

```
POST   /api/v1/tenants           - Create new tenant
GET    /api/v1/tenants/:id       - Get tenant details
PUT    /api/v1/tenants/:id       - Update tenant
DELETE /api/v1/tenants/:id       - Deactivate tenant
```

### 3. **Bookings** (`/bookings`)

```
POST   /api/v1/bookings          - Create booking
GET    /api/v1/bookings/:id      - Get booking details
GET    /api/v1/bookings          - List bookings
PUT    /api/v1/bookings/:id      - Update booking
DELETE /api/v1/bookings/:id      - Cancel booking
```

### 4. **Orders** (`/orders`)

```
POST   /api/v1/orders            - Create order
GET    /api/v1/orders/:id        - Get order details
GET    /api/v1/orders            - List orders
PUT    /api/v1/orders/:id        - Update order
DELETE /api/v1/orders/:id        - Cancel order
```

### 5. **KOT** (`/kot`)

```
GET    /api/v1/kot               - Get pending KOTs
GET    /api/v1/kot/:id           - Get KOT details
PUT    /api/v1/kot/:id/print     - Print KOT
```

### 6. **Health Check** (`/`)

```
GET    /api/v1/                  - API health & version info
```

---

## 🧪 Testing API Endpoints

### Quick Test with curl/PowerShell

```powershell
# Check API is alive
Invoke-WebRequest -Uri "http://localhost:4000/api/v1/" -Method GET

# Example login (requires valid user)
$body = @{ email = "user@cafe.com"; password = "password123" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:4000/api/v1/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Using Postman

1. Open Postman
2. Create new request to: `http://localhost:4000/api/v1/auth/login`
3. Set method to `POST`
4. Add JSON body:

```json
{
  "email": "user@cafe.com",
  "password": "your-password"
}
```

5. Send and view response

---

## 🔌 Real-Time Features (Socket.IO)

Connect to WebSocket at: `ws://localhost:4000`

### Socket Events Available

```typescript
// Tenant updates
socket.on("tenant:updated", (data) => {});
socket.on("tenant:created", (data) => {});

// Booking changes
socket.on("booking:confirmed", (data) => {});
socket.on("booking:cancelled", (data) => {});

// Order updates
socket.on("order:created", (data) => {});
socket.on("order:status-changed", (data) => {});

// KOT notifications
socket.on("kot:printed", (data) => {});
socket.on("kot:completed", (data) => {});
```

---

## 📊 Database Connection Status

```
Database:  ✅ PostgreSQL (Railway)
Host:      trolley.proxy.rlwy.net:40606
Database:  railway
Redis:     ✅ Running (Railway)
Host:      caboose.proxy.rlwy.net:14549
Queue:     ✅ BullMQ ready
```

---

## 📝 Development Commands

### Terminal 1: Start Dev Server

```bash
npm run dev
# Watches for changes and auto-reloads
# Running on: http://localhost:4000
```

### Terminal 2: Database Operations

```bash
# View Prisma Studio
npx prisma studio

# Run migrations
npx prisma migrate dev

# Generate Prisma types
npx prisma generate
```

### Build for Production

```bash
npm run build
npm start
```

---

## 🔐 Authentication Flow

1. **Register New User**

   ```json
   POST /api/v1/auth/register
   {
     "email": "user@cafe.com",
     "password": "secure123",
     "tenantName": "My Café"
   }
   ```

2. **Login**

   ```json
   POST /api/v1/auth/login
   {
     "email": "user@cafe.com",
     "password": "secure123"
   }
   Response:
   {
     "accessToken": "eyJhbGc...",
     "refreshToken": "eyJhbGc..."
   }
   ```

3. **Use Token**

   ```
   Headers:
   Authorization: Bearer eyJhbGc...
   ```

4. **Refresh Token When Expired**
   ```json
   POST /api/v1/auth/refresh
   {
     "refreshToken": "eyJhbGc..."
   }
   ```

---

## 🛠️ File Watcher

The dev server is running in **watch mode**. This means:

- ✅ Changes to `.ts` files are detected automatically
- ✅ Server restarts automatically on save
- ✅ No manual restart needed
- ✅ Type errors shown in console immediately

**Edit any file and save to see changes live!**

---

## 🐛 Debugging

### View Logs

```bash
# Logs are output to console with timestamps
# Example:
# {"level":30,"time":1761541244097,"pid":false,"msg":"API server listening on port 4000"}
```

### Enable Verbose Logging

Add to `.env`:

```
DEBUG=*
LOG_LEVEL=debug
```

### Check Database Connection

```bash
npx prisma db execute --stdin <<EOF
SELECT 1 as connected
EOF
```

---

## 📂 Key Files

```
src/
├── server.ts                 # ← Entry point (running now)
├── app.ts                    # Express app setup
├── sockets.ts               # WebSocket setup
├── config/
│   ├── db.config.ts         # Prisma connection
│   ├── env.config.ts        # Environment variables
│   └── logger.ts            # Pino logging
├── routes/
│   ├── index.ts             # All routes registered
│   ├── auth.routes.ts       # Auth endpoints
│   ├── booking.routes.ts    # Booking endpoints
│   └── ...                  # Other routes
└── services/
    ├── auth.service.ts      # ✅ Production-ready
    ├── tenant.service.ts    # ✅ Production-ready
    ├── booking.service.ts   # ✅ Production-ready
    └── ...
```

---

## 🚀 Next Steps

1. **Test Auth Endpoint**

   - Create a new user via `/auth/register`
   - Login via `/auth/login`
   - Store the token

2. **Create Tenant Resources**

   - Create bookings
   - Create orders
   - Manage staff

3. **Monitor Activity**

   - Check logs for errors
   - Monitor database queries
   - Watch WebSocket connections

4. **Build & Deploy**
   - When ready: `npm run build`
   - Deploy `build/` folder
   - Use `npm start` in production

---

## 📞 Troubleshooting

### Server won't start?

```bash
# Check port 4000 is not in use
netstat -ano | findstr :4000

# Kill process on port 4000
taskkill /PID <PID> /F
```

### Database connection error?

```bash
# Verify .env has correct DATABASE_URL
cat .env | grep DATABASE_URL

# Test connection
npx prisma db execute --stdin < test.sql
```

### TypeScript errors?

```bash
# Rebuild types
npx prisma generate

# Check compilation
npx tsc --noEmit
```

---

## 📊 Performance Monitoring

Watch the logs for:

- 🟢 **INFO** - Normal operations
- 🟡 **WARN** - Warnings (usually OK)
- 🔴 **ERROR** - Errors (needs fixing)

---

**Server is ready for development! 🎉**

Monitor the console output to see requests come in as you test the API.

Last updated: 2025-10-27 23:20 UTC
