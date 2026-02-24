/**
 * CRE Deterministic Score Engine
 * Implements S2RQF (Structural Regulatory Risk Quantification Framework)
 */

export interface ObligationData {
    id: string;
    weight: number;
    effectiveness: number; // 0-1
}

export interface DomainVulnerability {
    domainId: string;
    vulnerability: number; // 0-1 (E_d / E_base_d)
}

export interface EngineConfig {
    alpha: number; // Concentration factor
    beta: number;  // Interdependence factor
    gamma: number; // Non-linear mapping sensitivity
}

export class ScoreEngine {
    private config: EngineConfig;

    constructor(config: EngineConfig = { alpha: 0.5, beta: 0.3, gamma: 2.0 }) {
        this.config = config;
    }

    /**
     * Calculate Base Exposure for each obligation and total
     */
    calculateBaseExposure(obligations: ObligationData[]) {
        const components = obligations.map(ob => ({
            id: ob.id,
            exposure: ob.weight * (1 - ob.effectiveness)
        }));

        const totalEbase = components.reduce((sum, item) => sum + item.exposure, 0);
        return { components, total: totalEbase };
    }

    /**
     * Calculate Concentration using a Herfindahl-style index
     */
    calculateConcentration(domainExposures: number[], totalEbase: number) {
        if (totalEbase === 0) return 0;

        const hhi = domainExposures.reduce((sum, ed) => sum + Math.pow(ed / totalEbase, 2), 0);
        return totalEbase * (1 + this.config.alpha * hhi);
    }

    /**
     * Calculate Systemic Exposure including Interdependence
     */
    calculateSystemicExposure(eConc: number, domainVulnerabilities: DomainVulnerability[], dependencyMatrix: number[][]) {
        // Simplified interdependence: sum of V_d * V_k * M_dk
        let interdependenceSum = 0;
        for (let i = 0; i < domainVulnerabilities.length; i++) {
            for (let j = 0; j < domainVulnerabilities.length; j++) {
                if (i !== j) {
                    interdependenceSum += domainVulnerabilities[i].vulnerability *
                        domainVulnerabilities[j].vulnerability *
                        (dependencyMatrix[i]?.[j] || 0);
                }
            }
        }

        return eConc + (this.config.beta * interdependenceSum);
    }

    /**
     * Apply Triggers (Gatillos)
     */
    applyTriggers(eSys: number, triggerThresholds: number[]) {
        return Math.max(eSys, ...triggerThresholds);
    }

    /**
     * Map Exposure to 0-100 Score
     */
    mapToScore(eFinal: number) {
        // Score = 100 * (1 - e^(-gamma * eFinal))
        // We want higher exposure to result in LOWER score (0-100, where 100 is perfect)
        // Actually, the requirement says "Score 0-100 follows an exponential growth curve to model regulatory tipping points"
        // Usually, Score 100 = High Risk in some models, but "Defendibilidad" usually means 100 = Good.
        // Based on "Score de Grupo" (74.2), higher is better.
        // So: Score = 100 * e^(-gamma * eFinal)
        return 100 * Math.exp(-this.config.gamma * eFinal);
    }

    /**
     * Full Run
     */
    run(obligations: ObligationData[], domainExposures: number[], triggers: number[]) {
        const { total: eBase } = this.calculateBaseExposure(obligations);
        const eConc = this.calculateConcentration(domainExposures, eBase);
        // For MVP, interdependence is 0 or simplified
        const eSys = eConc;
        const eFinal = this.applyTriggers(eSys, triggers);
        const score = this.mapToScore(eFinal);

        return {
            eBase,
            eConc,
            eSys,
            eFinal,
            score: Math.round(score * 10) / 10
        };
    }
}
