import type { Request, Response } from 'express';
import { BaseAuthHandler } from '../base-auth-handler.js';
import type { IAuthResponse } from '../../../types/authentication.js';

export class DidAuthHandler extends BaseAuthHandler {
	constructor() {
		super();
		this.registerRoute('/did/create', 'POST', 'create:did:testnet');
		this.registerRoute('/did/create', 'POST', 'create:did:mainnet');
		this.registerRoute('/did/list', 'GET', 'list:did:testnet', { skipNamespace: true });
		this.registerRoute('/did/list', 'GET', 'list:did:mainnet', { skipNamespace: true });
		this.registerRoute('/did/update', 'POST', 'update:did:testnet');
		this.registerRoute('/did/update', 'POST', 'update:did:mainnet');
		this.registerRoute('/did/deactivate', 'POST', 'deactivate:did:testnet');
		this.registerRoute('/did/deactivate', 'POST', 'deactivate:did:mainnet');
		this.registerRoute('/did/import', 'POST', 'import:did:testnet');
		this.registerRoute('/did/import', 'POST', 'import:did:mainnet');
		// Unauthorized routes
		this.registerRoute('/did/search/(.*)', 'GET', '', { allowUnauthorized: true, skipNamespace: true });
	}

	public async handle(request: Request, response: Response): Promise<IAuthResponse> {
		if (!request.path.includes('/did/')) {
			return super.handle(request, response);
		}
		return this.guardAPI(request);
	}
}
