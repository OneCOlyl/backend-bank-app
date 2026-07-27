import { createHash, randomUUID } from 'node:crypto';
import type {
  CurrencyRate,
  LoanApplication,
  NewsArticle,
  Product,
  User,
} from './types.js';

/**
 * In-memory хранилище с моками. Один экземпляр на процесс.
 * Все транспорты (REST/GraphQL/gRPC) читают отсюда — данные не дублируются (DRY).
 * Для теста этого достаточно; в проде здесь была бы БД/репозиторий.
 */

/** Простейший хеш пароля. НЕ для продакшена — только чтобы не хранить пароли в открытом виде. */
export const hashPassword = (raw: string): string =>
  createHash('sha256').update(raw).digest('hex');

const now = () => new Date().toISOString();

const currencyRates: CurrencyRate[] = [
  { code: 'USD', nominal: 1, buy: 78.4, sell: 80.1, updatedAt: now() },
  { code: 'EUR', nominal: 1, buy: 84.2, sell: 86.0, updatedAt: now() },
  { code: 'CNY', nominal: 10, buy: 106.5, sell: 109.3, updatedAt: now() },
  { code: 'GBP', nominal: 1, buy: 97.1, sell: 99.4, updatedAt: now() },
];

const products: Product[] = [
  { id: 'dep-01', category: 'deposit', title: 'Вклад «Максимальный доход»', rate: 16.5, minAmount: 10000, maxAmount: 20000000, termMonths: 12, featured: true },
  { id: 'dep-02', category: 'deposit', title: 'Вклад «Онлайн-копилка»', rate: 14.0, minAmount: 1000, maxAmount: 5000000, termMonths: 6, featured: false },
  { id: 'crd-01', category: 'credit', title: 'Кредит наличными', rate: 9.9, minAmount: 50000, maxAmount: 5000000, termMonths: 60, featured: true },
  { id: 'card-01', category: 'card', title: 'Дебетовая карта «Твой кэшбэк»', rate: 0, minAmount: 0, maxAmount: 0, termMonths: 0, featured: true },
  { id: 'mrt-01', category: 'mortgage', title: 'Ипотека «新Дом»', rate: 6.0, minAmount: 500000, maxAmount: 30000000, termMonths: 360, featured: false },
];

const news: NewsArticle[] = [
  {
    id: 'n-01',
    slug: 'novaya-platforma-sajta',
    title: 'Запущена новая платформа корпоративного сайта',
    excerpt: 'После импортозамещения сайт стал быстрее и безопаснее.',
    body: 'Полный текст новости о переходе на новую платформу и планах по модернизации клиентских интерфейсов.',
    publishedAt: now(),
    tags: ['технологии', 'сайт'],
  },
  {
    id: 'n-02',
    slug: 'ai-servisy-dlya-klientov',
    title: 'Внедряем ИИ-сервисы для клиентов',
    excerpt: 'Умный помощник и персональные рекомендации по продуктам.',
    body: 'Полный текст новости о внедрении ИИ-сервисов в клиентские интерфейсы банка.',
    publishedAt: now(),
    tags: ['ии', 'сервисы'],
  },
];

const users: User[] = [
  { id: 'u-01', email: 'demo@psbank.ru', passwordHash: hashPassword('demo1234'), name: 'Демо Пользователь' },
];

const applications: LoanApplication[] = [];

export const store = {
  currencyRates: {
    list: (): CurrencyRate[] => currencyRates,
    byCode: (code: string): CurrencyRate | undefined =>
      currencyRates.find((r) => r.code === code.toUpperCase()),
  },
  products: {
    list: (category?: string): Product[] =>
      category ? products.filter((p) => p.category === category) : products,
    byId: (id: string): Product | undefined => products.find((p) => p.id === id),
  },
  news: {
    list: (limit?: number): NewsArticle[] =>
      typeof limit === 'number' ? news.slice(0, limit) : news,
    bySlug: (slug: string): NewsArticle | undefined =>
      news.find((n) => n.slug === slug),
  },
  users: {
    byEmail: (email: string): User | undefined =>
      users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
    byId: (id: string): User | undefined => users.find((u) => u.id === id),
  },
  applications: {
    list: (): LoanApplication[] => applications,
    create: (
      input: Omit<LoanApplication, 'id' | 'createdAt' | 'status'>,
    ): LoanApplication => {
      const app: LoanApplication = {
        ...input,
        id: randomUUID(),
        createdAt: now(),
        status: 'new',
      };
      applications.push(app);
      return app;
    },
  },
};
