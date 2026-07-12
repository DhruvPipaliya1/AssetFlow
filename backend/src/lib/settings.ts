// App-level constants — avoids magic values scattered across modules.
export const SETTINGS = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? '*',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    accessTtl: process.env.ACCESS_TTL ?? '12h', // single access token, no refresh
  },
  tagPrefix: 'AF', // asset tags: AF-0001
  pagination: { defaultTake: 20, maxTake: 100 },
  cron: {
    overdue: '0 * * * *', // hourly
    bookingRollover: '*/5 * * * *', // every 5 min
  },
} as const;
