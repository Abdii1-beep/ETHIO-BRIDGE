import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.update({
    where: { email: 'admin@ethio.bridge' },
    data: { approvalStatus: 'APPROVED' },
  });
  console.log('Admin user approved:', admin.email, admin.approvalStatus);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
