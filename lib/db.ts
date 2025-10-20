/**
 * Database Connection Manager
 *
 * This module manages connections to MongoDB for both:
 * 1. Prisma (for application data models)
 * 2. Mongoose (for Medici double-entry accounting)
 *
 * Both use the same DATABASE_URL but different client libraries.
 */

import mongoose from 'mongoose';
import { prisma } from './prisma';

// Fix DATABASE_URL to include database name if missing
function getDatabaseUrl(): string {
  let dbUrl = process.env.DATABASE_URL || '';

  if (dbUrl && dbUrl.startsWith('mongodb://') && !dbUrl.includes('?')) {
    const urlParts = dbUrl.split('@');
    if (urlParts.length === 2) {
      const afterAt = urlParts[1];
      const hasDbName = afterAt.split('/').length > 1 && afterAt.split('/')[1].length > 0;
      if (!hasDbName) {
        dbUrl = dbUrl + '/accountant?authSource=admin';
      }
    }
  } else if (dbUrl && dbUrl.includes('?') && !dbUrl.match(/\/[^\/]+\?/)) {
    dbUrl = dbUrl.replace('?', '/accountant?');
  }

  return dbUrl;
}

// Track connection state
let isMongooseConnected = false;

/**
 * Initialize Mongoose connection for Medici
 * Prisma manages its own connection automatically
 */
export async function connectDb() {
  // Prisma connects automatically, no action needed

  // Connect Mongoose for Medici
  if (!isMongooseConnected) {
    try {
      const dbUrl = getDatabaseUrl();

      if (!dbUrl) {
        throw new Error('DATABASE_URL is not defined');
      }

      await mongoose.connect(dbUrl, {
        bufferCommands: false,
      });

      isMongooseConnected = true;

      if (process.env.NODE_ENV === 'development') {
        console.log('✓ Mongoose connected for Medici');
      }
    } catch (error) {
      console.error('Mongoose connection error:', error);
      throw error;
    }
  }
}

/**
 * Disconnect from database
 * Use this in tests or during shutdown
 */
export async function disconnectDb() {
  // Disconnect Mongoose
  if (isMongooseConnected) {
    await mongoose.disconnect();
    isMongooseConnected = false;

    if (process.env.NODE_ENV === 'development') {
      console.log('✓ Mongoose disconnected');
    }
  }

  // Disconnect Prisma
  await prisma.$disconnect();
}

/**
 * Get Prisma client (for app data)
 */
export { prisma };

/**
 * Get Mongoose instance (for Medici)
 */
export { mongoose };

/**
 * Check if database is connected
 */
export function isConnected(): boolean {
  return isMongooseConnected && mongoose.connection.readyState === 1;
}
