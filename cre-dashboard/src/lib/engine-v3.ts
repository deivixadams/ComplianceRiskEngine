import crypto from 'crypto';

/**
 * ScoreV3 Deterministic Engine
 * Specialized in structural exposure assessment.
 */

// --- 1. Control Level Calculations ---

export interface ControlMetrics {
    design: number;          // D: [0,1]
    formalization: number;   // F: [0,1]
    operation: number;       // O: [0,1] (derived from test runs)
    coverage: number;        // V: [0,1]
    recency: number;         // R: [0,1] (derived from test dates)
    evidenceValidated: boolean;
    applicable: boolean;
}

/**
 * Computes C = D^0.25 * F^0.15 * O^0.30 * V^0.20 * R^0.10
 */
export function computeControlEffectiveness(m: ControlMetrics): number | null {
    if (!m.applicable) return null;
    if (!m.evidenceValidated) return 0;

    const C = Math.pow(m.design, 0.25) *
        Math.pow(m.formalization, 0.15) *
        Math.pow(m.operation, 0.30) *
        Math.pow(m.coverage, 0.20) *
        Math.pow(m.recency, 0.10);

    return Math.min(1, Math.max(0, C));
}

export type TestOutcome = 'pass' | 'minor' | 'significant' | 'critical';

const OUTCOME_MAP: Record<TestOutcome, number> = {
    pass: 1.0,
    minor: 0.7,
    significant: 0.4,
    critical: 0.0
};

/**
 * Derives Operation (O) from included test runs (worst-case strategy)
 */
export function deriveOperationFromRuns(outcomes: TestOutcome[]): number {
    if (outcomes.length === 0) return 0.4; // Cap if no runs available
    const values = outcomes.map(o => OUTCOME_MAP[o]);
    return Math.min(...values);
}

/**
 * Derives Recency (R) from days since last execution
 */
export function deriveRecencyFromDays(days: number | null): number {
    if (days === null) return 0.0;
    if (days <= 30) return 1.0;
    if (days <= 90) return 0.8;
    if (days <= 180) return 0.5;
    if (days > 180) return 0.2;
    return 0.0;
}

// --- 2. Obligation & Domain Level ---

/**
 * Ei = Wi * (1 - max(sj))
 */
export function computeObligationExposure(weight: number, maxMitigation: number): number {
    const Ci = Math.min(1, maxMitigation);
    return weight * (1 - Ci);
}

/**
 * HHI = Sum((Ed/Ebase)^2)
 */
export function computeConcentrationHHI(domainExposures: number[]): number {
    const Ebase = domainExposures.reduce((acc, e) => acc + e, 0);
    if (Ebase === 0) return 0;
    return domainExposures.reduce((acc, ed) => acc + Math.pow(ed / Ebase, 2), 0);
}

// --- 3. Final Scoring & Audit Integration ---

export interface AuditFinding {
    severity: number;
    exposureFloor: number;
    readinessPenalty: number;
    status: 'open' | 'closed' | 'suppressed';
    dueDate: Date | null;
}

/**
 * Calculates Readiness Score = 100 - SUM(Penalties) - SUM(Overdue Penalties)
 */
export function computeReadinessScore(findings: AuditFinding[], overduePenaltyPerFinding: number = 5): number {
    const today = new Date();
    let penaltyTotal = 0;

    findings.filter(f => f.status === 'open').forEach(f => {
        penaltyTotal += f.readinessPenalty;
        if (f.dueDate && f.dueDate < today) {
            penaltyTotal += overduePenaltyPerFinding;
        }
    });

    return Math.max(0, 100 - penaltyTotal);
}

/**
 * E_final = max(E_sys, Gatillo_Max)
 * gatillo_max = max(exposure_floor) from findings with severity >= 4
 */
export function applyAuditExposureFloor(eSys: number, findings: AuditFinding[]): { eFinal: number; gatilloMax: number } {
    const relevantFindings = findings.filter(f => f.status === 'open' && f.severity >= 4);
    const gatilloMax = relevantFindings.length > 0
        ? Math.max(...relevantFindings.map(f => f.exposureFloor))
        : 0;

    return {
        eFinal: Math.max(eSys, gatilloMax),
        gatilloMax
    };
}

/**
 * Score = 100 * (1 - exp(-gamma * E_final))
 */
export function computeFinalScore(E_final: number, gamma: number): number {
    return 100 * (1 - Math.exp(-gamma * E_final));
}

// --- 4. Integrity & Hashing ---

/**
 * Generates a stable SHA-256 hash from any object by sorting keys
 */
export function computeStableHash(data: any): string {
    const recursiveSort = (obj: any): any => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(recursiveSort);
        const sortedKeys = Object.keys(obj).sort();
        const result: any = {};
        sortedKeys.forEach(key => {
            result[key] = recursiveSort(obj[key]);
        });
        return result;
    };

    const canonicalJson = JSON.stringify(recursiveSort(data));
    return crypto.createHash('sha256').update(canonicalJson).digest('hex');
}
