import type { Role } from '@prisma/client';
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/hash.js';

// Bootstrap seed — creates one login per role so every role can be tested.
// Seeding is a server/admin operation, so it may set roles directly; this is
// the "realistic account creation" that creates the first Admin. Self-signup
// still only ever makes Employees (Golden Invariant #1).
async function main() {
  // A department so scoped roles (Department Head / Employee) have a home.
  let dept = await prisma.department.findFirst({ where: { name: 'Operations' } });
  if (!dept) {
    dept = await prisma.department.create({ data: { name: 'Operations', status: 'ACTIVE' } });
  }

  const accounts: Array<{ name: string; email: string; role: Role; password: string; inDept: boolean }> = [
    { name: 'Alice Admin', email: 'admin@assetflow.test', role: 'ADMIN', password: 'Admin@123', inDept: false },
    { name: 'Manav Manager', email: 'manager@assetflow.test', role: 'ASSET_MANAGER', password: 'Manager@123', inDept: true },
    { name: 'Hena Head', email: 'head@assetflow.test', role: 'DEPARTMENT_HEAD', password: 'Head@123', inDept: true },
    { name: 'Evan Employee', email: 'employee@assetflow.test', role: 'EMPLOYEE', password: 'Employee@123', inDept: true },
  ];

  const created: Record<string, string> = {};
  for (const a of accounts) {
    const passwordHash = await hashPassword(a.password);
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: { name: a.name, role: a.role, passwordHash, status: 'ACTIVE', departmentId: a.inDept ? dept.id : null },
      create: { name: a.name, email: a.email, role: a.role, passwordHash, status: 'ACTIVE', departmentId: a.inDept ? dept.id : null },
    });
    created[a.role] = user.id;
  }

  // Make the Department Head the head of Operations.
  if (created.DEPARTMENT_HEAD) {
    await prisma.department.update({ where: { id: dept.id }, data: { headUserId: created.DEPARTMENT_HEAD } });
  }

  console.log('\n✅ Seeded login accounts (email / password):\n');
  console.log('  Admin           admin@assetflow.test      Admin@123');
  console.log('  Asset Manager   manager@assetflow.test    Manager@123');
  console.log('  Department Head  head@assetflow.test       Head@123');
  console.log('  Employee         employee@assetflow.test   Employee@123');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
