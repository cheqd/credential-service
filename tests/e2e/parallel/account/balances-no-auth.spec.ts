import { STORAGE_STATE_UNAUTHENTICATED } from '../../constants';
import { test, expect } from '@playwright/test';
import { StatusCodes } from 'http-status-codes';

test.use({ storageState: STORAGE_STATE_UNAUTHENTICATED });

test('[Negative] It cannot fetch account balances without authentication', async ({ request }) => {
	const response = await request.get('/account/balances');
	expect(response.status()).toBe(StatusCodes.UNAUTHORIZED);
});
