import { Controller, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';

@ApiTags('Services')
@Controller('services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new service for a branch (Vendor only)' })
    async createService(@Req() req: any, @Body() dto: CreateServiceDto) {
        return this.servicesService.createService(req.user.id, dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a service (Vendor only)' })
    async updateService(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
        return this.servicesService.updateService(req.user.id, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a service (Vendor only)' })
    async deleteService(@Req() req: any, @Param('id') id: string) {
        return this.servicesService.deleteService(req.user.id, id);
    }
}
