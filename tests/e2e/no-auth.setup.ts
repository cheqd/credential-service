import * as dotenv from 'dotenv';
import { STORAGE_STATE_UNAUTHENTICATED } from './constants';
import { test as setup, expect } from '@playwright/test';
import { StatusCodes } from 'http-status-codes';

dotenv.config();

setup('Unauthenticated user', async ({ page }) => {
	// Check that current user is really unauthenticated

	await page.goto(`${process.env.APPLICATION_BASE_URL}/swagger`);
	await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();

	const response = await page.goto(`${process.env.APPLICATION_BASE_URL}/account`);
	expect(response.ok()).not.toBe(true);
	expect(response.status()).toBe(StatusCodes.UNAUTHORIZED);

	// End of authentication steps.

	await page.context().storageState({ path: STORAGE_STATE_UNAUTHENTICATED });
});
