import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Database...');

    // Create Vendor
    const vendorUser = await prisma.user.create({
        data: {
            email: 'vendor1@test.com',
            role: 'VENDOR',
            vendorProfile: {
                create: {
                    companyName: 'TechHub Coworking',
                    status: 'APPROVED',
                    branches: {
                        create: [
                            { name: 'TechHub Amman Main', city: 'Amman', address: 'Mecca St.' },
                            { name: 'TechHub Irbid', city: 'Irbid', address: 'University St.' },
                        ],
                    },
                },
            },
        },
    });

    console.log('Created Vendor user and branches:', vendorUser.id);

    // Create Customer
    const customerUser = await prisma.user.create({
        data: {
            email: 'customer1@test.com',
            role: 'CUSTOMER',
        },
    });

    console.log('Created Customer user:', customerUser.id);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
