import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...\n');

  // ─── Admin User ──────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@atspaces.com',
      passwordHash: adminPassword,
      name: 'System Admin',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });
  console.log('Created admin:', admin.email);

  // ─── Vendor 1: TechHub Coworking ─────────────────────────
  const vendor1Password = await bcrypt.hash('Vendor@123', 12);
  const vendor1 = await prisma.user.create({
    data: {
      email: 'vendor1@techhub.jo',
      passwordHash: vendor1Password,
      name: 'Khalid Al-Masri',
      role: 'VENDOR',
      emailVerified: new Date(),
      vendorProfile: {
        create: {
          companyName: 'TechHub Coworking',
          description:
            'Modern coworking spaces designed for tech professionals and startups across Jordan.',
          status: 'APPROVED',
          branches: {
            create: [
              {
                name: 'TechHub Amman Downtown',
                city: 'AMMAN',
                address: 'Mecca Street, Building 45, 2nd Floor',
                description:
                  'Our flagship location in the heart of Amman with city views and high-speed internet.',
                phone: '+962791000001',
                email: 'amman@techhub.jo',
                latitude: 31.9539,
                longitude: 35.9106,
                images: [
                  'https://images.unsplash.com/photo-1497366216548-37526070297c',
                  'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
                ],
              },
              {
                name: 'TechHub Abdali',
                city: 'AMMAN',
                address: 'Abdali Boulevard, Tower B, 5th Floor',
                description:
                  'Premium workspace in the Abdali district with meeting rooms and event space.',
                phone: '+962791000002',
                email: 'abdali@techhub.jo',
                latitude: 31.9566,
                longitude: 35.9144,
                images: [
                  'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
                ],
              },
              {
                name: 'TechHub Irbid',
                city: 'IRBID',
                address: 'University Street, Innovation Center',
                description:
                  'Student and freelancer friendly space near Yarmouk University.',
                phone: '+962791000003',
                email: 'irbid@techhub.jo',
                latitude: 32.5568,
                longitude: 35.8469,
                images: [],
              },
            ],
          },
        },
      },
    },
    include: {
      vendorProfile: {
        include: { branches: true },
      },
    },
  });
  console.log(
    'Created vendor 1:',
    vendor1.email,
    `(${vendor1.vendorProfile!.branches.length} branches)`,
  );

  // ─── Vendor 2: WorkNest ──────────────────────────────────
  const vendor2Password = await bcrypt.hash('Vendor@123', 12);
  const vendor2 = await prisma.user.create({
    data: {
      email: 'vendor2@worknest.jo',
      passwordHash: vendor2Password,
      name: 'Sara Haddad',
      role: 'VENDOR',
      emailVerified: new Date(),
      vendorProfile: {
        create: {
          companyName: 'WorkNest',
          description:
            'Affordable and creative coworking spaces for freelancers and small teams.',
          status: 'APPROVED',
          branches: {
            create: [
              {
                name: 'WorkNest Rainbow St',
                city: 'AMMAN',
                address: 'Rainbow Street 12, Jabal Amman',
                description:
                  'A cozy space on Rainbow Street with a café downstairs.',
                phone: '+962792000001',
                email: 'rainbow@worknest.jo',
                latitude: 31.9525,
                longitude: 35.9286,
                images: [
                  'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2',
                ],
              },
              {
                name: 'WorkNest Aqaba',
                city: 'AQABA',
                address: 'City Center Mall, 3rd Floor',
                description:
                  'Seaside city workspace with views of the Red Sea.',
                phone: '+962792000002',
                email: 'aqaba@worknest.jo',
                latitude: 29.5321,
                longitude: 35.0063,
                images: [],
              },
            ],
          },
        },
      },
    },
    include: {
      vendorProfile: {
        include: { branches: true },
      },
    },
  });
  console.log(
    'Created vendor 2:',
    vendor2.email,
    `(${vendor2.vendorProfile!.branches.length} branches)`,
  );

  // ─── Vendor 3: Pending Approval ──────────────────────────
  const vendor3Password = await bcrypt.hash('Vendor@123', 12);
  const vendor3 = await prisma.user.create({
    data: {
      email: 'vendor3@newspace.jo',
      passwordHash: vendor3Password,
      name: 'Omar Nasser',
      role: 'VENDOR',
      emailVerified: new Date(),
      vendorProfile: {
        create: {
          companyName: 'NewSpace Co',
          description: 'A new coworking concept coming to Amman.',
          status: 'PENDING_APPROVAL',
        },
      },
    },
  });
  console.log('Created vendor 3 (pending):', vendor3.email);

  // ─── Customer Users ──────────────────────────────────────
  const customer1Password = await bcrypt.hash('Customer@123', 12);
  const customer1 = await prisma.user.create({
    data: {
      email: 'ahmad@example.com',
      passwordHash: customer1Password,
      name: 'Ahmad Mustafa',
      role: 'CUSTOMER',
      emailVerified: new Date(),
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'lina@example.com',
      passwordHash: await bcrypt.hash('Customer@123', 12),
      name: 'Lina Jarrar',
      role: 'CUSTOMER',
      emailVerified: new Date(),
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      phone: '+962780000001',
      name: 'Fadi Khoury',
      role: 'CUSTOMER',
    },
  });

  console.log('Created 3 customers');

  // ─── Services & Pricing ──────────────────────────────────
  const branches = await prisma.branch.findMany();

  for (const branch of branches) {
    // Hot Desk for every branch
    const hotDesk = await prisma.service.create({
      data: {
        branchId: branch.id,
        type: 'HOT_DESK',
        name: `Hot Desk – ${branch.name}`,
        description: 'Flexible open seating with power and Wi-Fi.',
        capacity: 20,
        pricePerHour: 3.0,
        pricePerBooking: 20.0,
      },
    });

    // Private Office for every branch
    const privateOffice = await prisma.service.create({
      data: {
        branchId: branch.id,
        type: 'PRIVATE_OFFICE',
        name: `Private Office – ${branch.name}`,
        description: 'Lockable private office for teams of 2-6.',
        capacity: 5,
        pricePerBooking: 40.0,
      },
    });

    // Meeting Room for every branch
    const meetingRoom = await prisma.service.create({
      data: {
        branchId: branch.id,
        type: 'MEETING_ROOM',
        name: `Meeting Room – ${branch.name}`,
        description:
          'Equipped meeting room with projector and whiteboard, up to 10 people.',
        capacity: 10,
        pricePerHour: 15.0,
        pricePerPerson: 8.0,
        pricePerBooking: 100.0,
      },
    });

    console.log(`  Created 3 services for branch "${branch.name}"`);
  }

  // ─── Sample Bookings ─────────────────────────────────────
  const ammanBranch = vendor1.vendorProfile!.branches[0]!;
  const ammanServices = await prisma.service.findMany({
    where: { branchId: ammanBranch.id },
  });
  const hotDeskService = ammanServices.find((s) => s.type === 'HOT_DESK')!;
  const meetingService = ammanServices.find((s) => s.type === 'MEETING_ROOM')!;

  // Booking 1 — confirmed with payment
  const booking1 = await prisma.booking.create({
    data: {
      userId: customer1.id,
      branchId: ammanBranch.id,
      serviceId: hotDeskService.id,
      status: 'CONFIRMED',
      startTime: new Date('2026-03-01T09:00:00Z'),
      endTime: new Date('2026-03-01T17:00:00Z'),
      numberOfPeople: 1,
      totalPrice: 15.0,
      payment: {
        create: {
          method: 'VISA',
          status: 'COMPLETED',
          amount: 15.0,
          paidAt: new Date(),
        },
      },
    },
  });

  // Booking 2 — pending
  const booking2 = await prisma.booking.create({
    data: {
      userId: customer2.id,
      branchId: ammanBranch.id,
      serviceId: meetingService.id,
      status: 'PENDING',
      startTime: new Date('2026-03-05T10:00:00Z'),
      endTime: new Date('2026-03-05T12:00:00Z'),
      numberOfPeople: 6,
      totalPrice: 30.0,
      notes: 'Team planning session — need whiteboard markers',
    },
  });

  // Booking 3 — completed
  const booking3 = await prisma.booking.create({
    data: {
      userId: customer1.id,
      branchId: ammanBranch.id,
      serviceId: hotDeskService.id,
      status: 'COMPLETED',
      startTime: new Date('2026-02-20T08:00:00Z'),
      endTime: new Date('2026-02-20T18:00:00Z'),
      numberOfPeople: 1,
      totalPrice: 15.0,
      payment: {
        create: {
          method: 'CASH',
          status: 'COMPLETED',
          amount: 15.0,
          paidAt: new Date('2026-02-20T08:00:00Z'),
        },
      },
    },
  });

  console.log('Created 3 sample bookings');

  // ─── Approval Requests ───────────────────────────────────
  await prisma.approvalRequest.create({
    data: {
      branchId: ammanBranch.id,
      type: 'CAPACITY_CHANGE',
      status: 'PENDING',
      description: 'Increase hot desk capacity from 20 to 30 seats.',
      details: {
        serviceType: 'HOT_DESK',
        currentCapacity: 20,
        requestedCapacity: 30,
      },
    },
  });
  console.log('Created 1 approval request');

  // ─── Notifications ───────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: customer1.id,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
        message:
          'Your hot desk booking at TechHub Amman Downtown on Mar 1 is confirmed.',
        data: { bookingId: booking1.id },
      },
      {
        userId: vendor1.id,
        type: 'APPROVAL_REQUEST',
        title: 'Capacity Change Submitted',
        message:
          'Your request to increase hot desk capacity has been submitted for admin review.',
      },
      {
        userId: admin.id,
        type: 'APPROVAL_REQUEST',
        title: 'New Vendor Pending',
        message: 'NewSpace Co has applied for vendor approval.',
      },
    ],
  });
  console.log('Created 3 notifications');

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
