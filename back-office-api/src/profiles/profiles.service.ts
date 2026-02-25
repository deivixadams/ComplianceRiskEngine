import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/profile.dto';
import { HashUtils } from '../common/validation/hash.utils';

@Injectable()
export class ProfilesService {
    constructor(private prisma: PrismaService) { }

    async create(tenantId: string, dto: CreateProfileDto, userId: string) {
        return this.prisma.corpusParamProfile.create({
            data: {
                tenantId,
                profileName: dto.profileName,
                jurisdictionId: dto.jurisdictionId,
                status: 'draft',
                values: {
                    create: dto.parameterValues.map(v => ({
                        paramId: v.paramId,
                        value: v.value,
                    })),
                },
            },
            include: { values: true },
        });
    }

    async simulateImpact(profileId: string, tenantId: string) {
        const profile = await this.prisma.corpusParamProfile.findUnique({
            where: { id: profileId },
            include: { values: { include: { param: true } } },
        });

        if (!profile || profile.tenantId !== tenantId) {
            throw new NotFoundException('Profile not found');
        }

        // Logic: 
        // 1. Get the latest ModelRun for this context
        // 2. Recalculate Exposure Score using profile labels
        // 3. Return difference (Mocked for this pseudocode as it depends on the engine logic)

        return {
            previousScore: 84.52,
            simulatedScore: 82.15,
            impact: -2.37,
            drivers: [
                { label: 'Cambio en ALPHA_CONCENTRATION', delta: -1.5 },
                { label: 'Ajuste en MATERIAL_SEVERITY', delta: -0.87 }
            ]
        };
    }

    async activate(profileId: string, tenantId: string, userId: string) {
        const profile = await this.prisma.corpusParamProfile.findUnique({
            where: { id: profileId },
            include: { values: { include: { param: true } } },
        });

        if (!profile || profile.status !== 'approved') {
            throw new BadRequestException('Only approved profiles can be activated');
        }

        // Hashing
        const hash = HashUtils.generateProfileHash(profile.values.map(v => ({
            paramCode: v.param.paramCode,
            value: v.value
        })));

        return this.prisma.$transaction(async (tx) => {
            // Inactivate previous active profile
            await tx.corpusParamProfile.updateMany({
                where: { tenantId, isActive: true },
                data: { isActive: false },
            });

            // Activate current
            return tx.corpusParamProfile.update({
                where: { id: profileId },
                data: {
                    isActive: true,
                    activatedAt: new Date(),
                    hashSnapshot: hash,
                    status: 'active'
                },
            });
        });
    }
}
