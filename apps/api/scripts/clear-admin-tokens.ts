import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      user: {
        email: 'admin@ethio.bridge'
      }
    }
  });
  console.log(`Deleted ${result.count} refresh tokens for admin user`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
