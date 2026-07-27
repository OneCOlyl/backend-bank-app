import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { config } from '../src/config.js';

/** Небольшой smoke-клиент для проверки gRPC-сервиса: `npm run grpc:client`. */
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = resolve(__dirname, '../proto/bank.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, { keepCase: true, enums: String, defaults: true });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proto = grpc.loadPackageDefinition(packageDef) as any;

const client = new proto.bank.BankService(
  `localhost:${config.grpcPort}`,
  grpc.credentials.createInsecure(),
);

client.ListRates({}, (err: unknown, res: unknown) => {
  if (err) {
    console.error('gRPC ошибка:', err);
    process.exit(1);
  }
  console.log('ListRates:', JSON.stringify(res, null, 2));
  client.ListProducts({ category: 'deposit' }, (e: unknown, r: unknown) => {
    if (e) console.error(e);
    else console.log('ListProducts(deposit):', JSON.stringify(r, null, 2));
    process.exit(0);
  });
});
