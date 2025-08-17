import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export async function connectDB() {
  const maxRetries = 10;
  const retryDelay = 3000; // 3 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempting database connection (${attempt}/${maxRetries})...`);
      
      // Check if DATABASE_URL is available
      if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is not set');
        console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('DATABASE')));
        
        // Wait a bit and retry (environment variables might be set later)
        if (attempt < maxRetries) {
          console.log(`⏳ Waiting for DATABASE_URL to be set... (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        throw new Error('DATABASE_URL environment variable is not set');
      }
      
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error('❌ Max retries reached. Database connection failed.');
        throw error;
      }
      
      console.log(`⏳ Retrying in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

export async function disconnectDB() {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
}
