import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
    constructor(private readonly contactService: ContactService) {}

    @Post()
    @ApiOperation({ summary: 'Submit a contact message (public)' })
    async submitContactMessage(@Body() dto: CreateContactMessageDto) {
        return this.contactService.submitMessage(dto);
    }
}
