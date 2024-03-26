import type { Request, Response } from 'express';
import { BaseAuthHandler } from '../../base-auth-handler.js';
import type { IAuthResponse } from '../../../../types/authentication.js';

export class AdminHandler extends BaseAuthHandler {
	constructor() {
		super();
		// Subscriptions
		// skipNamespace is set to true cause we don't have the information about the namespace in the request
		this.registerRoute('/admin/subscription/create', 'POST', 'admin:subscription:create:testnet', {
			skipNamespace: true,
		});
		this.registerRoute('/admin/subscription/create', 'POST', 'admin:subscription:create:mainnet', {
			skipNamespace: true,
		});
		this.registerRoute('/admin/subscription/list', 'GET', 'admin:subscription:list:testnet', {
			skipNamespace: true,
		});
		this.registerRoute('/admin/subscription/list', 'GET', 'admin:subscription:list:mainnet', {
			skipNamespace: true,
		});
		this.registerRoute('/admin/subscription/update', 'POST', 'admin:subscription:update:testnet', {
			skipNamespace: true,
		});
		this.registerRoute('/admin/subscription/update', 'POST', 'admin:subscription:update:mainnet', {
			skipNamespace: true,
		});
		this.registerRoute('/admin/subscription/cancel', 'POST', 'admin:subscription:cancel:testnet', {
			skipNamespace: true,
		});
		this.registerRoute('/admin/subscription/cancel', 'POST', 'admin:subscription:cancel:mainnet', {
			skipNamespace: true,
		});
		this.registerRoute('/admin/subscription/resume', 'POST', 'admin:subscription:resume:testnet', {
			skipNamespace: true,
		});
		this.registerRoute('/admin/subscription/resume', 'POST', 'admin:subscription:resume:mainnet', {
			skipNamespace: true,
		});
		this.registerRoute('/admin/subscription/get', 'GET', 'admin:subscription:get:testnet', { skipNamespace: true });
		this.registerRoute('/admin/subscription/get', 'GET', 'admin:subscription:get:mainnet', { skipNamespace: true });
		// Prices
		this.registerRoute('/admin/price/list', 'GET', 'admin:price:list:testnet', { skipNamespace: true });
		this.registerRoute('/admin/price/list', 'GET', 'admin:price:list:mainnet', { skipNamespace: true });

		// Products
		this.registerRoute('/admin/product/list', 'GET', 'admin:product:list:testnet', { skipNamespace: true });
		this.registerRoute('/admin/product/list', 'GET', 'admin:product:list:mainnet', { skipNamespace: true });
		this.registerRoute('/admin/product/get', 'GET', 'admin:product:get:testnet', { skipNamespace: true });
		this.registerRoute('/admin/product/get', 'GET', 'admin:product:get:mainnet', { skipNamespace: true });
	}
	public async handle(request: Request, response: Response): Promise<IAuthResponse> {
		if (!request.path.includes('/admin/')) {
			return super.handle(request, response);
		}
		return this.guardAPI(request);
	}
}