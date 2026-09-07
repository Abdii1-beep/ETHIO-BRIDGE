# ETHIO-BRIDGE Render Deployment Guide

## Overview
This guide covers deploying the ETHIO-BRIDGE platform to Render using Neon PostgreSQL as the database.

## Prerequisites
- Render account (https://dashboard.render.com)
- Neon account (https://console.neon.tech)
- GitHub repository with your code

## Architecture
- **API Server**: NestJS backend (Node.js)
- **Web Server**: Next.js frontend (Node.js)
- **Database**: Neon PostgreSQL (Serverless Postgres)
- **Cache**: Redis (Render Redis or Redis Cloud)

---

## Step 1: Set up Neon PostgreSQL

1. **Create Neon Project**
   - Go to https://console.neon.tech
   - Click "Create a project"
   - Choose a region (preferably close to your users)
   - Name your project (e.g., `ethio-bridge-prod`)

2. **Get Connection String**
   - In Neon Dashboard, go to your project
   - Click "Connection Details"
   - Copy the connection string
   - Format: `postgresql://username:password@ep-xxx.aws.neon.tech/neondb?sslmode=require`

3. **Enable Connection Pooling (Recommended)**
   - Add `?pgbouncer=true` to your connection string
   - This improves performance for serverless environments
   - Final format: `postgresql://username:password@ep-xxx.aws.neon.tech/neondb?sslmode=require&pgbouncer=true`

4. **Run Migrations**
   - Locally, update your `.env` with the Neon connection string
   - Run: `cd apps/api && npx prisma migrate deploy`
   - This will create all tables in your Neon database

---

## Step 2: Set up Redis (Optional but Recommended)

### Option A: Render Redis
1. In Render Dashboard, go to "New" → "Redis"
2. Choose a plan (Free tier available)
3. Name it (e.g., `ethio-bridge-redis`)
4. Create the instance
5. Copy the Redis URL from the dashboard

### Option B: Redis Cloud
1. Sign up at https://redis.com/try-free/
2. Create a database
3. Copy the connection string

---

## Step 3: Deploy API to Render

### Create Render Web Service (API)

1. **Push Code to GitHub**
   - Ensure your code is in a GitHub repository
   - Make sure `.env.example` is present

2. **Create New Web Service in Render**
   - Go to Render Dashboard → "New" → "Web Service"
   - Connect your GitHub repository
   - Configure build settings:
     ```
     Root Directory: apps/api
     Build Command: npm install && npm run build
     Start Command: npm run start:prod
     Runtime: Node (latest)
     ```
   - Click "Create Web Service"

3. **Add Environment Variables**
   In your Render Web Service settings, add these environment variables:
   
   ```
   # Database
   DATABASE_URL=your_neon_connection_string_with_pgbouncer
   
   # Redis (if using)
   REDIS_URL=your_redis_connection_string
   
   # Auth - CHANGE THESE TO STRONG RANDOM VALUES
   JWT_ACCESS_SECRET=generate-strong-random-string-32-chars-min
   JWT_REFRESH_SECRET=generate-strong-random-string-32-chars-min
   JWT_ACCESS_TTL=15m
   JWT_REFRESH_TTL_DAYS=30
   OTP_TTL_MINUTES=10
   
   # OTP Delivery
   OTP_REQUIRED=false
   OTP_TRANSPORT=smtp
   
   # SMTP Configuration (for production emails)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=ETHIO-BRIDGE <no-reply@yourdomain.com>
   SMTP_TLS_REJECT_UNAUTHORIZED=true
   
   # Platform
   PORT=3001
   API_PREFIX=api/v1
   CORS_ORIGINS=https://your-web-app-url.onrender.com
   WEB_URL=https://your-web-app-url.onrender.com
   ```

4. **Deploy**
   - Render will automatically deploy on push
   - Monitor the logs for any errors
   - Once deployed, note the API URL (e.g., `https://ethio-bridge-api.onrender.com`)

---

## Step 4: Deploy Web to Render

### Create Render Web Service (Frontend)

1. **Create New Web Service in Render**
   - Go to Render Dashboard → "New" → "Web Service"
   - Connect your GitHub repository
   - Configure build settings:
     ```
     Root Directory: apps/web
     Build Command: npm install && npm run build
     Start Command: npm start
     Runtime: Node (latest)
     ```
   - Click "Create Web Service"

2. **Add Environment Variables**
   In your Render Web Service settings, add:
   
   ```
   # API URL (use your deployed API URL)
   NEXT_PUBLIC_API_URL=https://ethio-bridge-api.onrender.com/api/v1
   ```

3. **Deploy**
   - Render will automatically deploy
   - Once deployed, note the web URL (e.g., `https://ethio-bridge.onrender.com`)

---

## Step 5: Update CORS Configuration

After both services are deployed:

1. **Update API CORS Origins**
   - Go to your API service in Render
   - Update `CORS_ORIGINS` to include your web URL
   - Example: `CORS_ORIGINS=https://ethio-bridge.onrender.com`

2. **Update Web API URL**
   - Go to your web service in Render
   - Update `NEXT_PUBLIC_API_URL` to your deployed API URL
   - Example: `NEXT_PUBLIC_API_URL=https://ethio-bridge-api.onrender.com/api/v1`

3. **Redeploy both services** to apply changes

---

## Step 6: Configure Custom Domain (Optional)

### For Web Service
1. In Render Dashboard, go to your web service
2. Click "Settings" → "Domains"
3. Add your custom domain (e.g., `ethio-bridge.com`)
4. Update DNS records as instructed by Render
5. Enable SSL (automatic with Let's Encrypt)

### For API Service
1. Follow same process for API service
2. Update `CORS_ORIGINS` and `NEXT_PUBLIC_API_URL` with custom domain

---

## Step 7: Post-Deployment Setup

### 1. Create Admin User
After deployment, you need to create the initial admin user:

```bash
# Connect to your Neon database via SQL editor or psql
# Run this SQL to create admin user:
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
  '$2b$10$hashed_password_here', -- Generate using bcrypt
  'PLATFORM_SUPER_ADMIN',
  true,
  true,
  'APPROVED',
  NOW(),
  NOW()
);
```

To generate a password hash:
```bash
cd apps/api
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('YourStrongPassword123', 10));"
```

### 2. Verify Database Connection
- Check Render logs for database connection errors
- Ensure `sslmode=require` is in your connection string
- If using pgbouncer, ensure it's enabled

### 3. Test the Application
- Visit your web URL
- Try registering a new user
- Check if approval workflow works
- Test login with admin credentials

---

## Monitoring & Maintenance

### Render Dashboard
- Monitor CPU, memory, and response times
- Check logs for errors
- Set up alert notifications

### Neon Dashboard
- Monitor database storage and usage
- Check connection pool stats
- Set up automated backups

### Redis Monitoring
- Monitor memory usage
- Check connection counts

---

## Troubleshooting

### Database Connection Issues
- **Error**: "connection timeout"
  - Solution: Ensure `sslmode=require` is in connection string
  - Check if Neon project is active (not paused)

- **Error**: "too many connections"
  - Solution: Enable connection pooling with `?pgbouncer=true`
  - Check Neon plan limits

### API Errors
- **CORS errors**: Ensure `CORS_ORIGINS` includes your web URL
- **502 errors**: Check API logs, may be cold start or database issue
- **Build failures**: Check Node.js version compatibility

### Web Errors
- **API not reachable**: Ensure `NEXT_PUBLIC_API_URL` is correct
- **Build failures**: Check Next.js version compatibility

---

## Cost Optimization

### Free Tier Limits
- Render: 750 hours/month free (web services)
- Neon: Free tier includes 0.5GB storage and limited compute
- Redis: Free tier available

### Scaling
- Upgrade Render plans as traffic grows
- Scale Neon compute units for better performance
- Consider Redis Cloud for production caching

---

## Security Checklist

- [ ] Change all default secrets (JWT, etc.)
- [ ] Enable SSL on all services
- [ ] Use strong passwords for database
- [ ] Restrict database access to Render IPs
- [ ] Enable audit logging
- [ ] Set up regular backups
- [ ] Monitor for suspicious activity
- [ ] Keep dependencies updated

---

## Backup Strategy

### Neon Backups
- Neon provides automatic backups (7-day retention on free tier)
- Enable point-in-time recovery for critical data

### Manual Backups
```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Import to local
psql $DATABASE_URL < backup.sql
```

---

## Support Resources

- Render Documentation: https://render.com/docs
- Neon Documentation: https://neon.tech/docs
- GitHub Issues: Report issues in your repository
