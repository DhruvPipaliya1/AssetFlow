import type { Role, AssetStatus } from '@prisma/client';
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/hash.js';
import { nextAssetTag } from '../src/lib/tagGen.js';

// AssetFlow demo seed (ARCHITECTURE §16). Idempotent: clears everything, resets
// the asset-tag sequence, then inserts a realistic dataset so every screen shows
// data without live entry. Seeding is a server/admin operation, so it may set
// roles directly — self-signup still only ever makes Employees (Invariant #1).

const now = Date.now();
const days = (n: number) => new Date(now + n * 24 * 3600 * 1000);
const hours = (n: number) => new Date(now + n * 3600 * 1000);

async function clearAll() {
  // Children first; break the User↔Department cycle before deleting either.
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditItem.deleteMany();
  await prisma.auditAssignment.deleteMany();
  await prisma.auditCycle.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetCategory.deleteMany();
  await prisma.user.updateMany({ data: { departmentId: null } });
  await prisma.department.updateMany({ data: { headUserId: null, parentDepartmentId: null } });
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  // Restart tags at AF-0001 for a clean demo.
  await prisma.$executeRawUnsafe('ALTER SEQUENCE asset_tag_seq RESTART WITH 1');
}

async function main() {
  await clearAll();

  // ── Departments (4, with one parent/child pair) ──
  const engineering = await prisma.department.create({ data: { name: 'Engineering', status: 'ACTIVE' } });
  const backend = await prisma.department.create({
    data: { name: 'Backend Squad', status: 'ACTIVE', parentDepartmentId: engineering.id },
  });
  const operations = await prisma.department.create({ data: { name: 'Operations', status: 'ACTIVE' } });
  const facilities = await prisma.department.create({ data: { name: 'Facilities', status: 'ACTIVE' } });

  // ── Users (1 admin, 2 managers, 3 heads, 8 employees) ──
  const [pwAdmin, pwMgr, pwHead, pwEmp] = await Promise.all([
    hashPassword('Admin@123'),
    hashPassword('Manager@123'),
    hashPassword('Head@123'),
    hashPassword('Employee@123'),
  ]);

  const mk = (name: string, email: string, role: Role, passwordHash: string, departmentId: string | null) =>
    prisma.user.create({ data: { name, email, role, passwordHash, status: 'ACTIVE', departmentId } });

  const admin = await mk('Alice Admin', 'admin@assetflow.test', 'ADMIN', pwAdmin, null);
  const mgr1 = await mk('Manav Manager', 'manager@assetflow.test', 'ASSET_MANAGER', pwMgr, operations.id);
  const mgr2 = await mk('Meera Manager', 'manager2@assetflow.test', 'ASSET_MANAGER', pwMgr, facilities.id);
  const head1 = await mk('Hena Head', 'head@assetflow.test', 'DEPARTMENT_HEAD', pwHead, engineering.id);
  const head2 = await mk('Omar Ops', 'head2@assetflow.test', 'DEPARTMENT_HEAD', pwHead, operations.id);
  const head3 = await mk('Farah Facilities', 'head3@assetflow.test', 'DEPARTMENT_HEAD', pwHead, facilities.id);

  const empDefs: Array<[string, string, string]> = [
    ['Evan Employee', 'employee@assetflow.test', engineering.id],
    ['Ravi Raman', 'ravi@assetflow.test', engineering.id],
    ['Priya Patel', 'priya@assetflow.test', backend.id],
    ['Sara Singh', 'sara@assetflow.test', backend.id],
    ['Liam Lee', 'liam@assetflow.test', operations.id],
    ['Nina Nair', 'nina@assetflow.test', operations.id],
    ['Tom Turner', 'tom@assetflow.test', facilities.id],
    ['Uma Iyer', 'uma@assetflow.test', facilities.id],
  ];
  const employees = [];
  for (const [name, email, dept] of empDefs) {
    employees.push(await mk(name, email, 'EMPLOYEE', pwEmp, dept));
  }

  // Assign department heads.
  await prisma.department.update({ where: { id: engineering.id }, data: { headUserId: head1.id } });
  await prisma.department.update({ where: { id: operations.id }, data: { headUserId: head2.id } });
  await prisma.department.update({ where: { id: facilities.id }, data: { headUserId: head3.id } });

  // ── Categories (5) ──
  const laptops = await prisma.assetCategory.create({ data: { name: 'Laptops' } });
  const monitors = await prisma.assetCategory.create({ data: { name: 'Monitors' } });
  const peripherals = await prisma.assetCategory.create({ data: { name: 'Peripherals' } });
  const rooms = await prisma.assetCategory.create({ data: { name: 'Meeting Rooms' } });
  const vehicles = await prisma.assetCategory.create({ data: { name: 'Vehicles' } });

  // ── Assets (~30 across all statuses) ──
  type Spec = {
    name: string;
    categoryId: string;
    status?: AssetStatus;
    location?: string;
    ownerDepartmentId?: string;
    cost?: number;
    isBookable?: boolean;
  };
  const specs: Spec[] = [
    // Laptops
    { name: 'MacBook Pro 16"', categoryId: laptops.id, location: 'HQ / Floor 3', ownerDepartmentId: engineering.id, cost: 2499 },
    { name: 'MacBook Air M3', categoryId: laptops.id, location: 'HQ / Floor 3', ownerDepartmentId: engineering.id, cost: 1299 },
    { name: 'Dell XPS 15', categoryId: laptops.id, location: 'HQ / Floor 2', ownerDepartmentId: backend.id, cost: 1899 },
    { name: 'ThinkPad X1 Carbon', categoryId: laptops.id, location: 'HQ / Floor 2', ownerDepartmentId: backend.id, cost: 1599 },
    { name: 'ThinkPad T14', categoryId: laptops.id, location: 'HQ / Floor 1', ownerDepartmentId: operations.id, cost: 1199 },
    { name: 'Framework Laptop 13', categoryId: laptops.id, location: 'Remote', ownerDepartmentId: engineering.id, cost: 1399 },
    { name: 'Surface Laptop 5', categoryId: laptops.id, location: 'HQ / Floor 1', ownerDepartmentId: operations.id, cost: 1499, status: 'RETIRED' },
    { name: 'Old Dell Latitude', categoryId: laptops.id, location: 'Storage', ownerDepartmentId: operations.id, cost: 899, status: 'DISPOSED' },
    // Monitors
    { name: 'Dell UltraSharp 27"', categoryId: monitors.id, location: 'HQ / Floor 3', ownerDepartmentId: engineering.id, cost: 549 },
    { name: 'LG 34" UltraWide', categoryId: monitors.id, location: 'HQ / Floor 2', ownerDepartmentId: backend.id, cost: 699 },
    { name: 'Samsung 4K 32"', categoryId: monitors.id, location: 'HQ / Floor 1', ownerDepartmentId: operations.id, cost: 479 },
    { name: 'BenQ Designer 27"', categoryId: monitors.id, location: 'HQ / Floor 3', ownerDepartmentId: engineering.id, cost: 599 },
    { name: 'ASUS ProArt 24"', categoryId: monitors.id, location: 'Storage', ownerDepartmentId: facilities.id, cost: 399, status: 'RESERVED' },
    // Peripherals
    { name: 'Logitech MX Master 3S', categoryId: peripherals.id, location: 'HQ / Floor 3', ownerDepartmentId: engineering.id, cost: 99 },
    { name: 'Keychron K3 Keyboard', categoryId: peripherals.id, location: 'HQ / Floor 2', ownerDepartmentId: backend.id, cost: 84 },
    { name: 'Logitech Brio Webcam', categoryId: peripherals.id, location: 'HQ / Floor 1', ownerDepartmentId: operations.id, cost: 199 },
    { name: 'Jabra Evolve2 Headset', categoryId: peripherals.id, location: 'HQ / Floor 1', ownerDepartmentId: operations.id, cost: 249 },
    { name: 'Anker USB-C Hub', categoryId: peripherals.id, location: 'Storage', ownerDepartmentId: facilities.id, cost: 59, status: 'RESERVED' },
    { name: 'Elgato Stream Deck', categoryId: peripherals.id, location: 'HQ / Floor 3', ownerDepartmentId: engineering.id, cost: 149 },
    { name: 'Missing iPad Pro', categoryId: peripherals.id, location: 'Unknown', ownerDepartmentId: facilities.id, cost: 1099, status: 'LOST' },
    // Vehicles
    { name: 'Ford Transit Van', categoryId: vehicles.id, location: 'Depot', ownerDepartmentId: facilities.id, cost: 42000 },
    { name: 'Toyota Forklift', categoryId: vehicles.id, location: 'Warehouse', ownerDepartmentId: operations.id, cost: 28000 },
    { name: 'Company EV #1', categoryId: vehicles.id, location: 'Depot', ownerDepartmentId: facilities.id, cost: 38000 },
    // Meeting rooms (bookable)
    { name: 'Conference Room A', categoryId: rooms.id, location: 'HQ / Floor 3', ownerDepartmentId: facilities.id, isBookable: true },
    { name: 'Conference Room B', categoryId: rooms.id, location: 'HQ / Floor 2', ownerDepartmentId: facilities.id, isBookable: true },
    { name: 'Huddle Room 1', categoryId: rooms.id, location: 'HQ / Floor 1', ownerDepartmentId: facilities.id, isBookable: true },
    // A couple more available laptops/monitors to round out ~30
    { name: 'MacBook Air M2', categoryId: laptops.id, location: 'HQ / Floor 2', ownerDepartmentId: backend.id, cost: 1099 },
    { name: 'Dell UltraSharp 24"', categoryId: monitors.id, location: 'HQ / Floor 1', ownerDepartmentId: operations.id, cost: 329 },
    { name: 'Logitech C920 Webcam', categoryId: peripherals.id, location: 'HQ / Floor 2', ownerDepartmentId: backend.id, cost: 69 },
    { name: 'Projector Epson EB', categoryId: peripherals.id, location: 'HQ / Floor 3', ownerDepartmentId: facilities.id, cost: 799 },
  ];

  const assets = [];
  for (const s of specs) {
    const assetTag = await nextAssetTag();
    assets.push(
      await prisma.asset.create({
        data: {
          name: s.name,
          assetTag,
          categoryId: s.categoryId,
          status: s.status ?? 'AVAILABLE',
          location: s.location,
          ownerDepartmentId: s.ownerDepartmentId,
          acquisitionCost: s.cost,
          acquisitionDate: days(-200 - Math.floor(Math.random() * 400)),
          isBookable: s.isBookable ?? false,
          condition: 'Good',
        },
      }),
    );
  }
  const byName = (n: string) => assets.find((a) => a.name === n)!;

  // ── Allocations (several active + ONE already-overdue) ──
  const allocate = async (assetName: string, toUser: { id: string }, byUser: { id: string }, expectedReturn: Date, overdue = false) => {
    const asset = byName(assetName);
    await prisma.allocation.create({
      data: {
        assetId: asset.id,
        allocatedToUserId: toUser.id,
        allocatedByUserId: byUser.id,
        allocatedAt: days(overdue ? -20 : -5),
        expectedReturnDate: expectedReturn,
        status: overdue ? 'OVERDUE' : 'ACTIVE',
      },
    });
    await prisma.asset.update({
      where: { id: asset.id },
      data: { status: 'ALLOCATED', currentHolderUserId: toUser.id },
    });
  };
  await allocate('MacBook Pro 16"', employees[0], mgr1, days(14)); // Evan
  await allocate('Dell XPS 15', employees[2], mgr1, days(21)); // Priya
  await allocate('ThinkPad X1 Carbon', employees[3], mgr1, days(30)); // Sara
  await allocate('LG 34" UltraWide', employees[2], mgr1, days(21)); // Priya
  await allocate('Ford Transit Van', employees[6], mgr2, days(2)); // Tom — upcoming return
  await allocate('Toyota Forklift', employees[4], mgr1, days(-3), true); // Liam — OVERDUE

  // ── A pending transfer on a held asset (fromUser = current holder) ──
  await prisma.transferRequest.create({
    data: {
      assetId: byName('Dell XPS 15').id,
      fromUserId: employees[2].id, // Priya holds it
      toUserId: employees[3].id, // → Sara
      requestedByUserId: employees[3].id,
      status: 'REQUESTED',
    },
  });

  // ── Bookings on the rooms (non-overlapping; one ongoing, rest upcoming) ──
  const roomA = byName('Conference Room A');
  const roomB = byName('Conference Room B');
  await prisma.booking.createMany({
    data: [
      { assetId: roomA.id, bookedByUserId: head1.id, startTime: hours(-1), endTime: hours(1), status: 'ONGOING' },
      { assetId: roomA.id, bookedByUserId: employees[0].id, startTime: days(1), endTime: new Date(days(1).getTime() + 3600e3), status: 'UPCOMING' },
      { assetId: roomB.id, bookedByUserId: head2.id, startTime: days(1), endTime: new Date(days(1).getTime() + 2 * 3600e3), status: 'UPCOMING' },
    ],
  });

  // ── One in-flight maintenance request (asset UNDER_MAINTENANCE) ──
  const brokenMonitor = byName('BenQ Designer 27"');
  await prisma.maintenanceRequest.create({
    data: {
      assetId: brokenMonitor.id,
      raisedByUserId: employees[1].id,
      description: 'Backlight flickers and occasional dead pixels',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      approvedByUserId: mgr1.id,
      technicianUserId: employees[4].id,
    },
  });
  await prisma.asset.update({ where: { id: brokenMonitor.id }, data: { status: 'UNDER_MAINTENANCE' } });

  // A pending maintenance request too (shows the approval queue; asset stays AVAILABLE).
  await prisma.maintenanceRequest.create({
    data: {
      assetId: byName('Jabra Evolve2 Headset').id,
      raisedByUserId: employees[4].id,
      description: 'Right ear cushion torn',
      priority: 'LOW',
      status: 'PENDING',
    },
  });

  // ── One mid-progress audit cycle (IN_PROGRESS) over Engineering assets ──
  const cycle = await prisma.auditCycle.create({
    data: {
      name: 'Q3 Engineering Audit',
      scopeType: 'DEPARTMENT',
      scopeValue: engineering.id,
      startDate: days(-3),
      endDate: days(11),
      status: 'IN_PROGRESS',
      createdByUserId: admin.id,
    },
  });
  await prisma.auditAssignment.createMany({
    data: [
      { auditCycleId: cycle.id, auditorUserId: head1.id },
      { auditCycleId: cycle.id, auditorUserId: employees[0].id },
    ],
  });
  const engAssets = assets.filter((a) => a.ownerDepartmentId === engineering.id);
  for (let i = 0; i < engAssets.length; i++) {
    const a = engAssets[i];
    // Mark a couple verified, one damaged, leave the rest pending (mid-progress).
    const status = i === 0 ? 'VERIFIED' : i === 1 ? 'VERIFIED' : i === 2 ? 'DAMAGED' : 'PENDING';
    await prisma.auditItem.create({
      data: {
        auditCycleId: cycle.id,
        assetId: a.id,
        status,
        auditedByUserId: status === 'PENDING' ? null : head1.id,
        auditedAt: status === 'PENDING' ? null : days(-1),
        notes: status === 'DAMAGED' ? 'Casing cracked' : null,
      },
    });
  }

  // ── A few notifications for the primary employee (bell isn't empty) ──
  await prisma.notification.createMany({
    data: [
      { userId: employees[0].id, type: 'AssetAllocated', message: 'MacBook Pro 16" was allocated to you', entityType: 'Asset', entityId: byName('MacBook Pro 16"').id },
      { userId: employees[0].id, type: 'BookingReminder', message: 'Your booking of Conference Room A starts soon', isRead: true },
    ],
  });

  const counts = {
    departments: await prisma.department.count(),
    users: await prisma.user.count(),
    categories: await prisma.assetCategory.count(),
    assets: await prisma.asset.count(),
    allocations: await prisma.allocation.count(),
    bookings: await prisma.booking.count(),
    maintenance: await prisma.maintenanceRequest.count(),
    auditItems: await prisma.auditItem.count(),
  };

  console.log('\n✅ Seed complete:', counts);
  console.log('\n  Demo logins (email / password):');
  console.log('  Admin           admin@assetflow.test      Admin@123');
  console.log('  Asset Manager   manager@assetflow.test    Manager@123   (also manager2@…)');
  console.log('  Department Head  head@assetflow.test       Head@123      (also head2@…, head3@…)');
  console.log('  Employee         employee@assetflow.test   Employee@123  (+ 7 more)');
  console.log('');
}

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(() => prisma.$disconnect());
