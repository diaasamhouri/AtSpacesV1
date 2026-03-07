import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
  async create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.createInvoice(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List invoices with pagination and filters' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.invoicesService.getInvoices({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      search,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get financial statistics' })
  async getFinancialStats() {
    return this.invoicesService.getFinancialStats();
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generate PDF for an invoice' })
  async generatePdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.invoicesService.generatePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id.slice(0, 8)}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  async findOne(@Param('id') id: string) {
    return this.invoicesService.getInvoice(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an invoice' })
  async update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.updateInvoice(id, dto);
  }
}
