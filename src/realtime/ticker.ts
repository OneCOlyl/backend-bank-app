import { store } from '../store.js';

/**
 * Периодически двигает курсы валют — генератор real-time данных.
 * Интервал настраивается через RATE_TICK_MS (по умолчанию 3с).
 */
export const startRateTicker = (): NodeJS.Timeout => {
  const intervalMs = Number(process.env.RATE_TICK_MS ?? 3000);
  return setInterval(() => store.currencyRates.tick(), intervalMs);
};
