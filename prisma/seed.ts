import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {}, // Do nothing if it exists
      create: {
        username: 'admin',
        password: hashedPassword,
      },
    });
    
    console.log('Admin user seeded successfully or already existed. Username:', adminUser.username);
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
