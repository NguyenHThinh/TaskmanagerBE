import { IsEnum, IsMongoId } from 'class-validator';
import { ProjectMemberRole } from '../schemas/project.schema';

export class AddProjectMemberDto {
  @IsMongoId()
  userId: string;

  @IsEnum(ProjectMemberRole)
  role: ProjectMemberRole;
}
