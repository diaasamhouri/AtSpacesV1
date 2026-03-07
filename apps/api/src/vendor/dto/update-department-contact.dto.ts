import { PartialType } from '@nestjs/swagger';
import { CreateDepartmentContactDto } from '../../auth/dto/vendor-sub.dto';

export class UpdateDepartmentContactDto extends PartialType(CreateDepartmentContactDto) {}
