import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskCommentDocument = TaskComment & Document;

@Schema({ timestamps: true })
export class TaskComment {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 4000 })
  content: string;
}

export const TaskCommentSchema = SchemaFactory.createForClass(TaskComment);
TaskCommentSchema.index({ taskId: 1, createdAt: 1 });
