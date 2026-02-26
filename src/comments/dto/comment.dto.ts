import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsOptional, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

const MAX_LIMIT = 200;

export class CommentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}


export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;
}
