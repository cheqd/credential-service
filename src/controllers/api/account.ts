import type { Request, Response } from 'express';
import type { CustomerEntity } from '../../database/entities/customer.entity.js';
import type { PaymentAccountEntity } from '../../database/entities/payment.account.entity.js';
import type {
	QueryCustomerResponseBody,
	QueryIdTokenResponseBody,
	UnsuccessfulQueryCustomerResponseBody,
	UnsuccessfulQueryIdTokenResponseBody,
} from '../../types/customer.js';
import type { UnsuccessfulResponseBody } from '../../types/shared.js';
import type { ISubmitOperation, ISubmitStripeCustomerCreateData } from '../../services/track/submitter.js';
import type Stripe from 'stripe';
import type { SafeAPIResponse } from '../../types/common.js';

import { CheqdNetwork, checkBalance } from '@cheqd/sdk';
import { MINIMAL_DENOM, OperationNameEnum, TESTNET_FAUCET_UPPER_CAP_CHEQ } from '../../types/constants.js';
import { CustomerService } from '../../services/api/customer.js';
import { LogToHelper } from '../../middleware/auth/logto-helper.js';
import { FaucetHelper } from '../../helpers/faucet.js';
import { PriceHelper } from '../../helpers/price.js';
import { cheqToNcheq, ncheqToCheq, toSafeFaucetAmount } from '../../helpers/denom.js';
import { StatusCodes } from 'http-status-codes';
import { LogToWebHook } from '../../middleware/hook.js';
import { UserService } from '../../services/api/user.js';
import { PaymentAccountService } from '../../services/api/payment-account.js';
import { IdentityServiceStrategySetup } from '../../services/identity/index.js';
import { check } from 'express-validator';
import { EventTracker, eventTracker } from '../../services/track/tracker.js';
import * as dotenv from 'dotenv';
import { validate } from '../validator/decorator.js';
import { SupportedKeyTypes } from '@veramo/utils';
import { SubscriptionService } from '../../services/admin/subscription.js';
import { RoleService } from '../../services/api/role.js';
import { getStripeObjectKey } from '../../utils/index.js';
import { KeyService } from '../../services/api/key.js';
import { LocalStore } from '../../database/cache/store.js';
import { BootStrapAccountResponse } from '../../types/account.js';
import type { AccountNetworkBalance, QueryAccountBalancesResponseBody } from '../../types/account.js';
import { RoleEntity } from '../../database/entities/role.entity.js';
import { MailchimpService } from '../../helpers/mailchimp.js';
import { IdentifierService } from '../../services/api/identifier.js';
import { Credentials } from '../../services/api/credentials.js';
import { ResourceService } from '../../services/api/resource.js';
import { CredentialCategory } from '../../types/credential.js';
import { Like } from 'typeorm';
import { productHasCapability, StudioPlanCapability } from '../../services/admin/plan-capabilities.js';

dotenv.config();

export class AccountController {
	public static createValidator = [
		check('primaryEmail')
			.exists()
			.withMessage('primaryEmail is required')
			.bail()
			.isEmail()
			.withMessage('Invalid email id')
			.bail(),
		check('name').optional().isString().withMessage('name should be a valid string'),
	];

	public static faucetValidator = [
		check('address').optional().isString().notEmpty().withMessage('address should be a valid string').bail(),
		check('amount').optional().isFloat({ gt: 0 }).withMessage('amount should be a positive number').bail(),
	];
	/**
	 * @openapi
	 *
	 * /account:
	 *   get:
	 *     tags: [Account]
	 *     summary: Fetch custodian-mode client details.
	 *     description: This endpoint returns the custodian-mode client details for authenticated users.
	 *     responses:
	 *       200:
	 *         description: The request was successful.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/Customer'
	 *       400:
	 *         $ref: '#/components/schemas/InvalidRequest'
	 *       401:
	 *         $ref: '#/components/schemas/UnauthorizedError'
	 *       500:
	 *         $ref: '#/components/schemas/InternalError'
	 */
	public async get(_request: Request, response: Response) {
		try {
			if (!response.locals.customer) {
				// It's not ok, seems like there no any customer assigned to the user yet
				// But it's not an expected behaviour cause it should be done on bootstrap phase of after migration
				return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
					error: 'Bad state cause there is no customer assigned to the user yet. Please contact administrator.',
				} satisfies UnsuccessfulQueryCustomerResponseBody);
			}

			const cachedAccounts = LocalStore.instance.getCustomerAccounts(response.locals.customer.customerId);
			let paymentAccounts: PaymentAccountEntity[];
			if (cachedAccounts?.length == 2) {
				paymentAccounts = cachedAccounts;
			} else {
				paymentAccounts = await PaymentAccountService.instance.find({ customer: response.locals.customer });
			}
			const result: QueryCustomerResponseBody = {
				customer: {
					customerId: response.locals.customer.customerId,
					name: response.locals.customer.name,
				},
				paymentAccount: {
					mainnet: paymentAccounts.find((acc) => acc.namespace === CheqdNetwork.Mainnet)?.address ?? '',
					testnet: paymentAccounts.find((acc) => acc.namespace === CheqdNetwork.Testnet)?.address ?? '',
				},
			};

