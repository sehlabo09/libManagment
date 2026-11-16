/**
 * Database seed script.
 *
 * Creates the default administrator account. Run it with:
 *   npx prisma db seed
 * or
 *   npm run seed
 *
 * The starter password must be changed on first login (the account is flagged
 * with mustChangePassword = true).
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');

const DEFAULT_ADMIN = {
  fullName: 'Library Administrator',
  membershipId: 'LIB-ADMIN-001',
  email: 'admin@library.com',
  password: 'Admin@123',
};

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: DEFAULT_ADMIN.email },
  });

  if (existing) {
    console.log(`Seed skipped: ${DEFAULT_ADMIN.email} already exists.`);
    return;
  }

  const admin = await prisma.user.create({
    data: {
      fullName: DEFAULT_ADMIN.fullName,
      membershipId: DEFAULT_ADMIN.membershipId,
      email: DEFAULT_ADMIN.email,
      password: await bcrypt.hash(DEFAULT_ADMIN.password, 10),
      role: 'ADMIN',
      mustChangePassword: true,
    },
  });

  console.log('Default administrator created:');
  console.log(`   Email:        ${DEFAULT_ADMIN.email}`);
  console.log(`   Password:     ${DEFAULT_ADMIN.password}`);
  console.log(`   Membership:   ${admin.membershipId}`);
  console.log('You will be asked to change this password after your first login.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
