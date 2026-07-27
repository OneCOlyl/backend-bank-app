import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { config } from './config.js';
import { restRouter } from './rest/routes.js';
import { ssrRouter } from './ssr/render.js';
import { typeDefs } from './graphql/schema.js';
import { resolvers, type GqlContext } from './graphql/resolvers.js';
import { verifyToken } from './auth.js';
import { startGrpcServer } from './grpc/server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Опциональная задержка для отладки лоадеров на фронте (LATENCY_MS). */
const latency = express.Router().use((_req, _res, next) => {
  if (config.latencyMs > 0) setTimeout(next, config.latencyMs);
  else next();
});

async function bootstrap(): Promise<void> {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(latency);

  // Health-check
  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  // REST (версионированный)
  app.use('/api/v1', restRouter);

  // GraphQL
  const apollo = new ApolloServer<GqlContext>({ typeDefs, resolvers });
  await apollo.start();
  app.use(
    '/graphql',
    expressMiddleware(apollo, {
      context: async ({ req }): Promise<GqlContext> => {
        const [scheme, token] = (req.headers.authorization ?? '').split(' ');
        if (scheme === 'Bearer' && token) {
          try {
            return { user: verifyToken(token) };
          } catch {
            return { user: null };
          }
        }
        return { user: null };
      },
    }),
  );

  // SSR / ISR / CSR демонстрационные роуты
  app.use('/', ssrRouter);

  // Статика (SSG)
  app.use(express.static(resolve(__dirname, '../public')));

  app.listen(config.httpPort, () => {
    console.log(`HTTP  → http://localhost:${config.httpPort}`);
    console.log(`REST  → http://localhost:${config.httpPort}/api/v1`);
    console.log(`GQL   → http://localhost:${config.httpPort}/graphql`);
  });

  await startGrpcServer();
}

bootstrap().catch((err) => {
  console.error('Ошибка запуска сервера:', err);
  process.exit(1);
});
