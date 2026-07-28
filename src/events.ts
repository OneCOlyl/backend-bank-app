import { EventEmitter } from 'node:events';
import type { CurrencyRate, LoanApplication } from './types.js';

/**
 * Единая шина событий домена. Публикуют — стор/тикер, подписываются — WebSocket и SSE.
 * Один источник правды для real-time (DRY): транспорты не знают друг о друге.
 */
export interface DomainEvents {
  'rate:update': CurrencyRate[];
  'application:new': LoanApplication;
}

export type DomainEventName = keyof DomainEvents;

class TypedBus extends EventEmitter {
  publish<K extends DomainEventName>(event: K, payload: DomainEvents[K]): void {
    this.emit(event, payload);
  }
  subscribe<K extends DomainEventName>(event: K, handler: (payload: DomainEvents[K]) => void): () => void {
    this.on(event, handler);
    return () => this.off(event, handler);
  }
}

export const bus = new TypedBus();
// Много одновременных SSE/WS-подписчиков — снимаем дефолтный лимит в 10.
bus.setMaxListeners(0);
