import { PartialType } from '@nestjs/swagger';
import { CreateBankingInfoDto } from '../../auth/dto/vendor-sub.dto';

export class UpdateBankingInfoDto extends PartialType(CreateBankingInfoDto) {}
