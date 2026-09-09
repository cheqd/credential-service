import { DEFAULT_DENOM_EXPONENT } from '../types/constants.js';

/**
 * Helpers for converting between CHEQ and its minimal denomination, `ncheq`
 * (1 CHEQ = 10^DEFAULT_DENOM_EXPONENT ncheq).
 */

/** Convert a CHEQ amount to its `ncheq` value. */
export function cheqToNcheq(amountCheq: number): bigint {
	return BigInt(Math.floor(amountCheq * 10 ** DEFAULT_DENOM_EXPONENT));
}

/** Convert an `ncheq` balance to a CHEQ number. */
export function ncheqToCheq(amountNcheq: bigint): number {
	return Number(amountNcheq) / 10 ** DEFAULT_DENOM_EXPONENT;
}

/** Narrow an `ncheq` amount to a Number for the faucet API, guarding the JS safe-integer range. */
export function toSafeFaucetAmount(amountNcheq: bigint): number {
	if (amountNcheq > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new Error('Faucet amount exceeds JavaScript safe integer range.');
	}

	return Number(amountNcheq);
}
