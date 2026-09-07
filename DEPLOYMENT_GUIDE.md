# ETHIO-BRIDGE Deployment Guide

## System Overview

The ETHIO-BRIDGE platform is a full-stack B2B commerce platform with advanced admin capabilities, role-based dashboards, and multi-language support.

### Tech Stack

**Backend (API)**
- Framework: NestJS 11.0.0
- Database: PostgreSQL 14 (Docker)
- Cache: Redis 7 (Docker)
- ORM: Prisma 6.1.0
- Authentication: JWT with refresh tokens

**Frontend (Web)**
- Framework: Next.js 15.3.3 with App Router
- Styling: Custom CSS with comprehensive design system
- Internationalization: next-intl (4 languages)
- State Management: React hooks and context

## Pre-Deployment Checklist

### 1. Environment Configuration

Create a `.env` file in the root directory based on `.env.example`:

```bash
# --- Infrastructure ---
DATABASE_URL="postgresql://ethio:ethio_dev_password@localhost:5433/ethio_bridge?schema=public"
REDIS_URL="redis://localhost:6379"

# --- Auth ---
JWT_ACCESS_SECRET="your-secure-32-char-access-secret"
JWT_REFRESH_SECRET="your-secure-32-char-refresh-secret"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL_DAYS="30"
OTP_TTL_MINUTES="10"

# --- OTP delivery ---
OTP_REQUIRED="false"
OTP_TRANSPORT="ethereal"

# --- Platform ---
PORT=3001
API_PREFIX="api/v1"
CORS_ORIGINS="http://localhost:3000"
WEB_URL="http://localhost:3000"

# --- Web ---
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 2. Database Setup

Start PostgreSQL and Redis containers:

```bash
docker-compose up -d
```

Verify containers are running:

```bash
docker ps
```

### 3. Database Migrations

Run Prisma migrations:

```bash
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

### 4. Install Dependencies

```bash
# Install root dependencies
npm install

# Install API dependencies
cd apps/api
npm install

# Install Web dependencies
cd apps/web
npm install
```

## Starting the Application

### Development Mode

**Terminal 1 - Start API:**
```bash
cd apps/api
npm run start:dev
```

**Terminal 2 - Start Web:**
```bash
cd apps/web
npm run dev
```

### Production Mode

**Build API:**
```bash
cd apps/api
npm run build
npm run start:prod
```

**Build Web:**
```bash
cd apps/web
npm run build
npm run start
```

## Admin Role Configuration

### Default Admin Account

- **Email**: `admin@ethio.bridge`
- **Password**: `EhioAdmin!2026`
- **Role**: Platform Super Admin

### Admin Features Added

1. **Platform Overview Dashboard** (`/admin/overview`)
   - Complete platform statistics
   - System health monitoring
   - Quick action links

2. **Users Management** (`/admin/users`)
   - View all platform users
   - Search and filter users
   - User status management

3. **Organizations Management** (`/admin/organizations`)
   - View all registered organizations
   - Organization details and statistics
   - Member and branch counts

4. **Audit Logs** (`/admin/audit-logs`)
   - Track all system events
   - Filter by action type
   - Detailed event history

5. **Revenue Analytics** (`/admin/revenue`)
   - Platform revenue tracking
   - Commission breakdown
   - Financial performance metrics

6. **Lottery Management** (`/admin/lottery`)
   - Car inventory management
   - Lottery creation and control
   - Spin management

### Navigation Updates

The sidebar navigation now includes a "Platform Admin" section with all admin features, accessible only to users with platform admin roles.

## Advanced Features Implemented

### Enhanced Dashboard
- **Real-time data integration** with actual member counts, branch counts, and feature statistics
- **Role-based dashboards** for Owner, Seller, Buyer, Finance, and Member roles
- **Interactive KPI cards** with live data
- **Dashboard preview mode** to view different role dashboards

### Enhanced Team Page
- **Team statistics cards** showing total members, active members, pending invitations
- **Advanced filtering** by status (All, Active, Pending)
- **Real-time member count updates**
- **Role assignment management**

