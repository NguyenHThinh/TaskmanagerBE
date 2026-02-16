import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserDocument, User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async create(createUserDto: { username: string; email: string; password: string; roles?: Role[] }): Promise<UserDocument> {
        const { username, email, password, roles } = createUserDto;
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        const createdUser = new this.userModel({
            username,
            email,
            passwordHash,
            roles: roles || [Role.MEMBER],
        });
        return createdUser.save();
    }

    async findOne(username: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ username }).exec();
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findById(userId: string): Promise<UserDocument | null> {
        if (!Types.ObjectId.isValid(userId)) {
            return null;
        }

        return this.userModel.findById(userId).exec();
    }

    async updateRefreshTokenHash(userId: string, refreshTokenHash: string | null): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash }).exec();
    }
}
