import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentQueryDto, CreateCommentDto } from './dto/comment.dto';
import { CommentsService } from './comments.service';

@Controller('tasks/:taskId/comments')
@UseGuards(AuthGuard('jwt'))
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  list(
    @Param('taskId') taskId: string,
    @Req() req: { user: { userId: string } },
    @Query() query: CommentQueryDto,
  ) {
    return this.commentsService.listByTask(
      taskId,
      req.user.userId,
      query.limit,
      query.skip,
    );
  }

  @Post()
  create(
    @Param('taskId') taskId: string,
    @Req() req: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(taskId, req.user.userId, dto);
  }
}
