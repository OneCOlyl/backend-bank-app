/** Централизованная конфигурация. Значения берутся из env с разумными дефолтами (KISS). */
export const config = {
  httpPort: Number(process.env.HTTP_PORT ?? 3000),
  grpcPort: Number(process.env.GRPC_PORT ?? 50051),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  jwtTtlSeconds: Number(process.env.JWT_TTL ?? 3600),
  /** Искусственная задержка ответов (мс) — удобно для проверки скелетонов/лоадеров на фронте. */
  latencyMs: Number(process.env.LATENCY_MS ?? 0),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
} as const;
