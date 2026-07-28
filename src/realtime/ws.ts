import type { Server } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { bus } from '../events.js';

/**
 * WebSocket-шлюз поверх шины событий. Путь /ws.
 * Клиент получает сообщения вида { type, payload }. Поддерживает ping/pong для heartbeat.
 * Клиент может прислать { "action": "subscribe", "channels": ["rate:update"] } — фильтр по каналам.
 */
export const attachWebSocket = (server: Server): WebSocketServer => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: WebSocket) => {
    // По умолчанию — все каналы.
    let channels = new Set(['rate:update', 'application:new']);

    const send = (type: string, payload: unknown) => {
      if (socket.readyState === WebSocket.OPEN && channels.has(type)) {
        socket.send(JSON.stringify({ type, payload }));
      }
    };

    const offRate = bus.subscribe('rate:update', (p) => send('rate:update', p));
    const offApp = bus.subscribe('application:new', (p) => send('application:new', p));

    socket.send(JSON.stringify({ type: 'connected', payload: { channels: [...channels] } }));

    socket.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.action === 'subscribe' && Array.isArray(msg.channels)) {
          channels = new Set(msg.channels);
          socket.send(JSON.stringify({ type: 'subscribed', payload: { channels: [...channels] } }));
        }
      } catch {
        socket.send(JSON.stringify({ type: 'error', payload: 'Некорректный JSON' }));
      }
    });

    socket.on('close', () => {
      offRate();
      offApp();
    });
  });

  return wss;
};
