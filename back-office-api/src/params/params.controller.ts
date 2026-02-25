import { Controller, Get, Put, Body, Param, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { ParamsService } from './params.service';
import { ParamUpdateDto } from './dto/param.dto';
import { RolesGuard } from '../common/guards/rbac.guard';

@Controller('params')
@UseGuards(RolesGuard)
export class ParamsController {
    constructor(private readonly paramsService: ParamsService) { }

    @Get()
    @SetMetadata('permissions', ['PARAM_VIEW'])
    findAll(@Request() req) {
        const tenantId = req.user.tenantId;
        return this.paramsService.findAll(tenantId);
    }

    @Put(':id')
    @SetMetadata('permissions', ['PARAM_EDIT'])
    update(
        @Param('id') id: string,
        @Body() dto: ParamUpdateDto,
        @Request() req
    ) {
        const tenantId = req.user.tenantId;
        const userId = req.user.userId;
        return this.paramsService.update(id, tenantId, dto, userId);
    }

    @Get('audit')
    @SetMetadata('permissions', ['AUDIT_VIEW'])
    getAuditLog(@Request() req) {
        // Audit log retrieval logic
        return [];
    }
}