			return response.status(StatusCodes.OK).json(result);
		} catch (error) {
			return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				error: `Internal error: ${(error as Error)?.message || error}`,
			} satisfies UnsuccessfulQueryCustomerResponseBody);
		}
	}

	/**
	 * @openapi
	 *
	 * /account/idtoken:
	 *   get:
	 *     tags: [Account]
	 *     summary: Fetch IdToken.
	 *     description: This endpoint returns IdToken as JWT with list of user roles inside
	 *     deprecated: true
	 *     responses:
	 *       200:
	 *         description: The request was successful.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/QueryIdTokenResponseBody'
	 *       400:
	 *         $ref: '#/components/schemas/InvalidRequest'
	 *       401:
	 *         $ref: '#/components/schemas/UnauthorizedError'
	 *       500:
	 *         $ref: '#/components/schemas/InternalError'
	 */
	public async getIdToken(request: Request, response: Response) {
		if (!request.user || !request.session.idToken) {
			return response.status(StatusCodes.BAD_REQUEST).json({
				error: 'Seems like Authorization process was corrupted. Please contact administrator.',
			} satisfies UnsuccessfulQueryIdTokenResponseBody);
		}

		const identityStrategySetup = new IdentityServiceStrategySetup(response.locals.customer.customerId);

		try {
			// Get the API key for the customer
			let apiKey = await identityStrategySetup.agent.getAPIKey(response.locals.customer, response.locals.user);
			// If there is no API key for the customer - create it
			if (!apiKey) {
				apiKey = await identityStrategySetup.agent.setAPIKey(
					request.session.idToken,
					response.locals.customer,
					response.locals.user
				);
			} else if (apiKey.isExpired()) {
				// If API key is expired - update it
				apiKey = await identityStrategySetup.agent.updateAPIKey(apiKey, request.session.idToken);
			}
			return response.status(StatusCodes.OK).json({
				idToken: apiKey?.apiKey,
			} satisfies QueryIdTokenResponseBody);
		} catch (error) {
			return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				error: `Internal error: ${(error as Error)?.message || error}`,
			} satisfies UnsuccessfulQueryIdTokenResponseBody);
		}
	}

	public async bootstrap(request: Request, response: Response) {
		// For now we keep temporary 1-1 relation between user and customer
		// So the flow is:
		// 1. Get LogTo user id from request body
		// 2. Check if there is customer associated with such user
		// 2.1 If not, create a new customer entity
		// 3. Assign role to user
		// 3.1 If user already has a subscription, assign role based on subscription
		// 3.2 Else assign the default "Portal" role
		// 4. If no customer is associated with the user (from point 2), create customer
		// 4.1 Assign customer to the user
		// 5. Create User
		// 6. Add the Stripe account to the Customer
		// 7. Check is paymentAccount exists for the customer
		// 7.1. If no - create it
		// 8.a Create custom_data and update the userInfo (send it to the LogTo)
		// 8.a If custom_data is empty - create it
		// 8.b Check the token balance for Testnet account

		// Status Tracker
		const status = BootStrapAccountResponse.initialize();

		// 1. Get logTo UserId from request body
		if (!request.body.user || !request.body.user.id || !request.body.user.primaryEmail) {
			return response.status(StatusCodes.BAD_REQUEST).json({
				error: 'User id is not specified or primaryEmail is not set',
			} satisfies UnsuccessfulResponseBody);
		}
		const logToUserId = request.body.user.id;
		const logToUserEmail = request.body.user.primaryEmail;
		const logToFirstName = request.body.user.profile?.givenName;
		const logToLastName = request.body.user.profile?.familyName;

		// use email as name, because "name" is unique in the current db setup.
		const logToName = request.body.user.name || logToUserEmail;

		const stripe = response.locals.stripe as Stripe;
		const logToHelper = new LogToHelper();
		// 2. Check if such row exists in the DB
		// eslint-disable-next-line prefer-const
		let [userEntity, [customerEntity], logtoHelperSetup] = await Promise.all([
			UserService.instance.get(logToUserId, { customer: true }),
			CustomerService.instance.find({ email: logToUserEmail }),
			logToHelper.setup(),
		]);

		if (logtoHelperSetup.status !== StatusCodes.OK) {
			return response.status(StatusCodes.SERVICE_UNAVAILABLE).json({
				error: logtoHelperSetup.error,
			} satisfies UnsuccessfulResponseBody);
		}

		try {
			if (!userEntity) {
				// 2. If no - create customer first
				// Cause for now we assume only 1-1 connection between user and customer
				// We think here that if no user row - no customer also, cause customer should be created before user
				// Even if customer was created before for such user but the process was interruted somehow - we need to create it again
				// Cause we don't know the state of the customer in this case
				// 2.1.1. Create customer
				// I’m setting the "name" field to an empty string on the current CustomerEntity because it is non-nullable.
				//  we will populate the customer's "name" field using the response from the Stripe account creation in account-submitter.ts.
				if (!customerEntity) {
					customerEntity = (await CustomerService.instance.create(
						logToName,
						logToUserEmail
					)) as CustomerEntity;
					if (!customerEntity) {
						return response.status(StatusCodes.BAD_REQUEST).json({
							error: 'User is not found in database: Customer was not created',
						} satisfies UnsuccessfulResponseBody);
					}
					// Notify
					await eventTracker.notify({
						message: EventTracker.compileBasicNotification(
							'User was not found in database: Customer with customerId: ' +
								customerEntity.customerId +
								' was created'
						),
						severity: 'info',
					});
				}

				// 3 Assign role to user
				let role: RoleEntity | null = null;
				const logtoRoleSync = await syncLogtoUserRoles(
					logToHelper,
					stripe,
					request,
					logToUserId,
					customerEntity
				);
				if (!logtoRoleSync.success) {
					role = await RoleService.instance.getDefaultRole();
				} else {
					role = await RoleService.instance.findOne({ name: logtoRoleSync.data });
				}

				if (!role) {
					return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
						error: `Internal error: No logto role found`,
					} satisfies UnsuccessfulResponseBody);
				}

				// 2.3. Create user
				userEntity = await UserService.instance.create(logToUserId, customerEntity, role);
				if (!userEntity) {
					return response.status(StatusCodes.BAD_REQUEST).json({
						error: 'User is not found in database: User was not created',
					} satisfies UnsuccessfulResponseBody);
				}
				// Notify
				await eventTracker.notify({
					message: EventTracker.compileBasicNotification(
						'User was not found in database: User with userId: ' + userEntity.logToId + ' was created'
					),
					severity: 'info',
				});
			}

			//4. Check if there is customer associated with such user
			if (!userEntity.customer) {
				customerEntity = (await CustomerService.instance.create(logToName, logToUserEmail)) as CustomerEntity;
				if (!customerEntity) {
					return response.status(StatusCodes.BAD_REQUEST).json({
						error: 'User exists in database: Customer was not created',
					} satisfies UnsuccessfulResponseBody);
				}
				// Notify
				await eventTracker.notify({
					message: EventTracker.compileBasicNotification(
						'User exists in database: Customer with customerId: ' +
							customerEntity.customerId +
							' was created'
					),
					severity: 'info',
				});
				//4.1. Assign customer to the user
				userEntity.customer = customerEntity;
				await UserService.instance.update(userEntity.logToId, customerEntity);
			} else {
				customerEntity = userEntity.customer;
			}

			// Customer initializaiton is complete
			status.customerInitialized = true;

			// 6. check Stripe account if still missing
			if (process.env.STRIPE_ENABLED === 'true' && !customerEntity.paymentProviderId) {
				// should we await? or fire off and forget?
				await eventTracker.submit({
					operation: OperationNameEnum.STRIPE_ACCOUNT_CREATE,
					data: {
						name: customerEntity.name,
						email: customerEntity.email,
						customerId: customerEntity.customerId,
					},
				});
			}
			status.stripeAccountCreated = true;

			// 7. Provision Mainnet & Testnet accounts in parallel
			const accounts = await PaymentAccountService.instance.find({ customer: customerEntity }, { key: true });
			const [mainnetResp, testnetResp] = await Promise.all([
				AccountController.provisionCustomerAccount(CheqdNetwork.Mainnet, accounts, customerEntity),
				AccountController.provisionCustomerAccount(CheqdNetwork.Testnet, accounts, customerEntity),
			]);

			if (mainnetResp.success) {
				status.mainnetAccountProvisioned = true;
			} else status.errors.push(mainnetResp.error);

			if (testnetResp.success) {
				status.testnetAccountProvisioned = true;
			} else status.errors.push(testnetResp.error);

			// 8. Update LogTo custom data and Top‑up Testnet in parallel (non-blocking)
			await Promise.all([
				updateCustomData(userEntity.logToId, customerEntity, mainnetResp, testnetResp, logToHelper, status),
				topupTestnet(customerEntity, testnetResp, status, logToFirstName, logToLastName),
			]);

			// 9. Add user to Mailchimp with "cheqd_Studio" tag (feature-flagged)
			if (
				process.env.MAILCHIMP_ENABLED === 'true' &&
				process.env.MAILCHIMP_API_KEY &&
				process.env.MAILCHIMP_SERVER_PREFIX &&
				process.env.MAILCHIMP_PRODUCT_LIST_ID
			) {
				try {
					const mailchimpService = new MailchimpService();
					await mailchimpService.upsertSubscriber(
						process.env.MAILCHIMP_PRODUCT_LIST_ID,
						logToUserEmail,
						logToFirstName || '',
						logToLastName || '',
						['cheqd_Studio']
					);
				} catch (error) {
					console.error('Mailchimp integration error:', error);
					status.errors.push(`Mailchimp sync failed: ${(error as Error).message}`);
				}
			}

			// 9. Send response with full status
			const allOK = status.errors.length === 0;
			return response
				.status(allOK ? StatusCodes.OK : StatusCodes.INTERNAL_SERVER_ERROR)
				.json({ success: allOK, status });
		} catch (err: any) {
			console.error('Bootstrap error:', err);
			status.errors.push((err as Error)?.message || err);
			return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				success: false,
				status,
			});
		}
	}

	static async provisionCustomerAccount(
		network: CheqdNetwork,
		accounts: PaymentAccountEntity[],
		customerEntity: CustomerEntity
	): Promise<SafeAPIResponse<PaymentAccountEntity>> {
		const existingAccount = accounts.find((acc) => acc.namespace === network);
		if (existingAccount) {
			const key = await KeyService.instance.get(existingAccount.key.kid);
			if (key) {
				return {
					success: true,
					status: 200,
					data: existingAccount,
				};
			}

			return {
				success: false,
				status: 412, // precondition
				error: `Error: account key not found for kid: ${existingAccount.key.kid}`,
			};
		}

		const key = await new IdentityServiceStrategySetup(customerEntity.customerId).agent.createKey(
			SupportedKeyTypes.Secp256k1,
			customerEntity
		);
		if (!key) {
			return {
				success: false,
				status: 400,
				error: `PaymentAccount is not found in database: ${network} key was not created`,
			};
		}

		const account = (await PaymentAccountService.instance.create(
			network,
			true,
			customerEntity,
			key
		)) as PaymentAccountEntity;
		if (!account) {
			return {
				success: false,
				status: 400,
				error: 'PaymentAccount is not found in database: Payment account was not created',
			};
		}

		await eventTracker.notify({
			message: EventTracker.compileBasicNotification(
				`PaymentAccount was not found in database: Payment account with address: ${account.address} on ${network} was created`
			),
			severity: 'info',
		});

		return {
			success: true,
			status: 200,
			data: account,
		};
	}

	/**
	 * @openapi
	 *
	 * /account/create:
	 *   post:
	 *     tags: [Account]
	 *     summary: Create an client for an authenticated user.
	 *     description: This endpoint creates a client in the custodian-mode for an authenticated user
	 *     requestBody:
	 *       content:
	 *         application/x-www-form-urlencoded:
	 *           schema:
	 *             $ref: '#/components/schemas/AccountCreateRequest'
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/AccountCreateRequest'
	 *     responses:
	 *       201:
	 *         description: The request was successful.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/AccountCreateResponse'
	 *       400:
	 *         $ref: '#/components/schemas/InvalidRequest'
	 *       401:
	 *         $ref: '#/components/schemas/UnauthorizedError'
	 *       500:
	 *         $ref: '#/components/schemas/InternalError'
	 */
	@validate
	public async create(request: Request, response: Response) {
		// For now we keep temporary 1-1 relation between user and customer
		// So the flow is:
		// 1. Get username from request body
		// 2. Check if the customer exists
		// 2.1. if no - Create customer
		// 3. Check is paymentAccount exists for the customer
		// 3.1. If no - create it
		// 4. Check the token balance for Testnet account

		// 1. Get logTo UserId from request body
		const { firstName, lastName, primaryEmail } = request.body;
		const logToFirstName = request.body.user?.profile?.givenName;
		const logToLastName = request.body.user?.profile?.familyName;

		try {
			// 2. Check if the customer exists
			const customerEntity = response.locals.customer
				? (response.locals.customer as CustomerEntity)
				: // 2.1 Create customer
					((await CustomerService.instance.create(
						firstName || lastName || primaryEmail,
						primaryEmail
					)) as CustomerEntity);

			if (!customerEntity) {
				return response.status(StatusCodes.BAD_REQUEST).json({
					error: 'Customer creation failed',
				});
			}

			// 3. Check if paymentAccount exists for the customer
			const accounts = await PaymentAccountService.instance.find({ customer: customerEntity }, { key: true });
			const mainnetAccountResponse = await AccountController.provisionCustomerAccount(
				CheqdNetwork.Mainnet,
				accounts,
				customerEntity
			);
			if (!mainnetAccountResponse.success) {
				return response.status(mainnetAccountResponse.status).json({
					error: mainnetAccountResponse.error,
				} satisfies UnsuccessfulResponseBody);
			}

			const testnetAccountResponse = await AccountController.provisionCustomerAccount(
				CheqdNetwork.Testnet,
				accounts,
				customerEntity
			);
			if (!testnetAccountResponse.success) {
				return response.status(testnetAccountResponse.status).json({
					error: testnetAccountResponse.error,
				} satisfies UnsuccessfulResponseBody);
			}

			const testnetAccount = testnetAccountResponse.data;

			// 4. Check the token balance for Testnet account
			if (testnetAccount.address && process.env.ENABLE_ACCOUNT_TOPUP === 'true') {
				const topupAmountNcheq =
					cheqToNcheq(TESTNET_FAUCET_UPPER_CAP_CHEQ) - (await getTestnetBalanceNcheq(testnetAccount.address));
				if (topupAmountNcheq > 0n) {
					// 3.1 If it's less then required for DID creation - assign new portion from testnet-faucet
					// Handle case where firstName or lastName is not set
					const faucetFirstName = logToFirstName || customerEntity.name;
					const faucetLastName = logToLastName || 'n/a';
					const resp = await FaucetHelper.delegateTokens(
						testnetAccount.address,
						faucetFirstName,
						faucetLastName,
						customerEntity.email,
						toSafeFaucetAmount(topupAmountNcheq)
					);

					if (resp.status !== StatusCodes.OK) {
						return response.status(StatusCodes.BAD_GATEWAY).json({
							error: resp.error,
						});
					}
				}
			}
			// 5. Setup stripe account
			if (process.env.STRIPE_ENABLED === 'true' && !customerEntity.paymentProviderId) {
				await eventTracker.submit({
					operation: OperationNameEnum.STRIPE_ACCOUNT_CREATE,
					data: {
						name: customerEntity.name,
						email: customerEntity.email,
						customerId: customerEntity.customerId,
					} satisfies ISubmitStripeCustomerCreateData,
				} satisfies ISubmitOperation);
			}
			return response.status(StatusCodes.CREATED).json(customerEntity);
		} catch (error) {
			return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				error: `Internal Error: ${(error as Error)?.message || error}`,
			});
		}
	}

	/**
	 * @openapi
	 *
	 * /account/faucet:
	 *   post:
	 *     tags: [Account]
	 *     summary: Request cheqd testnet CHEQ tokens for a Studio payment account.
	 *     description: Funds an authenticated Studio user's owned testnet payment account up to the configured faucet cap.
	 *     requestBody:
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               address:
	 *                 type: string
	 *                 description: Optional owned Studio testnet payment account address. Defaults to the authenticated customer's testnet account.
	 *               amount:
	 *                 type: number
	 *                 description: Optional amount in CHEQ. Defaults to the amount needed to top up to the configured cap.
	 *     responses:
	 *       200:
	 *         description: The request was processed.
	 *       400:
	 *         $ref: '#/components/schemas/InvalidRequest'
	 *       401:
	 *         $ref: '#/components/schemas/UnauthorizedError'
	 *       403:
	 *         description: Forbidden.
	 *       404:
	 *         description: No Studio testnet payment account was found for this customer.
	 *       502:
	 *         description: Upstream faucet request failed.
	 *       503:
	 *         description: Stripe subscription checks are disabled.
	 *       500:
	 *         $ref: '#/components/schemas/InternalError'
	 */
	@validate
	public async requestFaucetTokens(request: Request, response: Response) {
		if (request.headers['x-api-key'] || request.headers['customer-id']) {
			return response.status(StatusCodes.FORBIDDEN).json({
				error: 'Faucet requests are only available to authenticated Studio users.',
			} satisfies UnsuccessfulResponseBody);
		}

		if (!response.locals.user || !response.locals.customer) {
			return response.status(StatusCodes.UNAUTHORIZED).json({
				error: 'Unauthorized error: Studio user context was not found.',
			} satisfies UnsuccessfulResponseBody);
		}

		if (process.env.STRIPE_ENABLED !== 'true') {
			return response.status(StatusCodes.SERVICE_UNAVAILABLE).json({
				error: 'Faucet requests require Stripe subscription checks to be enabled.',
			} satisfies UnsuccessfulResponseBody);
		}

		const customer = response.locals.customer as CustomerEntity;
		const stripe = response.locals.stripe as Stripe;
		const requestedAddress = request.body.address as string | undefined;
		const requestedAmountCheq = request.body.amount !== undefined ? Number(request.body.amount) : undefined;

		try {
			const subscription = await SubscriptionService.instance.findCurrent(customer);
			if (!subscription) {
				return response.status(StatusCodes.FORBIDDEN).json({
					error: 'An active Basic or higher subscription is required to request testnet CHEQ tokens.',
				} satisfies UnsuccessfulResponseBody);
			}

			const stripeSubscription = await stripe.subscriptions.retrieve(subscription.subscriptionId);
			if (!['active', 'trialing'].includes(stripeSubscription.status)) {
				return response.status(StatusCodes.FORBIDDEN).json({
					error: 'An active Basic or higher subscription is required to request testnet CHEQ tokens.',
				} satisfies UnsuccessfulResponseBody);
			}

			const productId = getStripeObjectKey(stripeSubscription.items.data[0].plan.product);
			if (!productHasCapability(productId, StudioPlanCapability.Faucet)) {
				return response.status(StatusCodes.FORBIDDEN).json({
					error: 'The current subscription does not include testnet faucet access.',
				} satisfies UnsuccessfulResponseBody);
			}

			const testnetAccount = await resolveFaucetAccount(customer, requestedAddress);
			if (!testnetAccount) {
				return response.status(requestedAddress ? StatusCodes.FORBIDDEN : StatusCodes.NOT_FOUND).json({
					error: requestedAddress
						? 'The requested address is not an owned Studio testnet payment account.'
						: 'No Studio testnet payment account was found for this customer.',
				} satisfies UnsuccessfulResponseBody);
			}

			const capNcheq = cheqToNcheq(TESTNET_FAUCET_UPPER_CAP_CHEQ);
			if (capNcheq <= 0n) {
				return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
					error: 'Invalid TESTNET_FAUCET_UPPER_CAP_CHEQ configuration.',
				} satisfies UnsuccessfulResponseBody);
			}

			const currentBalanceNcheq = await getTestnetBalanceNcheq(testnetAccount.address);
			const maxAllowedNcheq = capNcheq - currentBalanceNcheq;
			const balance = buildFaucetBalanceResponse(currentBalanceNcheq, capNcheq, maxAllowedNcheq);

			if (maxAllowedNcheq <= 0n) {
				return response.status(StatusCodes.OK).json({
					funded: false,
					reason: 'cap_reached',
					address: testnetAccount.address,
					balance,
					requestMore: buildRequestMore(customer, testnetAccount.address, balance, requestedAmountCheq),
				});
			}

			const amountToRequestNcheq =
				requestedAmountCheq === undefined ? maxAllowedNcheq : cheqToNcheq(requestedAmountCheq);

			if (amountToRequestNcheq <= 0n) {
				return response.status(StatusCodes.BAD_REQUEST).json({
					error: 'amount is too small to request.',
				} satisfies UnsuccessfulResponseBody);
			}

			if (amountToRequestNcheq > maxAllowedNcheq) {
				return response.status(StatusCodes.BAD_REQUEST).json({
					error: 'Requested amount exceeds the maximum available top-up for this address.',
					address: testnetAccount.address,
					balance,
					requestMore: buildRequestMore(customer, testnetAccount.address, balance, requestedAmountCheq),
				});
			}

			const faucet = await FaucetHelper.delegateTokens(
				testnetAccount.address,
				customer.name,
				'n/a',
				customer.email,
				toSafeFaucetAmount(amountToRequestNcheq)
			);
			if (faucet.status !== StatusCodes.OK) {
				console.error('Faucet request failed:', faucet.status, faucet.error);
				if (faucet.status === StatusCodes.TOO_MANY_REQUESTS) {
					return response.status(StatusCodes.TOO_MANY_REQUESTS).json({
						error: 'Testnet faucet requests are rate-limited for this address. Please wait a while before trying again.',
					} satisfies UnsuccessfulResponseBody);
				}
				return response.status(StatusCodes.BAD_GATEWAY).json({
					error: 'The testnet faucet is temporarily unavailable. Please try again later.',
				} satisfies UnsuccessfulResponseBody);
			}

			return response.status(StatusCodes.OK).json({
				funded: true,
				address: testnetAccount.address,
				amount: {
					cheq: ncheqToCheq(amountToRequestNcheq),
					ncheq: amountToRequestNcheq.toString(),
				},
				balance,
			});
		} catch (error) {
			return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				error: `Internal error: ${(error as Error)?.message || error}`,
			} satisfies UnsuccessfulResponseBody);
		}
	}

	/**
	 * @openapi
	 *
	 * /account/analytics:
	 *   get:
	 *     tags: [Account]
	 *     summary: Fetch Account Analytics.
	 *     description: This endpoint returns analytics data for the account usage.
	 *     parameters:
	 *       - in: query
	 *         name: network
	 *         description: Filter DID by the network published.
	 *         schema:
	 *           type: string
	 *           enum:
	 *             - mainnet
	 *             - testnet
	 *     responses:
	 *       200:
	 *         description: The request was successful.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/AccountAnalyticsResponse'
	 *       400:
	 *         $ref: '#/components/schemas/InvalidRequest'
	 *       401:
	 *         $ref: '#/components/schemas/UnauthorizedError'
	 *       500:
	 *         $ref: '#/components/schemas/InternalError'
	 */
	public async getAnalytics(request: Request, response: Response) {
		const { network } = request.query;
		try {
			const [dids, credentials, accreditations, resources] = await Promise.all([
				IdentifierService.instance.count(response.locals.customer, {
					...(network && {
						provider: `did:cheqd:${network}`,
					}),
				}),
				Credentials.instance.count(response.locals.customer, {
					category: CredentialCategory.CREDENTIAL,
					deprecated: false,
					...(network && {
						issuerId: Like(`did:cheqd:${network}%`),
					}),
				}),
				Credentials.instance.count(response.locals.customer, {
					category: CredentialCategory.ACCREDITATION,
					deprecated: false,
					...(network && {
						issuerId: Like(`did:cheqd:${network}%`),
					}),
				}),
				ResourceService.instance.count(response.locals.customer, {
					...(network && {
						identifier: Like(`did:cheqd:${network}%`),
					}),
				}),
			]);
			return response.status(StatusCodes.OK).json({
				dids,
				credentials,
				accreditations,
				resources,
			});
		} catch (error) {
			return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				error: `Internal error: ${(error as Error)?.message || error}`,
			});
		}
	}

	/**
	 * @openapi
	 *
	 * /account/balances:
	 *   get:
	 *     tags: [Account]
	 *     summary: Fetch payment account balances.
	 *     description: >-
	 *       Returns the on-chain balance of the authenticated customer's mainnet and testnet payment
	 *       accounts, expressed in ncheq, CHEQ and USD. The CHEQ/USD rate is sourced from CoinGecko and
	 *       cached; if it (or a network's RPC endpoint) is unavailable the response still returns 200 with
	 *       the affected `usd`/`rate`/`balance` fields set to `null`.
	 *     responses:
	 *       200:
	 *         description: The request was successful.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/AccountBalancesResponse'
	 *       401:
	 *         $ref: '#/components/schemas/UnauthorizedError'
	 *       500:
	 *         $ref: '#/components/schemas/InternalError'
	 */
	public async getBalances(_request: Request, response: Response) {
		try {
			if (!response.locals.customer) {
				return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
					error: 'Bad state cause there is no customer assigned to the user yet. Please contact administrator.',
				} satisfies UnsuccessfulResponseBody);
			}

			const cachedAccounts = LocalStore.instance.getCustomerAccounts(response.locals.customer.customerId);
			const paymentAccounts =
				cachedAccounts?.length === 2
					? cachedAccounts
					: await PaymentAccountService.instance.find({ customer: response.locals.customer });

			const addressOf = (network: CheqdNetwork) =>
				paymentAccounts.find((acc) => acc.namespace === network)?.address;
			const mainnetAddress = addressOf(CheqdNetwork.Mainnet);
			const testnetAddress = addressOf(CheqdNetwork.Testnet);

			// `undefined` -> no account / not configured; `null` -> RPC query failed
			// (kept distinct from a successful empty "0" balance).
			const safeBalanceNcheq = async (address: string | undefined, rpcUrl: string | undefined) => {
				if (!address || !rpcUrl) return undefined;
				try {
					return await getBalanceNcheq(address, rpcUrl);
				} catch (error) {
					console.error(
						`getBalances: RPC balance query failed for ${address}:`,
						(error as Error)?.message || error
					);
					return null;
				}
			};

			const [rate, mainnetNcheq, testnetNcheq] = await Promise.all([
				PriceHelper.getCheqUsdRate(),
				safeBalanceNcheq(mainnetAddress, process.env.MAINNET_RPC_URL),
				safeBalanceNcheq(testnetAddress, process.env.TESTNET_RPC_URL),
			]);

			const toNetworkBalance = (
				address: string | undefined,
				ncheq: bigint | null | undefined
			): AccountNetworkBalance | null => {
				if (!address) return null;
				if (ncheq === null || ncheq === undefined) {
					return { address, denom: MINIMAL_DENOM, balance: null, usd: null };
				}
				const cheq = ncheqToCheq(ncheq);
				return {
					address,
					denom: MINIMAL_DENOM,
					balance: { ncheq: ncheq.toString(), cheq },
					usd: rate ? cheq * rate.cheqUsd : null,
				};
			};

			return response.status(StatusCodes.OK).json({
				mainnet: toNetworkBalance(mainnetAddress, mainnetNcheq),
				testnet: toNetworkBalance(testnetAddress, testnetNcheq),
				rate,
			} satisfies QueryAccountBalancesResponseBody);
		} catch (error) {
			return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				error: `Internal error: ${(error as Error)?.message || error}`,
			} satisfies UnsuccessfulResponseBody);
		}
	}
}

