// ProviderIQ — tRPC Context Implementation
// Powered by Inquantic.Ai

import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { prisma } from '@provideriq/database';

export interface Context {
  db: typeof prisma;
  apiKey?: string;
}

export async function createContext({
  req,
}: CreateExpressContextOptions): Promise<Context> {
  const authHeader = req.headers.authorization;
  let apiKey: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7);
  }

  return {
    db: prisma,
    apiKey,
  };
}
