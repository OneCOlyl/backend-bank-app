import gql from 'graphql-tag';

/** GraphQL-схема поверх того же доменного стора, что и REST/gRPC. */
export const typeDefs = gql`
  type CurrencyRate {
    code: String!
    nominal: Int!
    buy: Float!
    sell: Float!
    updatedAt: String!
  }

  enum ProductCategory {
    deposit
    credit
    card
    mortgage
  }

  type Product {
    id: ID!
    category: ProductCategory!
    title: String!
    rate: Float!
    minAmount: Float!
    maxAmount: Float!
    termMonths: Int!
    featured: Boolean!
  }

  type NewsArticle {
    id: ID!
    slug: String!
    title: String!
    excerpt: String!
    body: String!
    publishedAt: String!
    tags: [String!]!
  }

  type User {
    id: ID!
    email: String!
    name: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type LoanApplication {
    id: ID!
    productId: ID!
    fullName: String!
    phone: String!
    amount: Float!
    termMonths: Int!
    createdAt: String!
    status: String!
  }

  input LoanApplicationInput {
    productId: ID!
    fullName: String!
    phone: String!
    amount: Float!
    termMonths: Int!
  }

  type Query {
    rates: [CurrencyRate!]!
    rate(code: String!): CurrencyRate
    products(category: ProductCategory): [Product!]!
    product(id: ID!): Product
    news(limit: Int): [NewsArticle!]!
    article(slug: String!): NewsArticle
    "Текущий пользователь. Требует заголовок Authorization: Bearer <token>."
    me: User
    applications: [LoanApplication!]!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    "Создать заявку. Требует авторизации."
    createApplication(input: LoanApplicationInput!): LoanApplication!
  }
`;