const FAUCET_REQUEST_MORE_EMAIL = 'product@cheqd.io';
const FAUCET_REQUEST_MORE_SUBJECT = 'Request more cheqd testnet CHEQ tokens';

function buildFaucetBalanceResponse(currentBalanceNcheq: bigint, capNcheq: bigint, maxAllowedNcheq: bigint) {
	const remainingNcheq = maxAllowedNcheq > 0n ? maxAllowedNcheq : 0n;
	return {
		denom: MINIMAL_DENOM,
		current: {
			cheq: ncheqToCheq(currentBalanceNcheq),
			ncheq: currentBalanceNcheq.toString(),
		},
		cap: {
			cheq: ncheqToCheq(capNcheq),
			ncheq: capNcheq.toString(),
		},
		maxRequestable: {
			cheq: ncheqToCheq(remainingNcheq),
			ncheq: remainingNcheq.toString(),
		},
	};
}

const BALANCE_QUERY_TIMEOUT_MS = 8000;

async function getBalanceNcheq(address: string, rpcUrl: string): Promise<bigint> {
	// `checkBalance` opens a StargateClient connection that exposes no cancellation,
	// so guard it with a timeout to keep the request bounded.
	let timer: NodeJS.Timeout | undefined;
	try {
		const balances = await Promise.race([
			checkBalance(address, rpcUrl),
			new Promise<never>((_, reject) => {
				timer = setTimeout(
					() => reject(new Error(`Balance query timed out after ${BALANCE_QUERY_TIMEOUT_MS}ms`)),
					BALANCE_QUERY_TIMEOUT_MS
				);
			}),
		]);
		const balance = balances.find((coin) => coin.denom === MINIMAL_DENOM);
		return BigInt(balance?.amount || '0');
	} finally {
		if (timer) clearTimeout(timer);
	}
}

