import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TraceabilityService {
    constructor(private prisma: PrismaService) { }

    /**
     * Generates a deterministic SHA-256 hash of a ModelRun's inputs.
     * Includes identity, sorted parameters, and evaluation snapshot.
     */
    async calculateInputHash(modelRunId: string): Promise<string> {
        const run = await this.prisma.corpusModelRun.findUnique({
            where: { id: modelRunId },
            include: {
                evaluation: {
                    include: {
                        controlStates: true,
                        testRuns: { where: { included: true } },
                        artifacts: { where: { status: 'accepted' } }
                    }
                },
                parameterSet: {
                    include: {
                        values: true,
                        weights: true
                    }
                }
            }
        });

        if (!run) throw new Error('ModelRun not found');

        const canonicalInput = {
            identity: {
                assessmentId: run.assessmentId,
                evaluationId: run.evaluationId,
                frameworkVersionId: run.frameworkVersionId,
                parameterSetId: run.parameterSetId,
                engineVersion: run.engineVersion
            },
            parameters: {
                setHash: run.parameterSet.hash,
                values: run.parameterSet.values
                    .sort((a, b) => a.key.localeCompare(b.key))
                    .map(v => ({ k: v.key, v: v.value.toString() })),
                weights: run.parameterSet.weights
                    .sort((a, b) => a.obligationId.localeCompare(b.obligationId))
                    .map(w => ({ o: w.obligationId, w: w.weight.toString() }))
            },
            evaluationSnapshot: {
                controlStates: run.evaluation.controlStates
                    .sort((a, b) => a.controlId.localeCompare(b.controlId))
                    .map(s => ({ c: s.controlId, s: s.state })),
                testRuns: run.evaluation.testRuns
                    .sort((a, b) => a.testControlRunId.localeCompare(b.testControlRunId))
                    .map(t => ({ id: t.testControlRunId })),
                artifacts: run.evaluation.artifacts
                    .sort((a, b) => a.artifactId.localeCompare(b.artifactId))
                    .map(a => ({ id: a.artifactId, s: a.status }))
            }
        };

        return this.generateHash(canonicalInput);
    }

    /**
     * Generates a deterministic SHA-256 hash of a ModelRun's outputs.
     * Includes scores, control results, obligation results, and triggered events.
     */
    async calculateOutputHash(modelRunId: string): Promise<string> {
        const results = await this.prisma.corpusModelRun.findUnique({
            where: { id: modelRunId },
            include: {
                scores: true,
                controls: true,
                obligations: true,
                triggers: true
            }
        });

        if (!results) throw new Error('ModelRun results not found');

        const canonicalOutput = {
            scores: results.scores
                .map(s => s.scoreValue.toString())
                .sort(),
            controls: results.controls
                .sort((a, b) => a.controlId.localeCompare(b.controlId))
                .map(c => ({ id: c.controlId, s: c.score.toString() })),
            obligations: results.obligations
                .sort((a, b) => a.obligationId.localeCompare(b.obligationId))
                .map(o => ({ id: o.obligationId, s: o.score.toString() })),
            triggers: results.triggers
                .sort((a, b) => a.triggerCode.localeCompare(b.triggerCode))
                .map(t => ({ c: t.triggerCode, f: t.triggerFired, v: t.triggerValue }))
        };

        return this.generateHash(canonicalOutput);
    }

    /**
     * Helper to serialize and hash with stable key ordering.
     */
    private generateHash(data: any): string {
        const canonicalJson = JSON.stringify(data, (key, value) => {
            if (value instanceof Object && !(value instanceof Array)) {
                return Object.keys(value)
                    .sort()
                    .reduce((sorted, key) => {
                        sorted[key] = value[key];
                        return sorted;
                    }, {});
            }
            return value;
        });
        return crypto.createHash('sha256').update(canonicalJson).digest('hex');
    }
}
