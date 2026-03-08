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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  async create(@Req() req: any, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.createInvoice(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List invoices with pagination and filters' })
  async findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.invoicesService.getInvoices(req.user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      search,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get financial statistics' })
  async getFinancialStats(@Req() req: any) {
    return this.invoicesService.getFinancialStats(req.user.id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generate PDF for an invoice' })
  async generatePdf(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const buffer = await this.invoicesService.generatePdf(req.user.id, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id.slice(0, 8)}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.invoicesService.getInvoice(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an invoice' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.updateInvoice(req.user.id, id, dto);
  }
}