async function getTestnetBalanceNcheq(address: string): Promise<bigint> {
	return getBalanceNcheq(address, process.env.TESTNET_RPC_URL);
}

async function resolveFaucetAccount(
	customer: CustomerEntity,
	requestedAddress?: string
): Promise<PaymentAccountEntity | null> {
	if (requestedAddress) {
		return PaymentAccountService.instance.findOne({
			address: requestedAddress,
			namespace: CheqdNetwork.Testnet,
			customer,
		});
	}

	return PaymentAccountService.instance.findOne({
		namespace: CheqdNetwork.Testnet,
		customer,
	});
}

function buildRequestMore(
	customer: CustomerEntity,
	address: string,
	balance: ReturnType<typeof buildFaucetBalanceResponse>,
	requestedAmountCheq?: number
) {
	const requestedAmount = requestedAmountCheq === undefined ? 'Not provided' : `${requestedAmountCheq} CHEQ`;
	const body = [
		'Hello cheqd Product team,',
		'',
		'I would like to request more cheqd testnet CHEQ tokens.',
		'',
		`Full name: ${customer.name}`,
		`Email: ${customer.email}`,
		`Requesting address: ${address}`,
		`Current balance: ${balance.current.cheq} CHEQ`,
		`Configured cap: ${balance.cap.cheq} CHEQ`,
		`Requested amount: ${requestedAmount}`,
		'',
		'Reason:',
		'[Please add your reason here]',
	].join('\n');

	return {
		email: FAUCET_REQUEST_MORE_EMAIL,
		subject: FAUCET_REQUEST_MORE_SUBJECT,
		mailtoHref: `mailto:${FAUCET_REQUEST_MORE_EMAIL}?subject=${encodeURIComponent(
			FAUCET_REQUEST_MORE_SUBJECT
		)}&body=${encodeURIComponent(body)}`,
	};
}

