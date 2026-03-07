import { Controller, Get, Param, Query, Post, Patch, Delete, Body, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ListBranchesQueryDto,
  BranchListResponseDto,
  BranchDetailResponseDto,
  CreateBranchDto,
  UpdateBranchDto,
} from './dto';

@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(private branchesService: BranchesService) { }

  @Get()
  @ApiOperation({ summary: 'List active branches with filters (public)' })
  @ApiResponse({ status: 200, type: BranchListResponseDto })
  async listBranches(@Query() query: ListBranchesQueryDto) {
    return this.branchesService.listBranches(query);
  }

  // ==================== VENDOR ENDPOINTS ====================

  @Get('vendor')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all branches owned by the vendor' })
  async getVendorBranches(@Req() req: any, @Query('unitType') unitType?: string) {
    return this.branchesService.getVendorBranches(req.user.id, { unitType });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get branch detail with services and pricing (public)',
  })

  @ApiResponse({ status: 200, type: BranchDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async getBranch(@Param('id') id: string) {
    return this.branchesService.getBranchById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new branch (Vendor only)' })
  async createBranch(@Req() req: any, @Body() dto: CreateBranchDto) {
    return this.branchesService.createBranch(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing branch (Vendor only)' })
  async updateBranch(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.updateBranch(req.user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a branch (Vendor only)' })
  async deleteBranch(@Req() req: any, @Param('id') id: string) {
    return this.branchesService.deleteBranch(req.user.id, id);
  }
}
