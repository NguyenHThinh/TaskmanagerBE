import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    getProfile(@Request() req: any) {
        return req.user;
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getMe(@Request() req: any) {
        return req.user;
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.PM)
    @Get('pm-only')
    getPmContent() {
        return { message: 'This content is for PMs only' };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.ADMIN)
    @Get('admin-only')
    getAdminContent() {
        return { message: 'This content is for Admins only' };
    }
}
