import { describe, it, expect } from '@jest/globals';
import { ncheqToCheq } from '../../../src/helpers/denom.js';

describe('ncheqToCheq', () => {
	it('returns 0 for an empty balance', () => {
		expect(ncheqToCheq(0n)).toBe(0);
	});

	it('converts a whole-CHEQ balance', () => {
		expect(ncheqToCheq(1_500_000_000_000n)).toBe(1500);
	});

	it('converts a sub-CHEQ balance', () => {
		expect(ncheqToCheq(1n)).toBe(1e-9);
		expect(ncheqToCheq(250_000_000n)).toBeCloseTo(0.25, 9);
	});

	it('handles balances beyond Number.MAX_SAFE_INTEGER ncheq without throwing', () => {
		// 10 billion CHEQ = 1e19 ncheq, well past Number.MAX_SAFE_INTEGER (~9.007e15)
		const tenBillionCheq = 10_000_000_000n * 1_000_000_000n;
		expect(ncheqToCheq(tenBillionCheq)).toBeCloseTo(1e10, 0);
	});
});

describe('CHEQ -> USD conversion (as performed by GET /account/balances)', () => {
	const toUsd = (ncheq: bigint, cheqUsd: number) => ncheqToCheq(ncheq) * cheqUsd;

	it('multiplies the CHEQ balance by the spot rate', () => {
		expect(toUsd(1_500_000_000_000n, 0.00202)).toBeCloseTo(3.03, 6);
	});

	it('is 0 for a zero balance regardless of rate', () => {
		expect(toUsd(0n, 0.00202)).toBe(0);
	});
});