async function syncLogtoUserRoles(
	logToHelper: LogToHelper,
	stripe: Stripe,
	request: Request,
	logToUserId: string,
	customer: CustomerEntity
): Promise<SafeAPIResponse<string>> {
	// 3.1 If user already has a subscription, assign role based on subscription
	// 3.2 Else assign the default "Portal" role
	if (!LogToWebHook.isUserSuspended(request)) {
		const subscription = await SubscriptionService.instance.findCurrent(customer);
		if (!subscription) {
			return {
				success: false,
				error: `Logto role assigned failed: No active subscription found for customer with id: ${customer.customerId}`,
				status: 400,
			};
		}

		const stripeSubscription = await stripe.subscriptions.retrieve(subscription.subscriptionId);
		const stripeProduct = await stripe.products.retrieve(
			getStripeObjectKey(stripeSubscription.items.data[0].plan.product)
		);

		const roleResponse = await logToHelper.assignCustomerPlanRoles(logToUserId, stripeProduct);
		if (roleResponse.status !== StatusCodes.OK && roleResponse.status !== StatusCodes.CREATED) {
			return {
				success: false,
				status: roleResponse.status,
				error: roleResponse.error,
			};
		}

		await eventTracker.notify({
			message: EventTracker.compileBasicNotification(
				`${stripeProduct.name} role was assigned to user with id: ${logToUserId}`
			),
			severity: 'info',
		});

		return {
			success: true,
			status: 200,
			data: stripeProduct.name,
		};
	}

	return {
		success: false,
		error: `Logto role not assigned: User with id ${logToUserId} is suspended`,
		status: 409,
	};
}

