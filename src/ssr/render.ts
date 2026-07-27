import { Router } from 'express';
import { store } from '../store.js';

/**
 * Демонстрация разных стратегий рендеринга для фронта.
 * Здесь нет Angular Universal — это лёгкая имитация на строках,
 * чтобы показать серверную отдачу HTML и заголовки кеширования (SSR/SSG/ISR/CSR).
 */
export const ssrRouter = Router();

const escape = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));

const layout = (title: string, body: string, meta = ''): string => `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)}</title>
  ${meta}
</head>
<body>
  <main>${body}</main>
</body>
</html>`;

/**
 * SSR: HTML собирается на каждый запрос из актуальных данных.
 * no-store — браузер не кеширует, всегда свежий рендер.
 */
ssrRouter.get('/ssr/news', (_req, res) => {
  const items = store.news
    .list()
    .map((n) => `<article><h2>${escape(n.title)}</h2><p>${escape(n.excerpt)}</p></article>`)
    .join('');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Render-Mode', 'SSR');
  res.type('html').send(layout('Новости банка (SSR)', `<h1>Новости</h1>${items}`));
});

/**
 * ISR: рендер кешируется на N секунд и переотдаётся из кеша (stale-while-revalidate).
 * Показывает, как настраивать инкрементальную регенерацию через заголовки.
 */
ssrRouter.get('/isr/rates', (_req, res) => {
  const rows = store.currencyRates
    .list()
    .map((r) => `<tr><td>${escape(r.code)}</td><td>${r.buy}</td><td>${r.sell}</td></tr>`)
    .join('');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.setHeader('X-Render-Mode', 'ISR');
  res.type('html').send(
    layout(
      'Курсы валют (ISR)',
      `<h1>Курсы валют</h1><table><thead><tr><th>Код</th><th>Покупка</th><th>Продажа</th></tr></thead><tbody>${rows}</tbody></table>`,
    ),
  );
});

/**
 * CSR: сервер отдаёт «пустой» каркас, данные фронт тянет сам из /api/v1/*.
 * Демонстрирует контраст с SSR.
 */
ssrRouter.get('/csr/app', (_req, res) => {
  res.setHeader('X-Render-Mode', 'CSR');
  res.type('html').send(
    layout(
      'Приложение (CSR)',
      '<div id="app">Загрузка…</div>',
      '<script>fetch("/api/v1/rates").then(r=>r.json()).then(d=>{document.getElementById("app").textContent=JSON.stringify(d)})</script>',
    ),
  );
});
