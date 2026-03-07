import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto, UpdateQuotationDto } from './dto';

@ApiTags('Quotations')
@Controller('quotations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuotationsController {
  constructor(private quotationsService: QuotationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quotation' })
  async createQuotation(@Req() req: any, @Body() dto: CreateQuotationDto) {
    return this.quotationsService.createQuotation(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List quotations with pagination and filters' })
  async getQuotations(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.quotationsService.getQuotations(req.user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      search,
      branchId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a quotation by ID' })
  async getQuotation(@Req() req: any, @Param('id') id: string) {
    return this.quotationsService.getQuotation(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a quotation' })
  async updateQuotation(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationDto,
  ) {
    return this.quotationsService.updateQuotation(id, dto);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generate PDF for a quotation' })
  async generatePdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.quotationsService.generatePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="quotation-${id.slice(0, 8)}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Mark quotation as SENT' })
  async sendQuotation(@Param('id') id: string) {
    return this.quotationsService.sendQuotation(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a sent quotation' })
  async acceptQuotation(@Param('id') id: string) {
    return this.quotationsService.acceptQuotation(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a sent quotation' })
  async rejectQuotation(@Param('id') id: string) {
    return this.quotationsService.rejectQuotation(id);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert an accepted quotation to a booking' })
  async convertToBooking(@Req() req: any, @Param('id') id: string) {
    return this.quotationsService.convertToBooking(req.user.id, id);
  }
}
