import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, ToggleFavoriteDto } from './dto';

@Injectable()
export class ReviewsService {
    constructor(private prisma: PrismaService) { }

    // ==================== REVIEWS ====================

    async createReview(userId: string, dto: CreateReviewDto) {
        // Check if user already reviewed this branch
        const existing = await this.prisma.review.findUnique({
            where: { userId_branchId: { userId, branchId: dto.branchId } },
        });
        if (existing) throw new ConflictException('You have already reviewed this branch');

        // If bookingId provided, verify the booking belongs to the user
        if (dto.bookingId) {
            const booking = await this.prisma.booking.findFirst({
                where: { id: dto.bookingId, userId, branchId: dto.branchId },
            });
            if (!booking) throw new ForbiddenException('Booking not found or doesn\'t belong to you');
        }

        const review = await this.prisma.review.create({
            data: {
                userId,
                branchId: dto.branchId,
                bookingId: dto.bookingId,
                rating: dto.rating,
                comment: dto.comment,
            },
            include: {
                user: { select: { id: true, name: true, image: true } },
            },
        });

        // Notify the vendor about the new review
        const branch = await this.prisma.branch.findUnique({
            where: { id: dto.branchId },
            select: { name: true, vendor: { select: { userId: true } } },
        });
        if (branch) {
            await this.prisma.notification.create({
                data: {
                    userId: branch.vendor.userId,
                    type: 'GENERAL',
                    title: 'New Review',
                    message: `Your branch "${branch.name}" received a ${dto.rating}-star review.`,
                },
            });
        }

        return review;
    }

    async getBranchReviews(branchId: string) {
        const [reviews, stats] = await Promise.all([
            this.prisma.review.findMany({
                where: { branchId },
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, image: true } },
                },
            }),
            this.prisma.review.aggregate({
                where: { branchId },
                _avg: { rating: true },
                _count: { rating: true },
            }),
        ]);

        return {
            reviews,
            averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0,
            totalReviews: stats._count.rating,
        };
    }

    async deleteReview(userId: string, reviewId: string) {
        const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) throw new NotFoundException('Review not found');
        if (review.userId !== userId) throw new ForbiddenException('Not your review');
        await this.prisma.review.delete({ where: { id: reviewId } });
        return { message: 'Review deleted' };
    }

    // ==================== FAVORITES ====================

    async toggleFavorite(userId: string, dto: ToggleFavoriteDto) {
        const existing = await this.prisma.favorite.findUnique({
            where: { userId_branchId: { userId, branchId: dto.branchId } },
        });

        if (existing) {
            await this.prisma.favorite.delete({ where: { id: existing.id } });
            return { favorited: false };
        }

        await this.prisma.favorite.create({
            data: { userId, branchId: dto.branchId },
        });
        return { favorited: true };
    }

    async getUserFavorites(userId: string) {
        return this.prisma.favorite.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        address: true,
                        images: true,
                        amenities: true,
                        vendor: { select: { companyName: true } },
                        services: {
                            where: { isActive: true },
                            select: {
                                type: true,
                                pricing: {
                                    where: { isActive: true },
                                    orderBy: { price: 'asc' },
                                    take: 1,
                                    select: { price: true, currency: true, interval: true },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    async checkFavorite(userId: string, branchId: string) {
        const fav = await this.prisma.favorite.findUnique({
            where: { userId_branchId: { userId, branchId } },
        });
        return { favorited: !!fav };
    }
}
