import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { DEFAULT_USER_ID } from './constants';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || 'file:./dev.db',
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function cleanupDuplicateFavorites() {
  try {
    const favorites = await prisma.favorite.findMany({
      orderBy: { createdAt: 'asc' },
    });
    const seen = new Set<string>();
    const toDeleteIds: string[] = [];
    for (const fav of favorites) {
      const key = `${fav.userId}-${fav.trackId}`;
      if (seen.has(key)) {
        toDeleteIds.push(fav.id);
      } else {
        seen.add(key);
      }
    }
    if (toDeleteIds.length > 0) {
      await prisma.favorite.deleteMany({
        where: { id: { in: toDeleteIds } },
      });
      console.log(`[Favorites Deduplication] Cleaned up ${toDeleteIds.length} duplicate favorites.`);
    }
  } catch (error) {
    console.error('Failed to cleanup duplicate favorites:', error);
  }
}

export async function ensureDefaultUser() {
  try {
    const exists = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } });
    if (!exists) {
      await prisma.user.create({
        data: {
          id: DEFAULT_USER_ID,
          name: 'Music Lover',
          email: 'user@mytify.app',
        },
      });
    }
    await cleanupDuplicateFavorites();
  } catch (error) {
    console.error('Failed to ensure default user exists:', error);
  }
}
