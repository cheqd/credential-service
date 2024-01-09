import type { Request } from 'express';
import { AuthReturn } from '../routine.js';
import type { IAuthResponse } from '../../../types/authentication.js';
import { StatusCodes } from 'http-status-codes';
import type { IUserInfoFetcher } from './base.js';
import type { IOAuthProvider } from '../oauth/base.js';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import * as dotenv from 'dotenv';
dotenv.config();

export class M2MTokenUserInfoFetcher extends AuthReturn implements IUserInfoFetcher {
	token: string;

	constructor(token: string) {
		super();
		this.token = token;
	}

	async fetchUserInfo(request: Request, oauthProvider: IOAuthProvider): Promise<IAuthResponse> {
		return this.verifyJWTToken(this.token as string, oauthProvider);
	}

	public async verifyJWTToken(token: string, oauthProvider: IOAuthProvider): Promise<IAuthResponse> {
		try {
			console.log(token);
			const { payload } = await jwtVerify(
				token, // The raw Bearer Token extracted from the request header
				createRemoteJWKSet(new URL(oauthProvider.endpoint_jwks)) // generate a jwks using jwks_uri inquired from Logto server
			);
			// console.log(payload);
			// Setup the scopes from the token
			if (!payload.sub) {
				return this.returnError(StatusCodes.UNAUTHORIZED, `Unauthorized error: No sub found in the token.`);
			}
			const { error, data: scopes } = await oauthProvider.getAppScopes(payload.sub);
			// console.log('Scopes', scopes);
			if (error) {
				return this.returnError(StatusCodes.UNAUTHORIZED, `Unauthorized error: No scopes found for the roles.`);
			}
			this.setScopes(scopes);
			return this.returnOk();
		} catch (error) {
			console.error(error);
			return this.returnError(StatusCodes.INTERNAL_SERVER_ERROR, `Unexpected error: ${error}`);
		}
	}
}
