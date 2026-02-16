import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProjectsService } from '../projects/projects.service';
import { ProjectMemberRole } from '../projects/schemas/project.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskDocument } from './schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    private readonly projectsService: ProjectsService,
  ) {}

  async listByProject(projectId: string, userId: string, query: TaskQueryDto) {
    await this.projectsService.ensureProjectMember(projectId, userId);

    const filter: Record<string, unknown> = {
      projectId: new Types.ObjectId(projectId),
    };

    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.assigneeId) filter.assigneeId = new Types.ObjectId(query.assigneeId);

    return this.taskModel.find(filter).sort({ updatedAt: -1 }).exec();
  }

  async create(projectId: string, userId: string, dto: CreateTaskDto) {
    const { role } = await this.projectsService.ensureProjectMember(projectId, userId);
    if (role === ProjectMemberRole.VIEWER) {
      throw new ForbiddenException('Viewer không thể tạo task');
    }

    const task = await this.taskModel.create({
      projectId: new Types.ObjectId(projectId),
      title: dto.title,
      description: dto.description ?? '',
      status: dto.status,
      priority: dto.priority,
      assigneeId: dto.assigneeId ? new Types.ObjectId(dto.assigneeId) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      createdBy: new Types.ObjectId(userId),
    });

    return task;
  }

  async getOne(taskId: string, userId: string) {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) throw new NotFoundException('Task not found');

    await this.projectsService.ensureProjectMember(String(task.projectId), userId);
    return task;
  }

  async update(taskId: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.getOne(taskId, userId);
    const { role } = await this.projectsService.ensureProjectMember(
      String(task.projectId),
      userId,
    );

    if (role === ProjectMemberRole.VIEWER) {
      throw new ForbiddenException('Viewer không thể cập nhật task');
    }

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.assigneeId !== undefined) {
      task.assigneeId = dto.assigneeId ? new Types.ObjectId(dto.assigneeId) : undefined;
    }
    if (dto.dueDate !== undefined) {
      task.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    }

    await task.save();
    return task;
  }

  async remove(taskId: string, userId: string) {
    const task = await this.getOne(taskId, userId);
    const { role } = await this.projectsService.ensureProjectMember(
      String(task.projectId),
      userId,
    );

    if (![ProjectMemberRole.OWNER, ProjectMemberRole.ADMIN].includes(role)) {
      throw new ForbiddenException('Bạn không có quyền xóa task');
    }

    await this.taskModel.deleteOne({ _id: task._id }).exec();
    return { deleted: true };
  }
}
