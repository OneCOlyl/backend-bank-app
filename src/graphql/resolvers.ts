import { GraphQLError } from 'graphql';
import { store } from '../store.js';
import { signToken, verifyCredentials } from '../auth.js';
import type { JwtPayload } from '../auth.js';

/** Контекст запроса: авторизованный пользователь (если токен валиден). */
export interface GqlContext {
  user: JwtPayload | null;
}

const requireUser = (ctx: GqlContext): JwtPayload => {
  if (!ctx.user) {
    throw new GraphQLError('Требуется авторизация', {
      extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
    });
  }
  return ctx.user;
};

export const resolvers = {
  Query: {
    rates: () => store.currencyRates.list(),
    rate: (_: unknown, { code }: { code: string }) => store.currencyRates.byCode(code) ?? null,
    products: (_: unknown, { category }: { category?: string }) => store.products.list(category),
    product: (_: unknown, { id }: { id: string }) => store.products.byId(id) ?? null,
    news: (_: unknown, { limit }: { limit?: number }) => store.news.list(limit ?? undefined),
    article: (_: unknown, { slug }: { slug: string }) => store.news.bySlug(slug) ?? null,
    me: (_: unknown, __: unknown, ctx: GqlContext) => {
      const payload = requireUser(ctx);
      return store.users.byId(payload.sub) ?? null;
    },
    applications: (_: unknown, __: unknown, ctx: GqlContext) => {
      requireUser(ctx);
      return store.applications.list();
    },
  },
  Mutation: {
    login: (_: unknown, { email, password }: { email: string; password: string }) => {
      const user = verifyCredentials(email, password);
      if (!user) {
        throw new GraphQLError('Неверный email или пароль', {
          extensions: { code: 'BAD_CREDENTIALS', http: { status: 401 } },
        });
      }
      return { token: signToken(user), user };
    },
    createApplication: (
      _: unknown,
      { input }: { input: { productId: string; fullName: string; phone: string; amount: number; termMonths: number } },
      ctx: GqlContext,
    ) => {
      requireUser(ctx);
      if (!store.products.byId(input.productId)) {
        throw new GraphQLError('Указан несуществующий продукт', {
          extensions: { code: 'BAD_USER_INPUT', http: { status: 422 } },
        });
      }
      return store.applications.create(input);
    },
  },
};
