import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto, ToggleFavoriteDto } from './dto';

@ApiTags('Reviews & Favorites')
@Controller()
export class ReviewsController {
    constructor(private reviewsService: ReviewsService) { }

    // ==================== REVIEWS ====================

    @Get('reviews/branch/:branchId')
    @ApiOperation({ summary: 'Get reviews for a branch (public)' })
    async getBranchReviews(@Param('branchId') branchId: string) {
        return this.reviewsService.getBranchReviews(branchId);
    }

    @Post('reviews')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a review' })
    async createReview(@Req() req: any, @Body() dto: CreateReviewDto) {
        return this.reviewsService.createReview(req.user.id, dto);
    }

    @Delete('reviews/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete your review' })
    async deleteReview(@Req() req: any, @Param('id') id: string) {
        return this.reviewsService.deleteReview(req.user.id, id);
    }

    // ==================== FAVORITES ====================

    @Get('favorites')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user\'s favorites' })
    async getFavorites(@Req() req: any) {
        return this.reviewsService.getUserFavorites(req.user.id);
    }

    @Get('favorites/check/:branchId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check if branch is favorited' })
    async checkFavorite(@Req() req: any, @Param('branchId') branchId: string) {
        return this.reviewsService.checkFavorite(req.user.id, branchId);
    }

    @Post('favorites/toggle')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Toggle favorite on a branch' })
    async toggleFavorite(@Req() req: any, @Body() dto: ToggleFavoriteDto) {
        return this.reviewsService.toggleFavorite(req.user.id, dto);
    }
}
