import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { TaskComment, TaskCommentSchema } from './schemas/task-comment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TaskComment.name, schema: TaskCommentSchema }]),
    TasksModule,
    ProjectsModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
