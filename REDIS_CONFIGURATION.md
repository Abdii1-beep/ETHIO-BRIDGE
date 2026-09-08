# Redis Configuration for Caching

## Overview

Redis is used in ETHIO-BRIDGE for:
- Session caching
- Rate limiting
- Real-time data caching
- WebSocket connection management

Redis is **optional** - the application works without it but will have reduced performance for cached operations.

## Environment Variable

Add the following environment variable to your backend API service on Render:

```
REDIS_URL=redis://your-redis-host:6379
```

## Redis Providers

### Render Redis (Recommended)

1. Go to Render Dashboard
2. Click **New +** → **Redis**
3. Select region (same as API: Ohio)
4. Choose plan (Free or paid)
5. Click **Create Redis Instance**

**After creation:**
1. Go to your Redis instance
2. Copy the **Internal Connection URL**
3. Add as `REDIS_URL` environment variable to your API service

**Example:**
```
REDIS_URL=redis://red-xxxxxxxxxxxxx:6379
```

### Redis Cloud

1. Create account at https://redis.com
2. Create a new database
3. Get connection string from dashboard

**Configuration:**
```
REDIS_URL=redis://default:password@host:port
```

### Upstash (Edge Redis)

1. Create account at https://upstash.com
2. Create a new Redis database
3. Get REST URL or direct connection URL

**Configuration:**
```
REDIS_URL=redis://default:password@host:port
```

### AWS ElastiCache

1. Create Redis cluster in AWS ElastiCache
2. Configure security groups to allow Render access
3. Get endpoint address

**Configuration:**
```
REDIS_URL=redis://:password@your-elasticache-endpoint:6379
```

## Verifying Redis Connection

After adding `REDIS_URL` to Render:

1. **Redeploy** the API service
2. **Check health endpoint:**
```bash
curl https://ethio-bridge-c3ab.onrender.com/health
```

Expected response should show:
```json
{
  "status": "ok",
  "db": "up",
  "redis": "up",
  ...
}
```

## Redis Usage in ETHIO-BRIDGE

### Current Features Using Redis

- **Session Management:** JWT refresh token caching
- **Rate Limiting:** API rate limiting per user/IP
- **WebSocket State:** Real-time lottery spin state
- **Cache Layer:** Frequently accessed data

### Future Features

- Query result caching
- Real-time analytics
- Distributed locking
- Pub/Sub for notifications

## Security Notes

- **Never commit** Redis credentials to Git
- **Use TLS** for Redis connections in production
- **Configure firewall rules** to restrict access
- **Use authentication** (password) on Redis instances
- **Monitor memory usage** to avoid OOM errors

## Troubleshooting

### Redis Connection Failed

- Verify `REDIS_URL` is correct
- Check if Redis instance is running
- Verify network connectivity between Render and Redis
- Check if Redis requires TLS/SSL
- Verify authentication credentials

### Memory Issues

- Monitor Redis memory usage in provider dashboard
- Set appropriate `maxmemory` policy
- Configure key expiration (TTL)
- Consider upgrading Redis plan for more memory

### Connection Pool Exhaustion

- Configure connection pool size in application
- Monitor active connections
- Implement connection reuse
- Consider Redis cluster for high load

## Development vs Production

**Development (Local):**
```
REDIS_URL=redis://localhost:6379
```
Uses local Redis instance via Docker.

**Production (Render):**
```
REDIS_URL=redis://render-redis-instance:6379
```
Uses managed Redis service.

## Optional: Disable Redis

If you don't want to use Redis, simply omit the `REDIS_URL` environment variable. The application will:
- Fall back to in-memory caching
- Show `redis: "disabled"` in health check
- Still function normally with reduced performance
