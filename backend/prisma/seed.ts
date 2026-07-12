import type { Role } from '@prisma/client';
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/hash.js';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing transactional data to avoid unique/FK constraints
  console.log('Cleaning old transactional records...');
  await prisma.booking.deleteMany({});
  await prisma.maintenanceRequest.deleteMany({});
  await prisma.allocation.deleteMany({});
  await prisma.transferRequest.deleteMany({});
  await prisma.auditItem.deleteMany({});
  await prisma.auditAssignment.deleteMany({});
  await prisma.auditCycle.deleteMany({});
  await prisma.asset.deleteMany({});

  // 2. Setup Departments
  console.log('Seeding departments...');
  const getOrCreateDept = async (name: string) => {
    let dept = await prisma.department.findFirst({ where: { name } });
    if (!dept) {
      dept = await prisma.department.create({ data: { name, status: 'ACTIVE' } });
    }
    return dept;
  };

  const deptOperations = await getOrCreateDept('Operations');
  const deptIT = await getOrCreateDept('IT');
  const deptHR = await getOrCreateDept('HR');
  const deptSales = await getOrCreateDept('Sales');

  // 3. Setup Users (Accounts)
  console.log('Seeding users...');
  const accounts: Array<{ name: string; email: string; role: Role; password: string; departmentName: string | null }> = [
    { name: 'Alice Admin', email: 'admin@assetflow.test', role: 'ADMIN', password: 'Admin@123', departmentName: null },
    { name: 'Manav Manager', email: 'manager@assetflow.test', role: 'ASSET_MANAGER', password: 'Manager@123', departmentName: 'Operations' },
    { name: 'Hena Head', email: 'head@assetflow.test', role: 'DEPARTMENT_HEAD', password: 'Head@123', departmentName: 'Operations' },
    { name: 'Evan Employee', email: 'employee@assetflow.test', role: 'EMPLOYEE', password: 'Employee@123', departmentName: 'Operations' },
    { name: 'Sarah Sales', email: 'sarah.sales@assetflow.test', role: 'EMPLOYEE', password: 'Employee@123', departmentName: 'Sales' },
    { name: 'Ian IT', email: 'ian.it@assetflow.test', role: 'EMPLOYEE', password: 'Employee@123', departmentName: 'IT' },
  ];

  const createdUsers: Record<string, string> = {};
  for (const a of accounts) {
    const passwordHash = await hashPassword(a.password);
    let departmentId: string | null = null;
    if (a.departmentName) {
      const d = await prisma.department.findFirst({ where: { name: a.departmentName } });
      if (d) departmentId = d.id;
    }

    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: { name: a.name, role: a.role, passwordHash, status: 'ACTIVE', departmentId },
      create: { name: a.name, email: a.email, role: a.role, passwordHash, status: 'ACTIVE', departmentId },
    });
    createdUsers[a.email] = user.id;
  }

  // Update Head of Operations
  if (createdUsers['head@assetflow.test']) {
    await prisma.department.update({
      where: { id: deptOperations.id },
      data: { headUserId: createdUsers['head@assetflow.test'] },
    });
  }

  // 4. Setup Asset Categories
  console.log('Seeding asset categories...');
  const getOrCreateCategory = async (name: string) => {
    let cat = await prisma.assetCategory.findFirst({ where: { name } });
    if (!cat) {
      cat = await prisma.assetCategory.create({ data: { name, status: 'ACTIVE', customFields: {} } });
    }
    return cat;
  };

  const catIT = await getOrCreateCategory('IT Equipment');
  const catFurniture = await getOrCreateCategory('Furniture');
  const catVehicles = await getOrCreateCategory('Vehicles');

  // 5. Setup Assets
  console.log('Seeding assets...');
  const assetsData = [
    // IT Equipment
    { name: 'MacBook Pro 16"', assetTag: 'AF-0001', serialNumber: 'SN-MBP16-001', categoryId: catIT.id, acquisitionDate: new Date('2025-01-10'), acquisitionCost: 2500.00, condition: 'EXCELLENT', location: 'HQ - Floor 3', status: 'ALLOCATED', isBookable: false, ownerDepartmentId: deptIT.id },
    { name: 'Dell UltraSharp 27"', assetTag: 'AF-0002', serialNumber: 'SN-DEL27-002', categoryId: catIT.id, acquisitionDate: new Date('2025-02-15'), acquisitionCost: 450.00, condition: 'GOOD', location: 'HQ - Floor 3', status: 'AVAILABLE', isBookable: true, ownerDepartmentId: deptIT.id },
    { name: 'Lenovo ThinkPad X1', assetTag: 'AF-0003', serialNumber: 'SN-TPX1-003', categoryId: catIT.id, acquisitionDate: new Date('2025-01-20'), acquisitionCost: 1800.00, condition: 'EXCELLENT', location: 'HQ - Floor 2', status: 'ALLOCATED', isBookable: false, ownerDepartmentId: deptIT.id },
    { name: 'iPad Pro 12.9"', assetTag: 'AF-0004', serialNumber: 'SN-IPAD-004', categoryId: catIT.id, acquisitionDate: new Date('2025-03-01'), acquisitionCost: 1100.00, condition: 'EXCELLENT', location: 'IT Locker', status: 'AVAILABLE', isBookable: true, ownerDepartmentId: deptIT.id },
    
    // Furniture
    { name: 'Ergonomic Desk', assetTag: 'AF-0005', serialNumber: 'SN-DSK-005', categoryId: catFurniture.id, acquisitionDate: new Date('2024-06-15'), acquisitionCost: 600.00, condition: 'GOOD', location: 'HQ - Floor 1', status: 'AVAILABLE', isBookable: false, ownerDepartmentId: deptOperations.id },
    { name: 'Aeron Mesh Chair', assetTag: 'AF-0006', serialNumber: 'SN-CHR-006', categoryId: catFurniture.id, acquisitionDate: new Date('2024-06-18'), acquisitionCost: 1200.00, condition: 'GOOD', location: 'HQ - Floor 1', status: 'ALLOCATED', isBookable: true, ownerDepartmentId: deptOperations.id },
    { name: 'Conference Table', assetTag: 'AF-0007', serialNumber: 'SN-TBL-007', categoryId: catFurniture.id, acquisitionDate: new Date('2024-07-20'), acquisitionCost: 1500.00, condition: 'FAIR', location: 'Room 301', status: 'AVAILABLE', isBookable: true, ownerDepartmentId: deptOperations.id },

    // Vehicles
    { name: 'Toyota Prius', assetTag: 'AF-0008', serialNumber: 'SN-TOY-008', categoryId: catVehicles.id, acquisitionDate: new Date('2023-11-05'), acquisitionCost: 28000.00, condition: 'GOOD', location: 'Garage A', status: 'UNDER_MAINTENANCE', isBookable: true, ownerDepartmentId: deptOperations.id },
    { name: 'Transit Delivery Van', assetTag: 'AF-0009', serialNumber: 'SN-VAN-009', categoryId: catVehicles.id, acquisitionDate: new Date('2023-05-12'), acquisitionCost: 35000.00, condition: 'FAIR', location: 'Garage B', status: 'AVAILABLE', isBookable: true, ownerDepartmentId: deptOperations.id },
  ];

  const seededAssets: Record<string, any> = {};
  for (const a of assetsData) {
    const asset = await prisma.asset.create({
      data: {
        name: a.name,
        assetTag: a.assetTag,
        serialNumber: a.serialNumber,
        categoryId: a.categoryId,
        acquisitionDate: a.acquisitionDate,
        acquisitionCost: a.acquisitionCost,
        condition: a.condition,
        location: a.location,
        status: a.status as any,
        isBookable: a.isBookable,
        ownerDepartmentId: a.ownerDepartmentId,
      },
    });
    seededAssets[a.assetTag] = asset;
  }

  // 6. Setup Allocations
  console.log('Seeding allocations...');
  await prisma.allocation.create({
    data: {
      assetId: seededAssets['AF-0001'].id,
      allocatedToUserId: createdUsers['employee@assetflow.test'],
      allocatedByUserId: createdUsers['manager@assetflow.test'],
      status: 'ACTIVE',
      expectedReturnDate: new Date('2027-01-10'),
    },
  });

  await prisma.allocation.create({
    data: {
      assetId: seededAssets['AF-0003'].id,
      allocatedToUserId: createdUsers['manager@assetflow.test'],
      allocatedByUserId: createdUsers['admin@assetflow.test'],
      status: 'ACTIVE',
      expectedReturnDate: new Date('2027-01-20'),
    },
  });

  await prisma.allocation.create({
    data: {
      assetId: seededAssets['AF-0006'].id,
      allocatedToUserId: createdUsers['sarah.sales@assetflow.test'],
      allocatedByUserId: createdUsers['manager@assetflow.test'],
      status: 'ACTIVE',
    },
  });

  // 7. Setup Maintenance Requests
  console.log('Seeding maintenance requests...');
  // Critical Maintenance (Resolved)
  await prisma.maintenanceRequest.create({
    data: {
      assetId: seededAssets['AF-0001'].id,
      raisedByUserId: createdUsers['employee@assetflow.test'],
      description: 'Screen flickering issue',
      priority: 'CRITICAL',
      status: 'RESOLVED',
      resolvedAt: new Date(),
    },
  });

  // High Maintenance (Resolved)
  await prisma.maintenanceRequest.create({
    data: {
      assetId: seededAssets['AF-0009'].id,
      raisedByUserId: createdUsers['employee@assetflow.test'],
      description: 'Brake pads replacement',
      priority: 'HIGH',
      status: 'RESOLVED',
      resolvedAt: new Date(),
    },
  });

  // Medium Maintenance (Under Maintenance Status)
  await prisma.maintenanceRequest.create({
    data: {
      assetId: seededAssets['AF-0008'].id,
      raisedByUserId: createdUsers['employee@assetflow.test'],
      description: 'Regular engine service and checkup',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
    },
  });

  // Low Maintenance (Pending)
  await prisma.maintenanceRequest.create({
    data: {
      assetId: seededAssets['AF-0002'].id,
      raisedByUserId: createdUsers['employee@assetflow.test'],
      description: 'Display calibration requested',
      priority: 'LOW',
      status: 'PENDING',
    },
  });

  // 8. Setup Bookings (for Booking Peaks Heatmap)
  console.log('Seeding bookings for peaks heatmap...');
  // We want to seed bookings at various days and hours:
  // Days: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
  const bookingsMock = [
    // Monday (Mon) bookings
    { day: 1, hour: 9, asset: 'AF-0004' },
    { day: 1, hour: 9, asset: 'AF-0008' },
    { day: 1, hour: 10, asset: 'AF-0004' },
    { day: 1, hour: 14, asset: 'AF-0009' },
    
    // Tuesday (Tue) bookings
    { day: 2, hour: 11, asset: 'AF-0004' },
    { day: 2, hour: 16, asset: 'AF-0008' },
    { day: 2, hour: 16, asset: 'AF-0009' },

    // Wednesday (Wed) bookings (Peak: 14:00 - 15:00)
    { day: 3, hour: 14, asset: 'AF-0004' },
    { day: 3, hour: 14, asset: 'AF-0008' },
    { day: 3, hour: 14, asset: 'AF-0009' },
    { day: 3, hour: 15, asset: 'AF-0004' },
    { day: 3, hour: 15, asset: 'AF-0006' },

    // Thursday (Thu) bookings
    { day: 4, hour: 10, asset: 'AF-0004' },
    { day: 4, hour: 13, asset: 'AF-0008' },

    // Friday (Fri) bookings (Peak: 10:00)
    { day: 5, hour: 10, asset: 'AF-0004' },
    { day: 5, hour: 10, asset: 'AF-0006' },
    { day: 5, hour: 10, asset: 'AF-0008' },
    { day: 5, hour: 11, asset: 'AF-0009' },
    { day: 5, hour: 14, asset: 'AF-0004' },

    // Saturday (Sat) bookings
    { day: 6, hour: 11, asset: 'AF-0008' },
    { day: 6, hour: 12, asset: 'AF-0009' },
  ];

  // Helper to generate a date on the next occurrence of a day of the week, at a specific hour
  const getMockDate = (dayOfWeek: number, hour: number): Date => {
    const d = new Date();
    // Set to next week's occurrence
    const currentDay = d.getUTCDay();
    const distance = (dayOfWeek + 7 - currentDay) % 7;
    d.setUTCDate(d.getUTCDate() + (distance === 0 ? 7 : distance));
    d.setUTCHours(hour, 0, 0, 0);
    return d;
  };

  for (const b of bookingsMock) {
    const startTime = getMockDate(b.day, b.hour);
    const endTime = new Date(startTime);
    endTime.setUTCHours(startTime.getUTCHours() + 1);

    await prisma.booking.create({
      data: {
        assetId: seededAssets[b.asset].id,
        bookedByUserId: createdUsers['employee@assetflow.test'],
        startTime,
        endTime,
        status: 'UPCOMING',
      },
    });
  }

  console.log('\n✅ Database seeding complete!');
  console.log('\nUser accounts seeded (email / password):');
  console.log('  Admin           admin@assetflow.test      Admin@123');
  console.log('  Asset Manager   manager@assetflow.test    Manager@123');
  console.log('  Department Head  head@assetflow.test       Head@123');
  console.log('  Employee         employee@assetflow.test   Employee@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
