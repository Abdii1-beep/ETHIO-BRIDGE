# ETHIO-BRIDGE Frontend - Render Deployment Guide

## Overview

This guide covers deploying the Next.js frontend (`apps/web`) to Render as a separate service from the backend API.

## Prerequisites

- Backend API already deployed at: `https://ethio-bridge-c3ab.onrender.com`
- GitHub repository: `Abdii1-beep/ETHIO-BRIDGE`
- Branch: `main`

## Render Service Configuration

### Create New Web Service

1. Go to Render Dashboard
2. Click **New +** → **Web Service**
3. Connect to GitHub repository: `Abdii1-beep/ETHIO-BRIDGE`
4. Select branch: `main`

### Service Settings

**Name:** `ethio-bridge-web` (or your preferred name)

**Root Directory:** `apps/web`

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm start
```

**Publish Directory:** `.next`

**Environment:** `Production`

**Region:** `Ohio` (same as backend for lower latency)

**Plan:** `Free`

## Environment Variables

Add the following environment variable to the frontend service:

```
NEXT_PUBLIC_API_URL=https://ethio-bridge-c3ab.onrender.com
```

**Important:** This variable must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

## Deployment Steps

1. **Create the service** with the configuration above
2. **Add environment variable** `NEXT_PUBLIC_API_URL`
3. **Click Deploy**
4. **Wait for build** - should show Next.js build output
5. **Verify deployment** - visit the provided Render URL

## Post-Deployment Verification

After deployment, verify:

1. Frontend loads at the Render URL
2. Navigation works between pages
3. API calls succeed (check browser console for errors)
4. WebSocket connections work (lottery page)

## Custom Domain (Optional)

To use a custom domain:

1. Go to Settings → Custom Domains
2. Add your domain (e.g., `app.ethio-bridge.com`)
3. Update DNS records as instructed by Render
4. Update `NEXT_PUBLIC_API_URL` if needed for CORS

## Troubleshooting

### Build Fails

- Check Node.js version (should be >=20)
- Verify `apps/web/package.json` has correct scripts
- Check build logs for TypeScript errors

### API Calls Fail

- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS configuration on backend
- Verify backend is running and accessible

### WebSocket Connection Fails

- Ensure backend allows WebSocket connections
- Check that API URL includes protocol (https://)
- Verify Socket.IO client version matches server

## Notes

- The frontend is a static Next.js app with SSG (Static Site Generation)
- All pages are pre-rendered for better performance
- API calls happen client-side via the `api` client
- WebSocket connections use Socket.IO for real-time features (lottery)
