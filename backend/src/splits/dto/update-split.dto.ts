import { PartialType } from '@nestjs/swagger';
import { CreateSplitDto } from './create-split.dto';

export class UpdateSplitDto extends PartialType(CreateSplitDto) {}
