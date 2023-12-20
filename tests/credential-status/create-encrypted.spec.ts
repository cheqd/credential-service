import {
	CONTENT_TYPE,
	PAYLOADS_PATH,
	STORAGE_STATE_AUTHENTICATED,
	DEFAULT_DOES_NOT_HAVE_PERMISSIONS,
} from '../constants';
import * as fs from 'fs';
import { test, expect } from '@playwright/test';
import { StatusCodes } from 'http-status-codes';

test.use({ storageState: STORAGE_STATE_AUTHENTICATED });

test('[Negative] It cannot create an encrypted statusList2021 in mainnet network for user with testnet role', async ({
	request,
}) => {
	const response = await request.post(`/credential-status/create/encrypted`, {
		data: JSON.parse(
			fs.readFileSync(`${PAYLOADS_PATH.CREDENTIAL_STATUS}/create-encrypted-without-permissions.json`, 'utf-8')
		),
		headers: { 'Content-Type': CONTENT_TYPE.APPLICATION_JSON },
	});
	expect(response).not.toBeOK();
	expect(response.status()).toBe(StatusCodes.FORBIDDEN);
	expect(await response.text()).toEqual(expect.stringContaining(DEFAULT_DOES_NOT_HAVE_PERMISSIONS));
});
