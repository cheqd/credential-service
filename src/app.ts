import express from 'express';
import Helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { StatusCodes } from 'http-status-codes';

import { CredentialController } from './controllers/credentials.js';
import { IssuerController } from './controllers/issuer.js';
import { AccountController } from './controllers/customer.js';
import { Authentication } from './middleware/authentication.js';
import { Connection } from './database/connection/connection.js';
import { RevocationController } from './controllers/revocation.js';
import { CORS_ALLOWED_ORIGINS, CORS_ERROR_MSG, configLogToExpress } from './types/constants.js';
import { LogToWebHook } from './middleware/hook.js';
import { Middleware } from './middleware/middleware.js';
import { JSONStringify } from './monkey-patch.js';

import * as dotenv from 'dotenv';
dotenv.config();

// monkey patch JSON.stringify to use native-like implementation
// TODO: remove this when @verida/encryption-utils,
// TODO: switches json.sortify to its own implementation
// TODO: e.g. replace JSON.stringify = require('json.sortify')
// TODO: with JSON.sortify = require('json.sortify')
// see: https://github.com/verida/verida-js/blob/c94b95de687c64cc776652602665bb45a327dfb6/packages/encryption-utils/src/index.ts#L10
// eslint-disable-next-line @typescript-eslint/no-unused-vars
JSON.stringify = function (value, _replacer, _space) {
	return (
		JSONStringify(value) ||
		(function () {
			throw new Error('JSON.stringify failed');
		})()
	);
};

// Define Swagger file
import swaggerDocument from './static/swagger.json' assert { type: 'json' };
import { handleAuthRoutes, withLogto } from '@logto/express';

let swaggerOptions = {};
if (process.env.ENABLE_AUTHENTICATION === 'true') {
	swaggerOptions = {
		customJs: '/static/custom-button.js',
	};
}

class App {
	public express: express.Application;

	constructor() {
		this.express = express();
		this.middleware();
		this.routes();
		Connection.instance.connect();
	}

	private middleware() {
		const auth = new Authentication();
		this.express.use(
			express.json({
				limit: '50mb',
				verify: (req: express.Request & { rawBody: Buffer }, _res, buf) => {
					req.rawBody = buf;
				},
			})
		);
		this.express.use(express.raw({ type: 'application/octet-stream' }));
		this.express.use(express.urlencoded({ extended: true }));
		this.express.use(Middleware.parseUrlEncodedJson);
		this.express.use(Helmet());
		this.express.use(
			cors({
				origin: function (origin, callback) {
					if (!origin) return callback(null, true);
					if (CORS_ALLOWED_ORIGINS?.indexOf(origin) === -1) {
						return callback(new Error(CORS_ERROR_MSG), false);
					}
					return callback(null, true);
				},
			})
		);

		this.express.use(cookieParser());
		if (process.env.ENABLE_AUTHENTICATION === 'true') {
			this.express.use(
				session({
					secret:
						process.env.COOKIE_SECRET ||
						(function () {
							throw new Error('COOKIE_SECRET is not defined');
						})(),
					cookie: { maxAge: 14 * 24 * 60 * 60 },
				})
			);
			// Authentication functions/methods
			this.express.use(async (_req, _res, next) => await auth.setup(next));
			this.express.use(handleAuthRoutes(configLogToExpress));
			this.express.use(withLogto(configLogToExpress));
			if (process.env.ENABLE_EXTERNAL_DB === 'true') {
				this.express.use(async (req, res, next) => await auth.guard(req, res, next));
			}
		}
		this.express.use(express.text());

		this.express.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
		this.express.use(auth.handleError);
		this.express.use(async (req, res, next) => await auth.accessControl(req, res, next));
	}

	private routes() {
		const app = this.express;

		// Top-level routes
		app.get('/', (_req, res) => res.redirect('swagger'));

		// Credential API
		app.post(`/credential/issue`, CredentialController.issueValidator, new CredentialController().issue);
		app.post(`/credential/verify`, CredentialController.credentialValidator, new CredentialController().verify);
		app.post(`/credential/revoke`, CredentialController.credentialValidator, new CredentialController().revoke);
		app.post('/credential/suspend', new CredentialController().suspend);
		app.post('/credential/reinstate', new CredentialController().reinstate);

		// presentation
		app.post(
			`/presentation/verify`,
			CredentialController.presentationValidator,
			new CredentialController().verifyPresentation
		);

		// revocation
		app.post(
			'/credential-status/create/unencrypted',
			RevocationController.createUnencryptedValidator,
			new RevocationController().createUnencryptedStatusList
		);
		app.post(
			'/credential-status/create/encrypted',
			RevocationController.createEncryptedValidator,
			new RevocationController().createEncryptedStatusList
		);
		app.post(
			'/credential-status/update/unencrypted',
			RevocationController.updateUnencryptedValidator,
			new RevocationController().updateUnencryptedStatusList
		);
		app.post(
			'/credential-status/update/encrypted',
			RevocationController.updateEncryptedValidator,
			new RevocationController().updateEncryptedStatusList
		);
		app.post(
			'/credential-status/check',
			RevocationController.checkValidator,
			new RevocationController().checkStatusList
		);
		app.get(
			'/credential-status/search',
			RevocationController.searchValidator,
			new RevocationController().searchStatusList
		);

		// Keys API
		app.post('/key/create', new IssuerController().createKey);
		app.get('/key/read/:kid', new IssuerController().getKey);

		// DIDs API
		app.post('/did/create', IssuerController.createValidator, new IssuerController().createDid);
		app.post('/did/update', IssuerController.updateValidator, new IssuerController().updateDid);
		app.post('/did/deactivate/:did', IssuerController.deactivateValidator, new IssuerController().deactivateDid);
		app.get('/did/list', new IssuerController().getDids);
		app.get('/did/search/:did', new IssuerController().resolveDidUrl);

		// Resource API
		app.post('/resource/create/:did', IssuerController.resourceValidator, new IssuerController().createResource);
		app.get('/resource/search/:did', new IssuerController().getResource);

		// Account API
		app.post('/account', new AccountController().create);
		app.get('/account', new AccountController().get);

		// LogTo webhooks
		app.post('/account/bootstrap', LogToWebHook.verifyHookSignature, new AccountController().bootstrap);

		// LogTo user info
		app.get('/auth/user-info', async (req, res) => {
			return res.json(req.user);
		});

		// static files
		app.get(
			'/static/custom-button.js',
			express.static(path.join(process.cwd(), '/dist'), { extensions: ['js'], index: false })
		);

		// 404 for all other requests
		app.all('*', (_req, res) => res.status(StatusCodes.BAD_REQUEST).send('Bad request'));
	}
}

export default new App().express;
