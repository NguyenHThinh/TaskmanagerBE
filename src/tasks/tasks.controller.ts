import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('projects/:id/tasks')
  listByProject(@Param('id') projectId: string, @Req() req: any, @Query() query: TaskQueryDto) {
    return this.tasksService.listByProject(projectId, req.user.userId, query);
  }

  @Post('projects/:id/tasks')
  create(@Param('id') projectId: string, @Req() req: any, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(projectId, req.user.userId, dto);
  }

  @Patch('tasks/:id')
  update(@Param('id') taskId: string, @Req() req: any, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(taskId, req.user.userId, dto);
  }

  @Delete('tasks/:id')
  remove(@Param('id') taskId: string, @Req() req: any) {
    return this.tasksService.remove(taskId, req.user.userId);
  }
}
