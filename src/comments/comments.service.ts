import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProjectsService } from '../projects/projects.service';
import { ProjectMemberRole } from '../projects/schemas/project.schema';
import { TasksService } from '../tasks/tasks.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { TaskComment, TaskCommentDocument } from './schemas/task-comment.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(TaskComment.name)
    private readonly commentModel: Model<TaskCommentDocument>,
    private readonly tasksService: TasksService,
    private readonly projectsService: ProjectsService,
  ) {}

  async listByTask(taskId: string, userId: string) {
    const task = await this.tasksService.getOne(taskId, userId);

    return this.commentModel
      .find({ taskId: task._id })
      .sort({ createdAt: 1 })
      .exec();
  }

  async create(taskId: string, userId: string, dto: CreateCommentDto) {
    const task = await this.tasksService.getOne(taskId, userId);
    const { role } = await this.projectsService.ensureProjectMember(
      String(task.projectId),
      userId,
    );

    if (role === ProjectMemberRole.VIEWER) {
      throw new ForbiddenException('Viewer không thể comment');
    }

    return this.commentModel.create({
      taskId: task._id,
      projectId: task.projectId,
      authorId: new Types.ObjectId(userId),
      content: dto.content,
    });
  }
}
