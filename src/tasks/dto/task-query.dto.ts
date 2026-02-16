import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { TaskPriority, TaskStatus } from '../schemas/task.schema';

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
}
