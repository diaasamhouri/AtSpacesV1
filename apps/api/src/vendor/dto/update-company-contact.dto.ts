import { PartialType } from '@nestjs/swagger';
import { CreateCompanyContactDto } from '../../auth/dto/vendor-sub.dto';

export class UpdateCompanyContactDto extends PartialType(CreateCompanyContactDto) {}
