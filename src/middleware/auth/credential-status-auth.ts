import type { Request, Response } from 'express';
import { AbstractAuthHandler } from './base-auth.js';
import type { IAuthResponse } from '../../types/authentication.js';

export class CredentialStatusAuthHandler extends AbstractAuthHandler {
	constructor() {
		super();
		this.registerRoute('/credential-status/create/encrypted', 'POST', 'create-encrypted:credential-status:testnet');
		this.registerRoute('/credential-status/create/encrypted', 'POST', 'create-encrypted:credential-status:mainnet');
		this.registerRoute('/credential-status/create/unencrypted', 'POST', 'create-unencrypted:credential-status:testnet');
		this.registerRoute('/credential-status/create/unencrypted', 'POST', 'create-unencrypted:credential-status:mainnet');
		this.registerRoute('/credential-status/publish', 'POST', 'publish:credential-status:testnet');
		this.registerRoute('/credential-status/publish', 'POST', 'publish:credential-status:mainnet');
		this.registerRoute('/credential-status/update/encrypted', 'POST', 'update-encrypted:credential-status:testnet');
		this.registerRoute('/credential-status/update/encrypted', 'POST', 'update-encrypted:credential-status:mainnet');
		this.registerRoute('/credential-status/update/unencrypted', 'POST', 'update-unencrypted:credential-status:testnet');
		this.registerRoute('/credential-status/update/unencrypted', 'POST', 'update-unencrypted:credential-status:mainnet');
		// Unauthorized routes
		this.registerRoute('/credential-status/search', 'GET', '', { allowUnauthorized: true, skipNamespace: true });
		this.registerRoute('/credential-status/check', 'POST', '', { allowUnauthorized: true, skipNamespace: true });
	}
	public async handle(request: Request, response: Response): Promise<IAuthResponse> {
		if (!request.path.includes('/credential-status/')) {
			return super.handle(request, response);
		}
		return this.commonPermissionCheck(request);
	}
}
