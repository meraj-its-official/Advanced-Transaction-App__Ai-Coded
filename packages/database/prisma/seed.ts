import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);
  const pinHash = await bcrypt.hash('123456', 10);

  // Update existing Alam user to have a pin and passwordHash
  const alam = await prisma.user.findFirst({ where: { phone: '9856241536' } });
  if (alam) {
    await prisma.user.update({
      where: { id: alam.id },
      data: {
        passwordHash,
        pin: pinHash,
        kycStatus: 'VERIFIED',
      },
    });
    // Fund Alam's wallet with 50,000 for testing
    if (alam.id) {
      await prisma.wallet.updateMany({
        where: { userId: alam.id },
        data: { balance: 50000 },
      });
    }
  }

  const sampleUsers = [
    {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '9876543211',
      balance: 15000,
    },
    {
      name: 'Rahul Verma',
      email: 'rahul@example.com',
      phone: '9876543212',
      balance: 8500,
    },
    {
      name: 'Sneha Patel',
      email: 'sneha@example.com',
      phone: '9876543213',
      balance: 12000,
    },
    {
      name: 'Vikram Singh',
      email: 'vikram@example.com',
      phone: '9876543214',
      balance: 20000,
    },
    {
      name: 'Ananya Gupta',
      email: 'ananya@example.com',
      phone: '9876543215',
      balance: 35000,
    },
  ];

  for (const u of sampleUsers) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: u.email }, { phone: u.phone }],
      },
    });

    if (!existing) {
      const created = await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          phone: u.phone,
          passwordHash,
          pin: pinHash,
          kycStatus: 'VERIFIED',
          isActive: true,
          wallet: {
            create: {
              balance: u.balance,
              currency: 'INR',
              isLocked: false,
            },
          },
        },
      });
      console.log(`Created user: ${created.name} (${created.phone})`);
    } else {
      console.log(`User already exists: ${existing.name}`);
    }
  }

  console.log('Database seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
