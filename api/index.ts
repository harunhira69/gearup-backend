import app from '../src/app';
import { prisma } from '../src/lib/prisma';

declare global {
  var __prismaConnected: boolean | undefined;
}

export default async function handler(req: any, res: any) {
  if (!globalThis.__prismaConnected) {
    await prisma.$connect();
    globalThis.__prismaConnected = true;
  }

  return app(req, res);
}
