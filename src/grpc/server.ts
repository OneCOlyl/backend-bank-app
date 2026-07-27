import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { config } from '../config.js';
import { store } from '../store.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = resolve(__dirname, '../../proto/bank.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proto = grpc.loadPackageDefinition(packageDef) as any;

/** Реализация методов сервиса. Читает из общего стора (DRY). */
const bankService = {
  ListRates: (_call: unknown, callback: grpc.sendUnaryData<unknown>) => {
    callback(null, { rates: store.currencyRates.list() });
  },
  GetRate: (call: grpc.ServerUnaryCall<{ code: string }, unknown>, callback: grpc.sendUnaryData<unknown>) => {
    const rate = store.currencyRates.byCode(call.request.code);
    if (!rate) {
      callback({ code: grpc.status.NOT_FOUND, message: 'Валюта не найдена' });
      return;
    }
    callback(null, rate);
  },
  ListProducts: (call: grpc.ServerUnaryCall<{ category: string }, unknown>, callback: grpc.sendUnaryData<unknown>) => {
    const category = call.request.category || undefined;
    callback(null, { products: store.products.list(category) });
  },
  ListNews: (call: grpc.ServerUnaryCall<{ limit: number }, unknown>, callback: grpc.sendUnaryData<unknown>) => {
    const limit = call.request.limit > 0 ? call.request.limit : undefined;
    callback(null, { articles: store.news.list(limit) });
  },
};

export const startGrpcServer = (): Promise<void> =>
  new Promise((resolvePromise, reject) => {
    const server = new grpc.Server();
    server.addService(proto.bank.BankService.service, bankService);
    server.bindAsync(
      `0.0.0.0:${config.grpcPort}`,
      grpc.ServerCredentials.createInsecure(),
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log(`gRPC  → 0.0.0.0:${config.grpcPort}`);
        resolvePromise();
      },
    );
  });
