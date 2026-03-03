import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Injectable()
export class ContactService {
    constructor(private prisma: PrismaService) {}

    async submitMessage(dto: CreateContactMessageDto) {
        // Find all admin users
        const admins = await this.prisma.user.findMany({
            where: { role: 'ADMIN', isActive: true },
            select: { id: true },
        });

        if (admins.length > 0) {
            await this.prisma.notification.createMany({
                data: admins.map((a) => ({
                    userId: a.id,
                    type: 'GENERAL' as const,
                    title: `Contact: ${dto.subject}`,
                    message: `From: ${dto.name} (${dto.email})\n\n${dto.message}`,
                })),
            });
        }

        return { message: 'Your message has been sent successfully.' };
    }
}
