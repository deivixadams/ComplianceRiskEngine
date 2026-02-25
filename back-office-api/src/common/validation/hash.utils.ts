import * as crypto from 'crypto';

export class HashUtils {
    static generateProfileHash(parameters: any[]): string {
        // Sort parameters by code to ensure deterministic hashing
        const sorted = [...parameters].sort((a, b) => a.paramCode.localeCompare(b.paramCode));
        const data = JSON.stringify(sorted.map(p => ({
            code: p.paramCode,
            value: p.value.toString()
        })));

        return crypto.createHash('sha256').update(data).digest('hex');
    }
}
