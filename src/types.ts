/** Общие доменные типы. Единый источник правды для REST, GraphQL и gRPC (DRY). */

export interface CurrencyRate {
  code: string; // ISO 4217, напр. USD
  nominal: number; // за сколько единиц указан курс
  buy: number; // покупка банком
  sell: number; // продажа банком
  updatedAt: string; // ISO-дата
}

export type ProductCategory = 'deposit' | 'credit' | 'card' | 'mortgage';

export interface Product {
  id: string;
  category: ProductCategory;
  title: string;
  rate: number; // ставка, % годовых
  minAmount: number;
  maxAmount: number;
  termMonths: number;
  featured: boolean;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  publishedAt: string; // ISO-дата
  tags: string[];
}

export interface User {
  id: string;
  email: string;
  passwordHash: string; // для теста — простой hash, не для прода
  name: string;
}

export interface LoanApplication {
  id: string;
  productId: string;
  fullName: string;
  phone: string;
  amount: number;
  termMonths: number;
  createdAt: string;
  status: 'new' | 'processing' | 'approved' | 'rejected';
}
