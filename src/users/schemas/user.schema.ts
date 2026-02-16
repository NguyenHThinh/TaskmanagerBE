import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export type UserDocument = User & Document;

@Schema()
export class User {
    @Prop({ required: true, unique: true })
    username: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    passwordHash: string;

    @Prop()
    refreshTokenHash?: string;

    @Prop({ type: [String], enum: Role, default: [Role.MEMBER] })
    roles: Role[];
}

export const UserSchema = SchemaFactory.createForClass(User);
