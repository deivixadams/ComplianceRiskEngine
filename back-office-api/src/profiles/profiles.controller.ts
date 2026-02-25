import { Controller, Post, Body, Param, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/profile.dto';
import { RolesGuard } from '../common/guards/rbac.guard';

@Controller('profiles')
@UseGuards(RolesGuard)
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    @Post()
    @SetMetadata('permissions', ['PROFILE_CREATE'])
    create(@Body() dto: CreateProfileDto, @Request() req) {
        const tenantId = req.user.tenantId;
        const userId = req.user.userId;
        return this.profilesService.create(tenantId, dto, userId);
    }

    @Post(':id/simulate')
    @SetMetadata('permissions', ['PROFILE_SIMULATE'])
    simulateImpact(@Param('id') id: string, @Request() req) {
        const tenantId = req.user.tenantId;
        return this.profilesService.simulateImpact(id, tenantId);
    }

    @Post(':id/approve')
    @SetMetadata('permissions', ['PARAM_APPROVE'])
    approve(@Param('id') id: string, @Request() req) {
        // Logic to mark profile as 'approved'
        return { id, status: 'approved' };
    }

    @Post(':id/activate')
    @SetMetadata('permissions', ['PROFILE_ACTIVATE'])
    activate(@Param('id') id: string, @Request() req) {
        const tenantId = req.user.tenantId;
        const userId = req.user.userId;
        return this.profilesService.activate(id, tenantId, userId);
    }
}
