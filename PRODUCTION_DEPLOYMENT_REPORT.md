# ETHIO-BRIDGE Production Deployment Report

## A. What I Found

### Architecture
ETHIO-BRIDGE is a **monorepo** using npm workspaces with two main applications:

**Backend (API)**
- **Framework:** NestJS (Node.js)
- **Location:** `apps/api`
- **Entry Point:** `apps/api/src/main.ts`
- **Build Output:** `dist/apps/api/src/main.js`
- **Database:** Neon PostgreSQL via Prisma ORM
- **Cache:** Redis (optional, via ioredis)
- **Authentication:** JWT with access/refresh tokens
- **API Prefix:** `api/v1`

**Frontend (Web)**
- **Framework:** Next.js 15 with React 19
- **Location:** `apps/web`
- **Entry Point:** `apps/web/src/app/[locale]/page.tsx`
- **Internationalization:** next-intl (en, am, om, zh)
- **Build Output:** `.next` directory
- **API Client:** Custom fetch wrapper with auto-refresh

**Shared Package**
- **Location:** `packages/shared`
- **Purpose:** Shared constants, types, permissions, features

### Database Configuration
- **ORM:** Prisma
- **Schema Location:** `apps/api/prisma/schema.prisma`
- **Migrations:** 3 existing migrations in `apps/api/prisma/migrations/`
- **Connection:** Reads from `DATABASE_URL` environment variable
- **SSL:** Required for Neon

### Health Check
- **Endpoint:** `GET /health` (excluded from API prefix)
- **Status:** Already implemented and production-ready
- **Checks:** Database, Redis, OTP transport configuration

---

## B. What I Changed

### Files Modified

1. **`apps/api/src/main.ts`**
   - Changed server binding from localhost to `0.0.0.0` for Render compatibility
   - Changed: `await app.listen(port)` → `await app.listen(port, '0.0.0.0')`
   - Updated log message to remove localhost reference

2. **`apps/web/src/lib/api.ts`**
   - API URL configuration already uses `NEXT_PUBLIC_API_URL` environment variable
   - No changes needed - already production-ready

### Files Verified (No Changes Needed)

- **`apps/api/src/app.controller.ts`** - Health endpoint already exists
- **`apps/api/src/common/services/health.service.ts`** - Health checks implemented
- **`apps/api/prisma/schema.prisma`** - Reads `DATABASE_URL` from env
- **`apps/api/src/app.module.ts`** - ConfigModule loads from multiple .env paths
- **`.gitignore`** - Properly excludes .env and secrets
- **`package.json`** files - Scripts verified for production

---

## C. Render Settings

### Backend (API) Web Service

**Name:** `ethio-bridge-api` (or your preferred name)

**Project:** `ETHIO-BRIDGE`

**Environment:** `Production`

**Language:** `Node`

**Branch:** `main`

**Region:** `Ohio (US East)`

**Root Directory:** `apps/api`

**Build Command:** `npm install; npm run build`

**Start Command:** `npm run start:prod`

**Compute:** `Free` (0.1 CPU, 512 MB RAM)

---

### Frontend (Web) Web Service

**Name:** `ethio-bridge-web` (or your preferred name)

**Project:** `ETHIO-BRIDGE`

**Environment:** `Production`

**Language:** `Node`

**Branch:** `main`

**Region:** `Ohio (US East)`

**Root Directory:** `apps/web`

**Build Command:** `npm install; npm run build`

**Start Command:** `npm start`

**Compute:** `Free` (0.1 CPU, 512 MB RAM)

---

## D. Environment Variables

### Backend (API) Environment Variables

Add these in Render Dashboard → API Service → Environment Variables:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:npg_G7ng0VNXmtYR@ep-mute-firefly-a54j4ova-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Redis (Optional - can use Render Redis or Redis Cloud)
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_ACCESS_SECRET=generate-strong-32-char-random-string
JWT_REFRESH_SECRET=generate-strong-32-char-random-string
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=30

# OTP Configuration
OTP_TTL_MINUTES=10
OTP_REQUIRED=false
OTP_TRANSPORT=smtp

# SMTP Configuration (for email OTP delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=ETHIO-BRIDGE <no-reply@yourdomain.com>
SMTP_TLS_REJECT_UNAUTHORIZED=true

# Platform Configuration
PORT=3001
API_PREFIX=api/v1
CORS_ORIGINS=https://ethio-bridge-web.onrender.com
WEB_URL=https://ethio-bridge-web.onrender.com

