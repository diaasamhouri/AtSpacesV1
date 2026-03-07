import { PartialType } from '@nestjs/swagger';
import { CreateAuthorizedSignatoryDto } from '../../auth/dto/vendor-sub.dto';

export class UpdateSignatoryDto extends PartialType(CreateAuthorizedSignatoryDto) {}
