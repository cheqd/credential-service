import NodeCache from 'node-cache';
import {
	COINGECKO_API_URL,
	COINGECKO_API_KEY,
	COINGECKO_TOKEN_ID,
	CHEQ_USD_RATE_CACHE_TTL,
} from '../types/constants.js';

export interface CheqUsdRate {
	cheqUsd: number;
	source: 'coingecko';
	asOf: string;
}

const CACHE_KEY = 'cheq-usd-rate';
const REQUEST_TIMEOUT_MS = 5000;

export class PriceHelper {
	private static cache = new NodeCache();

	/**
	 * Returns the current CHEQ to USD spot rate from CoinGecko, cached for
	 * `CHEQ_USD_RATE_CACHE_TTL` seconds.
	 *
	 * Never throws: any failure (network, timeout, non-2xx, unexpected body) is
	 * logged and returns `null` so callers can degrade gracefully.
	 */
	static async getCheqUsdRate(): Promise<CheqUsdRate | null> {
		const cached = PriceHelper.cache.get<CheqUsdRate>(CACHE_KEY);
		if (cached) {
			return cached;
		}

		try {
			const url = new URL(`${COINGECKO_API_URL.replace(/\/$/, '')}/simple/price`);
			url.searchParams.set('ids', COINGECKO_TOKEN_ID);
			url.searchParams.set('vs_currencies', 'usd');

			const headers: Record<string, string> = { Accept: 'application/json' };
			if (COINGECKO_API_KEY) {
				// Demo keys use `x-cg-demo-api-key`; Pro keys (pro-api.coingecko.com) use `x-cg-pro-api-key`.
				const headerName = COINGECKO_API_URL.includes('pro-api') ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key';
				headers[headerName] = COINGECKO_API_KEY;
			}

			const response = await fetch(url, {
				headers,
				signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
			});

			if (!response.ok) {
				console.error(`PriceHelper: CoinGecko returned ${response.status} ${response.statusText}`);
				return null;
			}

			const body = (await response.json()) as Record<string, { usd?: unknown }>;
			const usd = body?.[COINGECKO_TOKEN_ID]?.usd;

			if (typeof usd !== 'number' || !Number.isFinite(usd) || usd <= 0) {
				console.error(`PriceHelper: unexpected CoinGecko response for '${COINGECKO_TOKEN_ID}'`, body);
				return null;
			}

			const rate: CheqUsdRate = { cheqUsd: usd, source: 'coingecko', asOf: new Date().toISOString() };
			PriceHelper.cache.set(CACHE_KEY, rate, CHEQ_USD_RATE_CACHE_TTL);
			return rate;
		} catch (error) {
			console.error('PriceHelper: failed to fetch CHEQ/USD rate:', (error as Error)?.message || error);
			return null;
		}
	}
}
