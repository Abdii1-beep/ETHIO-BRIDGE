process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.ETHIO_TEST_DATABASE_URL ??
  'postgresql://ehio:ehio_dev_password@localhost:5433/ehio_bridge_test?schema=public';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-at-least-32-chars!!';
process.env.JWT_ACCESS_TTL ??= '15m';
process.env.JWT_REFRESH_TTL_DAYS ??= '30';
process.env.API_PREFIX ??= 'api/v1';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.OTP_REQUIRED ??= 'true';
process.env.OTP_TRANSPORT ??= 'console';