async function updateCustomData(
	logToId: string,
	customer: CustomerEntity,
	mainnetResp: any,
	testnetResp: any,
	logToHelper: LogToHelper,
	status: BootStrapAccountResponse
) {
	try {
		const existing = await logToHelper.getCustomData(logToId);
		if (Object.keys(existing.data).length === 0 && mainnetResp.data?.address && testnetResp.data?.address) {
			const customData = {
				customer: { id: customer.customerId, name: customer.name },
				paymentAccount: {
					mainnet: mainnetResp.data.address,
					testnet: testnetResp.data.address,
				},
			};
			const res = await logToHelper.updateCustomData(logToId, customData);
			if (res.status === 200) status.customDataUpdated = true;
		}
	} catch (err: any) {
		status.errors.push((err as Error)?.message || err);
		console.warn('Logto Custom Data Update failed:', err);
	}
}

async function topupTestnet(
	customer: CustomerEntity,
	testnetResp: any,
	status: BootStrapAccountResponse,
	firstName?: string | null,
	lastName?: string | null
) {
	if (!testnetResp.data?.address || process.env.ENABLE_ACCOUNT_TOPUP !== 'true') {
		return;
	}
	try {
		const topupAmountNcheq =
			cheqToNcheq(TESTNET_FAUCET_UPPER_CAP_CHEQ) - (await getTestnetBalanceNcheq(testnetResp.data.address));
		if (topupAmountNcheq > 0n) {
			// Handle case where firstName or lastName is not set
			const faucetFirstName = firstName || customer.name;
			const faucetLastName = lastName || 'n/a';
			const faucet = await FaucetHelper.delegateTokens(
				testnetResp.data.address,
				faucetFirstName,
				faucetLastName,
				customer.email,
				toSafeFaucetAmount(topupAmountNcheq)
			);
			if (faucet.status === StatusCodes.OK) {
				status.testnetMinimumBalance = true;
			} else {
				status.errors.push(faucet.error);
			}
		} else {
			status.testnetMinimumBalance = true;
		}
	} catch (err: any) {
		status.errors.push((err as Error)?.message || err);
		console.warn('Faucet request failed or timed out:', err);
	}
}
