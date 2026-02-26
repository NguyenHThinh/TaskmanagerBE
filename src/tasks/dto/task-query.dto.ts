import { IsEnum, IsMongoId, IsOptional, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskPriority, TaskStatus } from '../schemas/task.schema';

const MAX_LIMIT = 100;

export class TaskQueryDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsMongoId()
  assigneeId?: string;

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
