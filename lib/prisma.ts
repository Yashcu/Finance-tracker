import { PrismaClient } from '@prisma/client'

// Performance optimization configuration
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection pooling optimization
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Query engine optimization
    __internal: {
      engine: {
        binaryTarget: process.platform === 'win32' ? 'windows' : 'debian-openssl-3.0.x',
      }
    }
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use existing client if already created (connection pooling)
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// In development, keep the client alive between hot reloads
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Handle connection management for Prisma 5.0.0+ 
// Use process events instead of Prisma's beforeExit hook
process.on('beforeExit', async () => {
  console.log('Prisma client is disconnecting');
  await prisma.$disconnect();
});

// Handle connection errors gracefully
process.on('SIGINT', async () => {
  console.log('SIGINT received, disconnecting Prisma client');
  await prisma.$disconnect();
  process.exit(0);
});

// When the Node.js process ends, close the Prisma Client
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, disconnecting Prisma client');
  await prisma.$disconnect();
  process.exit(0);
}); 