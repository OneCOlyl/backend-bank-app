import { Router } from 'express';
import { bus } from '../events.js';

/**
 * Server-Sent Events поверх той же шины. Путь /sse/rates.
 * Работает с нативным EventEmitter браузера (`new EventSource('/sse/rates')`) —
 * удобно для Angular без доп. библиотек. Однонаправленный поток server → client.
 */
export const sseRouter = Router();

sseRouter.get('/sse/rates', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const off = bus.subscribe('rate:update', (rates) => send('rate:update', rates));

  // Комментарий-heartbeat раз в 15с, чтобы прокси не рвали соединение.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 15000);

  req.on('close', () => {
    off();
    clearInterval(heartbeat);
  });
});
