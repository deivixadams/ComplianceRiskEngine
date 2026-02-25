import { HashUtils } from '../../src/common/validation/hash.utils';

describe('Governance Logic Tests', () => {
    describe('HashUtils', () => {
        it('should generate the same hash for the same parameters regardless of order', () => {
            const params1 = [
                { paramCode: 'ALPHA', value: 0.5 },
                { paramCode: 'BETA', value: 0.3 }
            ];
            const params2 = [
                { paramCode: 'BETA', value: 0.3 },
                { paramCode: 'ALPHA', value: 0.5 }
            ];

            const hash1 = HashUtils.generateProfileHash(params1);
            const hash2 = HashUtils.generateProfileHash(params2);

            expect(hash1).toBe(hash2);
            expect(hash1.length).toBe(64); // SHA-256 length
        });
    });

    describe('Range Validation (Logicial representation)', () => {
        const min = 0;
        const max = 1;

        it('should accept values within range', () => {
            const val = 0.5;
            expect(val >= min && val <= max).toBe(true);
        });

        it('should reject values out of range', () => {
            const val = 1.5;
            expect(val >= min && val <= max).toBe(false);
        });
    });
});
