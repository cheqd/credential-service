import { test, expect } from '@playwright/test';
import { StatusCodes } from 'http-status-codes';

test.use({ storageState: 'playwright/.auth/user.json' });

test('[Positive] It returns mainnet and testnet payment account balances', async ({ request }) => {
	const response = await request.get('/account/balances');
	expect(response.status()).toBe(StatusCodes.OK);

	const body = await response.json();

	expect(body).toHaveProperty('mainnet');
	expect(body).toHaveProperty('testnet');
	expect(body).toHaveProperty('rate');

	for (const network of ['mainnet', 'testnet'] as const) {
		const entry = body[network];
		if (entry === null) continue;

		expect(typeof entry.address).toBe('string');
		expect(entry.address.length).toBeGreaterThan(0);
		expect(entry.denom).toBe('ncheq');

		if (entry.balance !== null) {
			expect(entry.balance.ncheq).toMatch(/^\d+$/);
			expect(typeof entry.balance.cheq).toBe('number');
		}

		expect(['number', 'object']).toContain(typeof entry.usd); // number or null
	}

	if (body.rate !== null) {
		expect(typeof body.rate.cheqUsd).toBe('number');
		expect(body.rate.cheqUsd).toBeGreaterThan(0);
		expect(body.rate.source).toBe('coingecko');
		expect(() => new Date(body.rate.asOf).toISOString()).not.toThrow();
	}
});

test('[Positive] The testnet balance address matches the one returned by GET /account', async ({ request }) => {
	const [balancesRes, accountRes] = await Promise.all([request.get('/account/balances'), request.get('/account')]);
	expect(balancesRes.status()).toBe(StatusCodes.OK);
	expect(accountRes.status()).toBe(StatusCodes.OK);

	const balances = await balancesRes.json();
	const account = await accountRes.json();

	if (balances.testnet !== null) {
		expect(balances.testnet.address).toBe(account.paymentAccount.testnet);
	}
});