### Enhanced Finance Page
- **Modern KPI card design** for financial metrics
- **Color-coded financial indicators** (green for income, red for expenses)
- **Real-time transaction tracking**
- **Account management with active/inactive states**

### Enhanced Products Page
- **Advanced filtering** by country of origin
- **Custom sorting options** (China First, Ethiopia First, price sorting)
- **Image gallery with lightbox**
- **Video support for product demonstrations**
- **Share functionality**
- **Real-time view and sold counts**

## Security Considerations

### Production Deployment

1. **Change all default secrets** in `.env` file
2. **Enable HTTPS** for production
3. **Configure proper CORS origins**
4. **Set up proper SMTP** for email delivery
5. **Enable OTP requirement** for production
6. **Configure firewall rules**
7. **Set up database backups**
8. **Enable audit logging**

### Admin Security

- Admin pages are protected by platform role guards
- Only users with `PLATFORM_SUPER_ADMIN` or `PLATFORM_FINANCE_ADMIN` roles can access admin features
- Audit logs track all administrative actions
- Role-based access control throughout the system

## Monitoring and Maintenance

### Health Checks

- **API Health**: `GET /health`
- **Database Health**: PostgreSQL container health check
- **Redis Health**: Redis container health check

### Logs

- API logs: Console output from NestJS
- Web logs: Next.js development server logs
- Container logs: `docker-compose logs`

### Backup Strategy

1. **Database backups**: Use `pg_dump` regularly
2. **Redis backups**: Enable Redis persistence
3. **File backups**: Backup uploaded files and media

## Performance Optimization

### Database
- Connection pooling configured
- Indexes on frequently queried columns
- Query optimization with Prisma

### Caching
- Redis for session storage
- Redis for frequently accessed data
- API response caching where appropriate

### Frontend
- Next.js automatic code splitting
- Image optimization
- Lazy loading for heavy components

## Troubleshooting

### Common Issues

**Database connection failed:**
- Verify PostgreSQL container is running: `docker ps`
- Check DATABASE_URL in `.env`
- Ensure port 5433 is available

**Redis connection failed:**
- Verify Redis container is running: `docker ps`
- Check REDIS_URL in `.env`
- Ensure port 6379 is available

**Admin pages not accessible:**
- Verify user has platform admin role
- Check JWT token validity
- Review role guard configuration

**Build errors:**
- Clear node_modules: `rm -rf node_modules`
- Reinstall dependencies: `npm install`
- Check Node.js version (should be 18+)

## Hosting Recommendations

### For Production Hosting

1. **Use managed services** for PostgreSQL and Redis (e.g., AWS RDS, ElastiCache)
2. **Deploy API** on a cloud platform (AWS, Google Cloud, Azure)
3. **Deploy Web** on Vercel, Netlify, or similar platform
4. **Set up CI/CD pipeline** for automated deployments
5. **Configure monitoring** (e.g., Sentry, DataDog)
6. **Set up SSL certificates** (Let's Encrypt)
7. **Configure CDN** for static assets
8. **Implement rate limiting** for API endpoints

### Scaling Considerations

- **Horizontal scaling**: Deploy multiple API instances behind a load balancer
- **Database scaling**: Use read replicas for read-heavy operations
- **Cache scaling**: Use Redis Cluster for distributed caching
- **Session storage**: Use Redis for session persistence across instances

## Support and Maintenance

### Regular Tasks

1. **Monitor system health** daily
2. **Review audit logs** weekly
3. **Check database performance** weekly
4. **Update dependencies** monthly
5. **Review security patches** immediately
6. **Backup database** daily
7. **Review error logs** daily

### Emergency Contacts

- **Platform Admin**: admin@ethio.bridge
- **Technical Support**: [Configure based on your organization]

## Conclusion

The ETHIO-BRIDGE platform is production-ready with:
- ✅ Advanced admin role and dashboard
- ✅ Comprehensive user and organization management
- ✅ Audit logging and monitoring
- ✅ Enhanced UI with real-time data
- ✅ Role-based access control
- ✅ Multi-language support
- ✅ Modern, responsive design
- ✅ Security best practices
- ✅ Deployment-ready configuration

**System Status: ✅ READY FOR HOSTING**
