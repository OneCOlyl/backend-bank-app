# backend-bank-app

Тестовый бэкенд для фронтенд-задания (корпоративный сайт банка, ПСБ).
Один доменный слой, четыре способа доступа: **REST**, **GraphQL**, **gRPC** + демо
серверного рендеринга (**SSR / SSG / ISR / CSR**).

Стек: TypeScript 5, Express 4, Apollo Server 4, @grpc/grpc-js, Zod, JWT.
Данные — моки в памяти (`src/store.ts`), общие для всех транспортов (DRY).

## Запуск

```bash
npm install
npm run dev        # HTTP :3000, gRPC :50051 (watch-режим)
# или
npm run build && npm start
```

Переменные окружения (все опциональны): `HTTP_PORT`, `GRPC_PORT`, `JWT_SECRET`,
`JWT_TTL`, `LATENCY_MS` (искусственная задержка ответов для отладки лоадеров), `CORS_ORIGIN`.

Демо-пользователь: `demo@psbank.ru` / `demo1234`.

## REST — `/api/v1`

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/rates` | — | Курсы валют |
| GET | `/rates/:code` | — | Курс по коду (USD…) |
| GET | `/products?category=` | — | Продукты/тарифы |
| GET | `/products/:id` | — | Продукт по id |
| GET | `/news?limit=` | — | Новости |
| GET | `/news/:slug` | — | Новость по slug |
| POST | `/auth/login` | — | `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | Bearer | Текущий пользователь |
| POST | `/applications` | Bearer | Создать заявку на продукт |
| GET | `/applications` | Bearer | Список заявок |

```bash
TOKEN=$(curl -s -X POST localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@psbank.ru","password":"demo1234"}' | jq -r .token)

curl localhost:3000/api/v1/auth/me -H "Authorization: Bearer $TOKEN"
```

## GraphQL — `/graphql`

Playground доступен в браузере. Пример:

```graphql
query { products(category: deposit){ id title rate } rate(code:"USD"){ buy sell } }
mutation { login(email:"demo@psbank.ru", password:"demo1234"){ token user { name } } }
```

Мутации/поля с авторизацией требуют заголовок `Authorization: Bearer <token>`.

## gRPC — `:50051`

Контракт: `proto/bank.proto`. Методы: `ListRates`, `GetRate`, `ListProducts`, `ListNews`.

```bash
npm run grpc:client   # smoke-проверка
```

## Рендеринг (демо для фронта)

| Путь | Режим | Заголовки |
|------|-------|-----------|
| `/` (public/index.html) | SSG | статика из `/public` |
| `/ssr/news` | SSR | `Cache-Control: no-store` |
| `/isr/rates` | ISR | `s-maxage=60, stale-while-revalidate=300` |
| `/csr/app` | CSR | пустой каркас + fetch на `/api/v1` |

Каждый ответ помечен заголовком `X-Render-Mode`.

## Структура

```
proto/bank.proto        контракт gRPC
src/config.ts           конфиг из env
src/types.ts            доменные типы (единый источник)
src/store.ts            in-memory данные + доступ
src/auth.ts             JWT, middleware, проверка пароля
src/rest/routes.ts      REST-роуты + валидация Zod
src/graphql/            схема + резолверы
src/grpc/server.ts      gRPC-сервер
src/ssr/render.ts       SSR/ISR/CSR роуты
src/server.ts           сборка приложения
scripts/grpc-client.ts  тест-клиент gRPC
```

Принципы: SOLID (слои разделены), DRY (общий стор), KISS/YAGNI (моки без лишней инфраструктуры).
