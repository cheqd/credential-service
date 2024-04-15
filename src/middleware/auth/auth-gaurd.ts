import { StatusCodes } from "http-status-codes";
import type { AuthRuleRepository } from "./auth-rule-provider.js";
import type { NextFunction, Request, Response } from "express";
import type { ValidationErrorResponseBody } from "../../types/shared.js";
import type { IUserInfoFetcher } from "./user-info-fetcher/base.js";
import { SwaggerUserInfoFetcher } from "./user-info-fetcher/swagger-ui.js";
import type { IOAuthProvider } from "./oauth/abstract.js";
import type { IncomingHttpHeaders } from "http";
import { PortalUserInfoFetcher } from "./user-info-fetcher/portal-token.js";
import { IdTokenUserInfoFetcher } from "./user-info-fetcher/idtoken.js";
import { M2MCredsTokenUserInfoFetcher } from "./user-info-fetcher/m2m-creds-token.js";
import { APITokenUserInfoFetcher } from "./user-info-fetcher/api-token.js";
import { decodeJwt } from 'jose';

export class APIGuard {
    private authRuleRepository: AuthRuleRepository;
    private userInfoFetcher: IUserInfoFetcher;
    private oauthProvider: IOAuthProvider;
    private static bearerTokenIdentifier = 'Bearer';
    private pathSkip = ['/swagger', '/static', '/logto', '/account/bootstrap', '/admin/webhook', '/admin/swagger'];

    constructor(authRuleRepository: AuthRuleRepository, oauthProvider: IOAuthProvider) {
        this.authRuleRepository = authRuleRepository;
        this.oauthProvider = oauthProvider
        this.userInfoFetcher = new SwaggerUserInfoFetcher(this.oauthProvider);
    }


    /**
     * Executes the authentication guard for incoming requests.
     *
     * @param {Request} request - The incoming request object.
     * @param {Response} response - The outgoing response object.
     * @param {NextFunction} next - The next middleware function in the chain.
     * @return {void}
     */
    public async guard(request: Request, response: Response, next: NextFunction) {
        const authRule = this.authRuleRepository.match(request);
        if (!authRule) {
            return response.status(StatusCodes.BAD_REQUEST).send({
                error: `Bad Request. No auth rules for handling such request: ${request.method} ${request.path} or please check that namespace scpecified correctly.`
            } satisfies ValidationErrorResponseBody);
        }

        if (authRule.isAllowedUnauthorized()) {
            return next();
        }

        // Set user info fetcher
        this.chooseUserFetcherStrategy(request);

        // Get User info. scopes and user id maybe placed in M2M, API token or using Swagger UI
        const resp = await this.userInfoFetcher.fetch(request, response, this.oauthProvider)
        if (resp) {
            return resp
        }

        // Checks if the list of scopes from user enough to make an action
        if (!authRule.areValidScopes(response.locals.scopes)) {
            return response.status(StatusCodes.FORBIDDEN).send({
                error: `Forbidden. Your account is not authorized to carry out this action.`
            } satisfies ValidationErrorResponseBody);
        }

        next()
    }

	/**
	 * Chooses the appropriate user fetcher strategy based on the request headers.
	 *
	 * @param {Request} request - The request object containing the headers.
	 * @return {void} This function does not return a value.
	 */
    private chooseUserFetcherStrategy(request: Request): void {
		const authorizationHeader = request.headers.authorization as string;
		const apiKeyHeader = request.headers['x-api-key'] as string;

		if (authorizationHeader && apiKeyHeader) {
            const token = authorizationHeader.replace('Bearer ', '');
			this.setUserInfoStrategy(new PortalUserInfoFetcher(token, apiKeyHeader, this.oauthProvider));
			return;
		}

		if (authorizationHeader) {
			const token = authorizationHeader.replace('Bearer ', '');
			const payload = decodeJwt(token);

			if (payload.aud === process.env.LOGTO_APP_ID) {
				this.setUserInfoStrategy(new IdTokenUserInfoFetcher(token, this.oauthProvider));
			} else {
				this.setUserInfoStrategy(new M2MCredsTokenUserInfoFetcher(token, this.oauthProvider));
			}

			return;
		}

		if (apiKeyHeader) {
			this.setUserInfoStrategy(new APITokenUserInfoFetcher(apiKeyHeader, this.oauthProvider));
			return;
		}

		this.setUserInfoStrategy(new SwaggerUserInfoFetcher(this.oauthProvider));
	}


	/**
	 * Sets the user info strategy for the API guard.
	 *
	 * @param {IUserInfoFetcher} strategy - The strategy to set as the user info fetcher.
	 * @return {void} This function does not return anything.
	 */
    public setUserInfoStrategy(strategy: IUserInfoFetcher): void {
		this.userInfoFetcher = strategy;
	}

    /**
     * Extracts the bearer token from the incoming HTTP headers.
     *
     * @param {IncomingHttpHeaders} headers - The incoming HTTP headers
     * @return {string | unknown} The extracted bearer token
     */
    public static extractBearerTokenFromHeaders({ authorization }: IncomingHttpHeaders): string | unknown {
		if (authorization && authorization.startsWith(this.bearerTokenIdentifier)) {
			return authorization.slice(this.bearerTokenIdentifier.length + 1);
		}
		return undefined;
	}

	/**
	 * Checks if the given path should be skipped based on the list of paths to skip.
	 *
	 * @param {string} path - The path to check.
	 * @return {boolean} True if the path should be skipped, false otherwise.
	 */
    public skipPath(path: string): boolean {
		for (const ps of this.pathSkip) {
			if (path === '/' || path.startsWith(ps)) {
				return true;
			}
		}
		return false;
	}
}

