# ETHIO-BRIDGE Render Deployment Checklist

## Project Structure Summary

**Type:** Monorepo with npm workspaces
- **Backend:** NestJS API (`apps/api`)
- **Frontend:** Next.js Web App (`apps/web`)
- **Database:** Neon PostgreSQL (external)
- **Cache:** Redis (optional, for production)

---

## Backend Deployment (API)

### Render Web Service Configuration

**Root Directory:** `apps/api`

**Runtime:** Node (latest)

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run start:prod
```

### Environment Variables (API)

Add these in Render Dashboard → Environment Variables:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@ep-xxx.aws.neon.tech/neondb?sslmode=require&pgbouncer=true

# Redis (Optional - use Render Redis or Redis Cloud)
REDIS_URL=redis://localhost:6379

# Authentication
JWT_ACCESS_SECRET=generate-strong-random-32-char-string
JWT_REFRESH_SECRET=generate-strong-random-32-char-string
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=30
OTP_TTL_MINUTES=10

# OTP Delivery
OTP_REQUIRED=false
OTP_TRANSPORT=smtp
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
CORS_ORIGINS=https://your-web-app.onrender.com
WEB_URL=https://your-web-app.onrender.com
```

---

## Frontend Deployment (Web)

### Render Web Service Configuration

**Root Directory:** `apps/web`

**Runtime:** Node (latest)

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

### Environment Variables (Web)

Add these in Render Dashboard → Environment Variables:

```bash
# API URL (use your deployed API URL)
NEXT_PUBLIC_API_URL=https://your-api-app.onrender.com
```

---

## Deployment Steps

### 1. Prepare GitHub Repository

```bash
# Ensure .gitignore is properly configured
git status
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Set Up Neon Database

1. Go to https://console.neon.tech
2. Create a new project or use existing
3. Copy the connection string
4. Format: `postgresql://username:password@ep-xxx.aws.neon.tech/neondb?sslmode=require&pgbouncer=true`
5. **Keep this secret - DO NOT commit**

### 3. Deploy Backend to Render

1. Go to https://dashboard.render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Root Directory:** `apps/api`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
5. Add all environment variables listed above
6. Click "Create Web Service"
7. Wait for deployment to complete
8. Note the API URL (e.g., `https://ethio-bridge-api.onrender.com`)

### 4. Deploy Frontend to Render

1. Go to Render Dashboard → "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `apps/web`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL=https://ethio-bridge-api.onrender.com`
5. Click "Create Web Service"
6. Wait for deployment to complete
7. Note the web URL (e.g., `https://ethio-bridge.onrender.com`)

### 5. Update CORS Configuration

1. Go to your API service in Render
2. Update `CORS_ORIGINS` to include your web URL:
   ```
   CORS_ORIGINS=https://ethio-bridge.onrender.com
   ```
3. Redeploy the API service

### 6. Run Database Migrations

Since this is a monorepo with Prisma, you need to run migrations locally first:

```bash
# Set DATABASE_URL to your Neon connection string
export DATABASE_URL="postgresql://username:password@ep-xxx.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"

# Run migrations
cd apps/api
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 7. Create Admin User

After migrations, create the initial admin user:

```bash
cd apps/api
node -e "
const bcrypt = require('bcryptjs');
const password = 'YourStrongPassword123';
console.log(bcrypt.hashSync(password, 10));
"
```

Then connect to Neon SQL Editor and run:

```sql
INSERT INTO \"User\" (
  \"id\",
  \"email\",
  \"name\",
  \"passwordHash\",
  \"platformRole\",
  \"isActive\",
  \"isEmailVerified\",
  \"approvalStatus\",
  \"createdAt\",
  \"updatedAt\"
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

---

## Verification Checklist

### 1. GitHub
- [ ] Code pushed to GitHub
- [ ] `.env` not committed (check .gitignore)
- [ ] No secrets in code
- [ ] Build succeeds locally

### 2. Neon
- [ ] Database created
- [ ] Connection string obtained
- [ ] Migrations run successfully
- [ ] Admin user created
- [ ] `sslmode=require` in connection string
- [ ] `pgbouncer=true` enabled for connection pooling

### 3. Render - Backend
- [ ] Web service created
- [ ] Root directory: `apps/api`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm run start:prod`
- [ ] All environment variables set
- [ ] `DATABASE_URL` set to Neon connection string
- [ ] JWT secrets changed from defaults
- [ ] Deployment successful
- [ ] API URL noted

### 4. Render - Frontend
- [ ] Web service created
- [ ] Root directory: `apps/web`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] `NEXT_PUBLIC_API_URL` set to deployed API URL
- [ ] Deployment successful
- [ ] Web URL noted

### 5. CORS Configuration
- [ ] `CORS_ORIGINS` includes web URL
- [ ] API redeployed after CORS update

### 6. Build Verification
- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] No TypeScript errors
- [ ] No linting errors

### 7. Database
- [ ] Prisma client generated
- [ ] All tables created
- [ ] Admin user exists
- [ ] Connection pooling enabled

### 8. Frontend
- [ ] Web app loads in browser
- [ ] API calls succeed
- [ ] Login page accessible
- [ ] Registration works
- [ ] No console errors

### 9. API Testing
- [ ] Health endpoint accessible
- [ ] Login endpoint works
- [ ] Registration endpoint works
- [ ] Admin endpoints accessible with admin credentials
- [ ] No 500 errors

### 10. Production Verification
- [ ] User can register
- [ ] User can login
- [ ] Admin can approve users
- [ ] Dashboard loads
- [ ] Products display
- [ ] All features work as expected

---

## Troubleshooting

### Build Fails
- Check Node.js version (requires >=20)
- Check dependencies in package.json
- Check build logs in Render

### Database Connection Fails
- Verify `DATABASE_URL` format
- Ensure `sslmode=require` is included
- Check Neon project is active
- Verify connection pooling is enabled

### CORS Errors
- Ensure `CORS_ORIGINS` includes web URL
- Check API and web URLs are correct
- Redeploy both services after CORS changes

### 500 Errors
- Check Render logs
- Verify environment variables
- Check database connection
- Verify Prisma client is generated

### Login Fails
- Check JWT secrets match
- Verify admin user exists in database
- Check approval status is APPROVED
- Verify email is verified

---

## Security Notes

1. **Never commit** `.env` file or any secrets
2. **Change all default secrets** (JWT, etc.)
3. **Use strong passwords** for database
4. **Enable SSL** on all connections
5. **Monitor logs** for suspicious activity
6. **Set up alerts** for errors
7. **Regular backups** of Neon database

---

## Cost Optimization

### Free Tier Limits
- Render: 750 hours/month free
- Neon: Free tier includes 0.5GB storage
- Consider upgrading as traffic grows

### Scaling
- Upgrade Render plans as needed
- Scale Neon compute units for performance
- Add Redis for caching if needed

---

## Post-Deployment Tasks

1. **Set up custom domain** (optional)
2. **Configure SSL** (automatic with Render)
3. **Set up monitoring** (Render provides logs)
4. **Configure error tracking** (optional)
5. **Set up backups** (Neon provides automatic)
6. **Test all user flows**
7. **Monitor performance**
8. **Set up alerts**

---

## Support Resources

- Render Documentation: https://render.com/docs
- Neon Documentation: https://neon.tech/docs
- NestJS Documentation: https://docs.nestjs.com
- Next.js Documentation: https://nextjs.org/docs
