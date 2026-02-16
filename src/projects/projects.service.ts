import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  Project,
  ProjectDocument,
  ProjectMemberRole,
} from './schemas/project.schema';
import { AddProjectMemberDto } from './dto/add-project-member.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async create(ownerUserId: string, dto: CreateProjectDto) {
    const ownerId = new Types.ObjectId(ownerUserId);

    const created = await this.projectModel.create({
      name: dto.name,
      key: dto.key,
      description: dto.description ?? '',
      ownerId,
      members: [{ userId: ownerId, role: ProjectMemberRole.OWNER }],
    });

    return created;
  }

  async listForUser(userId: string) {
    const objectId = new Types.ObjectId(userId);
    return this.projectModel
      .find({
        $or: [{ ownerId: objectId }, { 'members.userId': objectId }],
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async getProjectOrThrow(projectId: string) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException('Project not found');
    }

    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  getUserProjectRole(project: ProjectDocument, userId: string): ProjectMemberRole | null {
    const member = project.members.find((m) => String(m.userId) === userId);
    return member?.role ?? null;
  }

  async ensureProjectMember(projectId: string, userId: string) {
    const project = await this.getProjectOrThrow(projectId);
    const role = this.getUserProjectRole(project, userId);

    if (!role) {
      throw new ForbiddenException('Bạn không thuộc project này');
    }

    return { project, role };
  }

  async ensureProjectAdmin(projectId: string, userId: string) {
    const { project, role } = await this.ensureProjectMember(projectId, userId);
    if (![ProjectMemberRole.OWNER, ProjectMemberRole.ADMIN].includes(role)) {
      throw new ForbiddenException('Bạn không có quyền quản trị project');
    }
    return project;
  }

  async addMember(projectId: string, requesterUserId: string, dto: AddProjectMemberDto) {
    const project = await this.ensureProjectAdmin(projectId, requesterUserId);

    const targetId = new Types.ObjectId(dto.userId);
    const existed = project.members.some((member) => String(member.userId) === dto.userId);
    if (existed) {
      project.members = project.members.map((member) =>
        String(member.userId) === dto.userId ? { ...member, role: dto.role } : member,
      );
    } else {
      project.members.push({ userId: targetId, role: dto.role });
    }

    await project.save();
    return project;
  }
}
