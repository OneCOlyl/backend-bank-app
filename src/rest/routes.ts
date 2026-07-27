import { Router } from 'express';
import { z } from 'zod';
import { store } from '../store.js';
import { requireAuth, signToken, verifyCredentials } from '../auth.js';

/**
 * REST API. Версионируется префиксом /api/v1 (см. server.ts).
 * Ответы — чистый JSON. Ошибки — { error: string } с корректным HTTP-статусом.
 */
export const restRouter = Router();

// --- Курсы валют ---
restRouter.get('/rates', (_req, res) => {
  res.json(store.currencyRates.list());
});

restRouter.get('/rates/:code', (req, res) => {
  const rate = store.currencyRates.byCode(req.params.code);
  if (!rate) {
    res.status(404).json({ error: 'Валюта не найдена' });
    return;
  }
  res.json(rate);
});

// --- Продукты / тарифы ---
const productQuery = z.object({
  category: z.enum(['deposit', 'credit', 'card', 'mortgage']).optional(),
});

restRouter.get('/products', (req, res) => {
  const parsed = productQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Некорректная категория' });
    return;
  }
  res.json(store.products.list(parsed.data.category));
});

restRouter.get('/products/:id', (req, res) => {
  const product = store.products.byId(req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Продукт не найден' });
    return;
  }
  res.json(product);
});

// --- Новости ---
restRouter.get('/news', (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  res.json(store.news.list(Number.isFinite(limit) ? limit : undefined));
});

restRouter.get('/news/:slug', (req, res) => {
  const article = store.news.bySlug(req.params.slug);
  if (!article) {
    res.status(404).json({ error: 'Новость не найдена' });
    return;
  }
  res.json(article);
});

// --- Авторизация ---
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

restRouter.post('/auth/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Укажите email и пароль' });
    return;
  }
  const user = verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    res.status(401).json({ error: 'Неверный email или пароль' });
    return;
  }
  res.json({ token: signToken(user), user: { id: user.id, email: user.email, name: user.name } });
});

restRouter.get('/auth/me', requireAuth, (_req, res) => {
  const payload = res.locals.user as { sub: string };
  const user = store.users.byId(payload.sub);
  if (!user) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name });
});

// --- Заявки на продукт (защищено) ---
const applicationSchema = z.object({
  productId: z.string().min(1),
  fullName: z.string().min(2),
  phone: z.string().min(5),
  amount: z.number().positive(),
  termMonths: z.number().int().positive(),
});

restRouter.post('/applications', requireAuth, (req, res) => {
  const parsed = applicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Проверьте поля заявки', details: parsed.error.flatten() });
    return;
  }
  if (!store.products.byId(parsed.data.productId)) {
    res.status(422).json({ error: 'Указан несуществующий продукт' });
    return;
  }
  const app = store.applications.create(parsed.data);
  res.status(201).json(app);
});

restRouter.get('/applications', requireAuth, (_req, res) => {
  res.json(store.applications.list());
});
