import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ProjectMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

@Schema({ _id: false })
export class ProjectMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ProjectMemberRole, default: ProjectMemberRole.MEMBER })
  role: ProjectMemberRole;
}

export const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, uppercase: true })
  key: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: [ProjectMemberSchema], default: [] })
  members: ProjectMember[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
ProjectSchema.index({ key: 1 }, { unique: true });
ProjectSchema.index({ ownerId: 1 });
ProjectSchema.index({ 'members.userId': 1 });
