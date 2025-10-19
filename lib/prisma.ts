import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Fix Railway MongoDB URL to include database name
function getDatabaseUrl(): string {
  let dbUrl = process.env.DATABASE_URL || '';

  // If the URL doesn't include a database name, add it
  // MongoDB URLs should have format: mongodb://user:pass@host:port/database
  if (dbUrl && dbUrl.startsWith('mongodb://') && !dbUrl.includes('?')) {
    // No query params, check if database name exists
    const urlParts = dbUrl.split('@');
    if (urlParts.length === 2) {
      const afterAt = urlParts[1];
      // Check if there's a slash after host:port
      const hasDbName = afterAt.split('/').length > 1 && afterAt.split('/')[1].length > 0;
      if (!hasDbName) {
        dbUrl = dbUrl + '/accountant?authSource=admin';
      }
    }
  } else if (dbUrl && dbUrl.includes('?') && !dbUrl.match(/\/[^\/]+\?/)) {
    // Has query params but no database name
    dbUrl = dbUrl.replace('?', '/accountant?');
  }

  return dbUrl;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