# Optional: Node environment
NODE_ENV=production
```

### Frontend (Web) Environment Variables

Add this in Render Dashboard → Web Service ► Environment Variables:

```bash
# API URL (use your deployed API URL after API is deployed)
NEXT_PUBLIC_API_URL=https://ethio-bridge-api.onrender.com
```

---

## E. Neon Configuration

### Connection Details

**Connection String Format:**
```
postgresql://username:password@ep-xxx.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Your Connection String:**
```
postgresql://neondb_owner:npg_G7ng0VNXmtYR@ep-mute-firefly-a54j4ova-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**How the Application Connects:**

1. **Prisma Configuration** (`apps/api/prisma/schema.prisma`):
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Environment Loading** (`apps/api/src/app.module.ts`):
   ```typescript
   ConfigModule.forRoot({
     isGlobal: true,
     cache: true,
     envFilePath: ['.env', '../.env', '../../.env', resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')],
   })
   ```

3. **Prisma Service** reads `DATABASE_URL` from environment and connects to Neon with SSL

**SSL Configuration:**
- `sslmode=require` - Enforces SSL connection
- `channel_binding=require` - Additional security for Neon
- Connection pooling enabled via `pooler` endpoint

---

## F. Deployment Steps

### Step 1: Deploy Backend (API)

1. Go to https://dashboard.render.com
2. Click **New** → **Web Service**
3. Connect GitHub repository: `Abdii1-beep/ETHIO-BRIDGE`
4. Configure:
   - **Name:** `ethio-bridge-api`
   - **Root Directory:** `apps/api`
   - **Build Command:** `npm install; npm run build`
   - **Start Command:** `npm run start:prod`
   - **Compute:** Free
5. Add all environment variables listed above (including DATABASE_URL)
6. Click **Deploy Web Service**
7. Wait for deployment to complete
8. Note the API URL (e.g., `https://ethio-bridge-api.onrender.com`)

### Step 2: Run Database Migrations

After API deployment, run migrations locally:

```bash
# Set DATABASE_URL to your Neon connection string
export DATABASE_URL="postgresql://neondb_owner:npg_G7ng0VNXmtYR@ep-mute-firefly-a54j4ova-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Navigate to API directory
cd apps/api

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Step 3: Create Admin User

Connect to Neon SQL Editor and run:

```sql
INSERT INTO "User" (
  "id",
  "email",
  "name",
  "passwordHash",
  "platformRole",
  "isActive",
  "isEmailVerified",
  "approvalStatus",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'admin@yourdomain.com',
  'Platform Admin',
  'PASTE_HASHED_PASSWORD_HERE',
  'PLATFORM_SUPER_ADMIN',
  true,
  true,
  'APPROVED',
  NOW(),
  NOW()
);
```

To generate password hash locally:
```bash
cd apps/api
node -e "
const bcrypt = require('bcryptjs');
const password = 'YourStrongPassword123';
console.log(bcrypt.hashSync(password, 10));
"
```

### Step 4: Deploy Frontend (Web)

1. Go toRender Dashboard → **New** → **Web Service**
2. Connect GitHub repository: `Abdii1-beep/ETHIO-BRIDGE`
3. Configure:
   - **Name:** `ethio-bridge-web`
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm install; npm run build`
   - **Start Command:** `npm start`
   - **Compute:** Free
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL=https://ethio-bridge-api.onrender.com`
5. Click **Deploy Web Service**
6. Wait for deployment to complete
7. Note the web URL (e.g., `https://ethio-bridge-web.onrender.com`)

### Step 5: Update CORS Configuration

1. Go to API service in Render
2. Update `CORS_ORIGINS` to include your web URL:
   ```
   CORS_ORIGINS=https://ethio-bridge-web.onrender.com
   ```
3. Redeploy the API service

### Step 6: Test Deployment

1. Test health endpoint: `https://ethio-bridge-api.onrender.com/health`
2. Test web app: `https://ethio-bridge-web.onrender.com`
3. Test registration and login
4. Test admin dashboard with admin credentials

---

## G. Expected Production URLs

### API Service
- **Format:** `https://[service-name].onrender.com`
- **Example:** `https://ethio-bridge-api.onrender.com`
- **Health Endpoint:** `https://ethio-bridge-api.onrender.com/health`
- **API Base:** `https://ethio-bridge-api.onrender.com/api/v1`

### Web Service
- **Format:** `https://[service-name].onrender.com`
- **Example:** `https://ethio-bridge-web.onrender.com`
- **Home Page:** `https://ethio-bridge-web.onrender.com/en`

---

## H. Troubleshooting

### Build Failed

**Possible Causes:**
- Node.js version mismatch (requires >=20)
- Dependency installation failed
- TypeScript compilation errors

**Solutions:**
- Check Render build logs
- Verify Node.js version in package.json engines
- Check for TypeScript errors locally: `cd apps/api && npm run build`
- Ensure all dependencies are in package.json

### Start Command Failed

**Possible Causes:**
- Incorrect start command
- Port binding issue
- Missing environment variables

**Solutions:**
- Verify start command: `npm run start:prod`
- Check that server binds to `0.0.0.0` (already configured)
- Verify all environment variables are set
- Check Render logs for specific error

### Port Error

**Possible Causes:**
- Port not reading from `process.env.PORT`
- Hard-coded port in code

**Solutions:**
- Verify `apps/api/src/main.ts` uses `config.get<string>('PORT')`
- Already configured to use `process.env.PORT` with fallback to 3001
- Render automatically assigns PORT via environment variable

### Database Connection Error

**Possible Causes:**
- Incorrect DATABASE_URL format
- SSL not configured
- Neon project not active
- Connection string has wrong credentials

**Solutions:**
- Verify DATABASE_URL format includes `sslmode=require`
- Check Neon project is active in Neon dashboard
- Test connection locally with same DATABASE_URL
- Ensure connection pooling endpoint is used (`pooler`)
- Check for typos in connection string

### CORS Error

**Possible Causes:**
- CORS_ORIGINS doesn't include web URL
- Frontend URL not in allowed origins
- Credentials not enabled

**Solutions:**
- Update `CORS_ORIGINS` to include web URL
- Redeploy API after CORS change
- Verify credentials are enabled in CORS config (already configured)
- Check browser console for specific CORS error

### 404 Error

**Possible Causes:**
- Incorrect API prefix
- Wrong endpoint path
- Health endpoint excluded from prefix

**Solutions:**
- Health endpoint: `/health` (excluded from prefix)
- API endpoints: `/api/v1/[endpoint]`
- Verify API_PREFIX is set to `api/v1`
- Check route definitions in controllers

### 502 Bad Gateway

**Possible Causes:**
- Service crashed
- Database connection failed
- Port not listening
- Health check failed

**Solutions:**
- Check Render logs for crash details
- Verify database connection
- Test health endpoint manually
- Check if service is running
- Verify environment variables

### Application Crashed

**Possible Causes:**
- Unhandled exception
- Missing environment variable
- Database connection timeout
- Memory limit exceeded (Free tier: 512MB)

**Solutions:**
- Check Render logs for stack trace
- Verify all required environment variables
- Test database connection locally
- Consider upgrading compute plan if memory issues
- Check for infinite loops or memory leaks

---

## Security Notes

1. **Never commit** `.env` file or any secrets
2. **Change all default secrets** (JWT_ACCESS_SECRET, JWT_REFRESH_SECRET)
3. **Use strong passwords** for database and SMTP
4. **Enable SSL** on all connections (already configured)
5. **Monitor logs** for suspicious activity
6. **Set up alerts** for errors in Render
7. **Regular backups** of Neon database (automatic with Neon)

---

## Post-Deployment Tasks

1. **Set up custom domain** (optional)
2. **Configure SSL** (automatic with Render)
3. **Set up monitoring** (Render provides logs)
4. **Configure error tracking** (optional - Sentry, etc.)
5. **Set up backups** (Neon provides automatic)
6. **Test all user flows** (registration, login, dashboard)
7. **Monitor performance** (Render metrics)
8. **Set up alerts** (Render notifications)

---

## Support Resources

- Render Documentation: https://render.com/docs
- Neon Documentation: https://neon.tech/docs
- NestJS Documentation: https://docs.nestjs.com
- Next.js Documentation: https://nextjs.org/docs
- Prisma Documentation: https://www.prisma.io/docs

---

## Verification Checklist

- [ ] GitHub repository pushed to main branch
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Render
- [ ] DATABASE_URL set in API environment variables
- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] Admin user created
- [ ] CORS_ORIGINS includes web URL
- [ ] Health endpoint accessible
- [ ] Web app loads in browser
- [ ] Registration works
- [ ] Login works
- [ ] Admin dashboard accessible
- [ ] No console errors
- [ ] No 500 errors in API logs

---

## Summary

The ETHIO-BRIDGE project is **production-ready** for Render deployment with the following key points:

✅ Backend configured to bind to `0.0.0.0` for Render
✅ Health endpoint implemented and accessible
✅ Database configuration reads from `DATABASE_URL`
✅ CORS configured via environment variable
✅ Build commands tested successfully
✅ Frontend API URL configurable via environment
✅ All secrets properly excluded from git
✅ Prisma migrations ready for deployment
✅ Neon PostgreSQL connection string formatted correctly

**Next Action:** Deploy the backend API service to Render with the configuration provided above.
