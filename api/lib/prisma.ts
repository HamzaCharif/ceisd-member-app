// /api/lib/prisma.ts
// The ONE PrismaClient for the whole API.
//
// Why: every router used to call `new PrismaClient()` — 26 separate connection
// pools against the same Postgres. On a 2-vCPU AUS server that exhausts
// max_connections under light load. Import `prisma` from here everywhere.
//
// DATABASE_ADAPTER=pg switches to the `pg` driver adapter (WASM query engine).
// This is what lets the API run in environments where Prisma's native engine
// can't be downloaded (CI sandboxes, locked-down servers). Default is the
// standard native engine, identical to before.

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __ceisdPrisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const logLevels: Array<'query' | 'warn' | 'error'> =
    process.env.PRISMA_LOG === 'query' ? ['query', 'warn', 'error'] : ['warn', 'error'];

  if (process.env.DATABASE_ADAPTER === 'pg') {
    // Lazy requires so the native-engine path never loads `pg` at all.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Pool } = require('pg') as typeof import('pg');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaPg } = require('@prisma/adapter-pg') as typeof import('@prisma/adapter-pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
    const adapter = new PrismaPg(pool);
    // The WASM build of the client has the same API/types as the native one.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient: WasmPrismaClient } = require('.prisma/client/wasm') as { PrismaClient: typeof PrismaClient };
    return new WasmPrismaClient({ adapter, log: logLevels });
  }

  return new PrismaClient({ log: logLevels });
}

// Reuse across hot reloads (ts-node-dev respawn) so we don't leak pools.
export const prisma: PrismaClient = global.__ceisdPrisma ?? createClient();
if (process.env.NODE_ENV !== 'production') {
  global.__ceisdPrisma = prisma;
}

export default prisma;
