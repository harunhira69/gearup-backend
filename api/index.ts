import app from '../src/app';
import { prisma } from '../src/lib/prisma';

declare global {
  var __prismaConnected: boolean | undefined;
}

export default async function handler(req: any, res: any) {
  try {
    if (!globalThis.__prismaConnected && process.env.DATABASE_URL) {
      await prisma.$connect();
      globalThis.__prismaConnected = true;
    }
  } catch (error) {
    console.error('Prisma connection failed in Vercel handler:', error);
  }

  return app(req, res);
}
