import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Assuming PrismaService is setup
import { ParamUpdateDto } from './dto/param.dto';

@Injectable()
export class ParamsService {
    constructor(private prisma: PrismaService) { }

    async findAll(tenantId: string) {
        return this.prisma.corpusParam.findMany({
            where: { tenantId, isActive: true },
            orderBy: { paramCode: 'asc' },
        });
    }

    async update(id: string, tenantId: string, dto: ParamUpdateDto, userId: string) {
        const param = await this.prisma.corpusParam.findUnique({ where: { id } });

        if (!param || param.tenantId !== tenantId) {
            throw new NotFoundException('Parameter not found');
        }

        if (param.isLocked) {
            throw new BadRequestException('Parameter is locked and cannot be edited');
        }

        // Guardrails
        if (dto.configurableValue < param.minAllowedValue.toNumber() ||
            dto.configurableValue > param.maxAllowedValue.toNumber()) {
            throw new BadRequestException(`Value out of range [${param.minAllowedValue}, ${param.maxAllowedValue}]`);
        }

        return this.prisma.$transaction(async (tx) => {
            // Create change log
            await tx.corpusParamChangeLog.create({
                data: {
                    paramId: id,
                    oldValue: param.configurableValue,
                    newValue: dto.configurableValue,
                    changedBy: userId,
                    changeReason: dto.changeReason,
                    changeType: 'MANUAL_UPDATE',
                },
            });

            // Update parameter
            return tx.corpusParam.update({
                where: { id },
                data: {
                    configurableValue: dto.configurableValue,
                    updatedBy: userId,
                    updatedAt: new Date(),
                    versionNumber: { increment: 1 },
                },
            });
        });
    }
}
