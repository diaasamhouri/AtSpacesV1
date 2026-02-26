import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import {
  ListBranchesQueryDto,
  BranchListResponseDto,
  BranchDetailResponseDto,
} from './dto';

@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'List active branches with filters (public)' })
  @ApiResponse({ status: 200, type: BranchListResponseDto })
  async listBranches(@Query() query: ListBranchesQueryDto) {
    return this.branchesService.listBranches(query);
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
}
