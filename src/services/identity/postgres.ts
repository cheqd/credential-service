import type {
	CredentialPayload,
	DIDDocument,
	IIdentifier,
	IVerifyResult,
	PresentationPayload,
	VerifiableCredential,
	VerifiablePresentation,
} from '@veramo/core';
import type { AbstractPrivateKeyStore } from '@veramo/key-manager';
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local';
import { PrivateKeyStore } from '@veramo/data-store';
import {
	Cheqd,
	CheqdDIDProvider,
	type ResourcePayload,
	type BulkRevocationResult,
	type BulkSuspensionResult,
	type BulkUnsuspensionResult,
	type CreateStatusList2021Result,
	type StatusCheckResult,
	DefaultRPCUrls,
	type TransactionResult,
} from '@cheqd/did-provider-cheqd';
import {
	BroadcastStatusListOptions,
	CheckStatusListOptions,
	DefaultDidUrlPattern,
	CreateUnencryptedStatusListOptions,
	CredentialRequest,
	StatusOptions,
	UpdateUnencryptedStatusListOptions,
	VeramoAgent,
	VerificationOptions,
	CreateEncryptedStatusListOptions,
	FeePaymentOptions,
	UpdateEncryptedStatusListOptions,
	ITrackResult,
	ITrackOperation,
} from '../../types/shared.js';
import { Connection } from '../../database/connection/connection.js';
import type { CustomerEntity } from '../../database/entities/customer.entity.js';
import { Veramo } from './agent.js';
import { DefaultIdentityService } from './default.js';
import * as dotenv from 'dotenv';
import { KeyService } from '../key.js';
import { PaymentAccountService } from '../payment_account.js';
import { CheqdNetwork } from '@cheqd/sdk';
import { IdentifierService } from '../identifier.js';
import type { KeyEntity } from '../../database/entities/key.entity.js';
import { ResourceService } from '../resource.js';
import {
	OPERATION_CATEGORY_NAME_CREDENTIAL,
	OPERATION_CATEGORY_NAME_CREDENTIAL_STATUS,
	OPERATION_CATEGORY_NAME_RESOURCE,
} from '../../types/constants.js';
import type { UserEntity } from '../../database/entities/user.entity.js';
import { APIKeyService } from '../api_key.js';
import type { APIKeyEntity } from '../../database/entities/api.key.entity.js';
import { KeyDIDProvider } from '@veramo/did-provider-key';
import type { AbstractIdentifierProvider } from '@veramo/did-manager';

dotenv.config();

const { MAINNET_RPC_URL, TESTNET_RPC_URL, EXTERNAL_DB_ENCRYPTION_KEY } = process.env;

export class PostgresIdentityService extends DefaultIdentityService {
	privateStore?: AbstractPrivateKeyStore;

	constructor() {
		super();
		this.agent = this.initAgent();
	}

	initAgent() {
		if (this.agent) return this.agent;
		const dbConnection = Connection.instance.dbConnection;
		this.privateStore = new PrivateKeyStore(dbConnection, new SecretBox(EXTERNAL_DB_ENCRYPTION_KEY));

		this.agent = Veramo.instance.createVeramoAgent({
			dbConnection,
			kms: {
				postgres: new KeyManagementSystem(this.privateStore),
			},
			providers: {},
			enableCredential: false,
			enableResolver: true,
		});
		return this.agent;
	}

	async createCheqdProvider(
		customer: CustomerEntity,
		namespace: CheqdNetwork
	): Promise<CheqdDIDProvider | undefined> {
		let rpcUrl = '';
		if (namespace === CheqdNetwork.Mainnet) {
			rpcUrl = MAINNET_RPC_URL || DefaultRPCUrls.mainnet;
		} else {
			rpcUrl = TESTNET_RPC_URL || DefaultRPCUrls.testnet;
		}
		const paymentAccount = await PaymentAccountService.instance.find({
			namespace: namespace,
			customer: customer,
		});
		if (paymentAccount.length > 1) {
			throw new Error(`More than one payment account for ${namespace} found`);
		}
		if (paymentAccount.length === 1) {
			const privateKey = (await this.getPrivateKey(paymentAccount[0].key.kid))?.privateKeyHex;

			if (!privateKey) {
				throw new Error(`No keys is initialized`);
			}

			return new CheqdDIDProvider({
				defaultKms: 'postgres',
				cosmosPayerSeed: privateKey,
				networkType: namespace,
				rpcUrl: rpcUrl,
			});
		}
		return undefined;
	}

	async createAgent(customer: CustomerEntity): Promise<VeramoAgent> {
		const providers: Record<string, AbstractIdentifierProvider> = {};
		const cheqdProviders: CheqdDIDProvider[] = [];

		if (!this.privateStore) {
			throw new Error(`No keys is initialized`);
		}
		if (!customer) {
			throw new Error('customer is not specified');
		}
		const dbConnection = Connection.instance.dbConnection;

		// One customer may / may not have one Mainnet paymentAccount
		const providerMainnet = await this.createCheqdProvider(customer, CheqdNetwork.Mainnet);
		// One customer may / may not have one Testnet paymentAccount
		const providerTestnet = await this.createCheqdProvider(customer, CheqdNetwork.Testnet);
		// did:key provider
		providers['did:key'] = new KeyDIDProvider({ defaultKms: 'postgres' });
		if (providerMainnet) {
			providers['did:cheqd:mainnet'] = providerMainnet;
			cheqdProviders.push(providerMainnet);
		}
		if (providerTestnet) {
			providers['did:cheqd:testnet'] = providerTestnet;
			cheqdProviders.push(providerTestnet);
		}
		return Veramo.instance.createVeramoAgent({
			dbConnection,
			kms: {
				postgres: new KeyManagementSystem(this.privateStore),
			},
			providers: providers,
			cheqdProviders: cheqdProviders,
			enableCredential: true,
			enableResolver: true,
		});
	}

	async createKey(type: 'Ed25519' | 'Secp256k1' = 'Ed25519', customer?: CustomerEntity, keyAlias?: string) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const key = await Veramo.instance.createKey(this.agent!, type);
		// Update our specific key columns
		return await KeyService.instance.update(key.kid, customer, keyAlias, new Date());
	}

	async getKey(kid: string, customer: CustomerEntity) {
		const keys = await KeyService.instance.find({ kid: kid, customer: customer });
		if (!keys || keys.length == 0) {
			return null;
		}
		// It's super-strange to have more than one key with the same kid
		if (keys.length > 1) {
			throw new Error(`More than one key with kid ${kid} found`);
		}
		return keys[0];
	}

	async createPaymentAccount(namespace: string, customer: CustomerEntity, key: KeyEntity, isDefault = false) {
		return await PaymentAccountService.instance.create(namespace, isDefault, customer, key);
	}

	async updatePaymentAccount(
		address: string,
		namespace?: string,
		isDefault?: boolean,
		customer?: CustomerEntity,
		key?: KeyEntity
	) {
		return await PaymentAccountService.instance.update(address, namespace, isDefault, customer, key);
	}

	async getPaymentAccount(address: string) {
		return await PaymentAccountService.instance.get(address);
	}

	async findPaymentAccount(where: Record<string, unknown>) {
		return await PaymentAccountService.instance.find(where);
	}

	private async getPrivateKey(kid: string) {
		return await this.privateStore?.getKey({ alias: kid });
	}

	async createDid(network: string, didDocument: DIDDocument, customer: CustomerEntity): Promise<IIdentifier> {
		if (!customer) {
			throw new Error('Customer not found');
		}
		try {
			const agent = await this.createAgent(customer);
			const identifier: IIdentifier = await Veramo.instance.createDid(agent, network, didDocument);
			// Update our specific identifier columns
			await IdentifierService.instance.update(identifier.did, customer);
			return identifier;
		} catch (error) {
			throw new Error(`${error}`);
		}
	}

	async updateDid(didDocument: DIDDocument, customer: CustomerEntity): Promise<IIdentifier> {
		if (!customer) {
			throw new Error('Customer not found');
		}
		const identifier = await IdentifierService.instance.get(didDocument.id);
		if (!identifier) {
			throw new Error(`Identifier ${didDocument.id} not found`);
		}
		if (!identifier.customer.isEqual(customer)) {
			throw new Error(
				`Identifier ${didDocument.id} does not belong to the customer with id ${customer.customerId}`
			);
		}
		try {
			const agent = await this.createAgent(customer);
			const identifier: IIdentifier = await Veramo.instance.updateDid(agent, didDocument);
			return identifier;
		} catch (error) {
			throw new Error(`${error}`);
		}
	}

	async deactivateDid(did: string, customer: CustomerEntity): Promise<boolean> {
		if (!customer) {
			throw new Error('Customer not found');
		}
		const identifier = await IdentifierService.instance.get(did);
		if (!identifier) {
			throw new Error(`Identifier ${did} not found`);
		}
		if (!identifier.customer.isEqual(customer)) {
			throw new Error(`Identifier ${did} does not belong to the customer with id ${customer.customerId}`);
		}
		try {
			const agent = await this.createAgent(customer);
			return await Veramo.instance.deactivateDid(agent, did);
		} catch (error) {
			throw new Error(`${error}`);
		}
	}

	async listDids(customer: CustomerEntity) {
		if (!customer) {
			throw new Error('Customer not found');
		}
		const entities = await IdentifierService.instance.find({ customer: customer });
		return entities.map((entity) => entity.did);
	}

	async getDid(did: string) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return await Veramo.instance.getDid(this.agent!, did);
	}

	async importDid(
		did: string,
		privateKeyHex: string,
		publicKeyHex: string,
		customer: CustomerEntity
	): Promise<IIdentifier> {
		if (!did.match(DefaultDidUrlPattern)) {
			throw new Error('Invalid DID');
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const identifier: IIdentifier = await Veramo.instance.importDid(this.agent!, did, privateKeyHex, publicKeyHex);
		await IdentifierService.instance.update(identifier.did, customer);
		return identifier;
	}

	async createResource(network: string, payload: ResourcePayload, customer: CustomerEntity) {
		try {
			const agent = await this.createAgent(customer);
			const did = `did:cheqd:${network}:${payload.collectionId}`;
			if (!(await IdentifierService.instance.find({ did: did, customer: customer }))) {
				throw new Error(`${did} not found in wallet`);
			}
			return await Veramo.instance.createResource(agent, network, payload);
		} catch (error) {
			throw new Error(`${error}`);
		}
	}

	async createCredential(
		credential: CredentialPayload,
		format: CredentialRequest['format'],
		statusOptions: StatusOptions | null,
		customer: CustomerEntity
	): Promise<VerifiableCredential> {
		try {
			const did = typeof credential.issuer == 'string' ? credential.issuer : credential.issuer.id;
			if (!(await IdentifierService.instance.find({ did: did, customer: customer }))) {
				throw new Error(`${did} not found in wallet`);
			}
			const agent = await this.createAgent(customer);
			return await Veramo.instance.issueCredential(agent, credential, format, statusOptions);
		} catch (error) {
			throw new Error(`${error}`);
		}
	}

	async verifyCredential(
		credential: string | VerifiableCredential,
		verificationOptions: VerificationOptions,
		customer: CustomerEntity
	): Promise<IVerifyResult> {
		const agent = await this.createAgent(customer);
		return await Veramo.instance.verifyCredential(agent, credential, verificationOptions);
	}

	async createPresentation(
		presentation: PresentationPayload,
		verificationOptions: VerificationOptions,
		customer: CustomerEntity
	): Promise<VerifiablePresentation> {
		const agent = await this.createAgent(customer);
		return await Veramo.instance.createPresentation(agent, presentation, verificationOptions);
	}

	async verifyPresentation(
		presentation: VerifiablePresentation | string,
		verificationOptions: VerificationOptions,
		customer: CustomerEntity
	): Promise<IVerifyResult> {
		const agent = await this.createAgent(customer);
		return await Veramo.instance.verifyPresentation(agent, presentation, verificationOptions);
	}

	async createUnencryptedStatusList2021(
		did: string,
		resourceOptions: ResourcePayload,
		statusOptions: CreateUnencryptedStatusListOptions,
		customer: CustomerEntity
	): Promise<CreateStatusList2021Result> {
		const agent = await this.createAgent(customer);
		if (!(await IdentifierService.instance.find({ did: did, customer: customer }))) {
			throw new Error(`${did} not found in wallet`);
		}
		return await Veramo.instance.createUnencryptedStatusList2021(agent, did, resourceOptions, statusOptions);
	}

	async createEncryptedStatusList2021(
		did: string,
		resourceOptions: ResourcePayload,
		statusOptions: CreateEncryptedStatusListOptions,
		customer: CustomerEntity
	): Promise<CreateStatusList2021Result> {
		const agent = await this.createAgent(customer);
		if (!(await IdentifierService.instance.find({ did: did, customer: customer }))) {
			throw new Error(`${did} not found in wallet`);
		}
		return await Veramo.instance.createEncryptedStatusList2021(agent, did, resourceOptions, statusOptions);
	}

	async updateUnencryptedStatusList2021(
		did: string,
		statusOptions: UpdateUnencryptedStatusListOptions,
		customer: CustomerEntity
	): Promise<BulkRevocationResult | BulkSuspensionResult | BulkUnsuspensionResult> {
		const agent = await this.createAgent(customer);
		if (!(await IdentifierService.instance.find({ did: did, customer: customer }))) {
			throw new Error(`${did} not found in wallet`);
		}
		return await Veramo.instance.updateUnencryptedStatusList2021(agent, did, statusOptions);
	}

	async updateEncryptedStatusList2021(
		did: string,
		statusOptions: UpdateEncryptedStatusListOptions,
		customer: CustomerEntity
	): Promise<BulkRevocationResult | BulkSuspensionResult | BulkUnsuspensionResult> {
		const agent = await this.createAgent(customer);
		if (!(await IdentifierService.instance.find({ did: did, customer: customer }))) {
			throw new Error(`${did} not found in wallet`);
		}
		return await Veramo.instance.updateEncryptedStatusList2021(agent, did, statusOptions);
	}

	async checkStatusList2021(
		did: string,
		statusOptions: CheckStatusListOptions,
		customer: CustomerEntity
	): Promise<StatusCheckResult> {
		const agent = await this.createAgent(customer);
		// ToDo: Should we try to get did from our storage? What if DID is placed on ledger but we don't have it in our own db?
		if (!(await IdentifierService.instance.find({ did: did, customer: customer }))) {
			throw new Error(`${did} not found in wallet`);
		}
		return await Veramo.instance.checkStatusList2021(agent, did, statusOptions);
	}

	async broadcastStatusList2021(
		did: string,
		resourceOptions: ResourcePayload,
		statusOptions: BroadcastStatusListOptions,
		customer: CustomerEntity
	): Promise<boolean> {
		const agent = await this.createAgent(customer);
		if (!(await IdentifierService.instance.find({ did: did, customer: customer }))) {
			throw new Error(`${did} not found in wallet`);
		}
		return await Veramo.instance.broadcastStatusList2021(agent, did, resourceOptions, statusOptions);
	}

	async remunerateStatusList2021(
		feePaymentOptions: FeePaymentOptions,
		customer: CustomerEntity
	): Promise<TransactionResult> {
		const agent = await this.createAgent(customer);
		return await Veramo.instance.remunerateStatusList2021(agent, feePaymentOptions);
	}

	async revokeCredentials(
		credentials: VerifiableCredential | VerifiableCredential[],
		publish: boolean,
		customer: CustomerEntity,
		symmetricKey: string
	) {
		const agent = await this.createAgent(customer);
		await this.validateCredentialAccess(credentials, customer);
		return await Veramo.instance.revokeCredentials(agent, credentials, publish, symmetricKey);
	}

	async suspendCredentials(
		credentials: VerifiableCredential | VerifiableCredential[],
		publish: boolean,
		customer: CustomerEntity,
		symmetricKey: string
	) {
		const agent = await this.createAgent(customer);
		await this.validateCredentialAccess(credentials, customer);
		return await Veramo.instance.suspendCredentials(agent, credentials, publish, symmetricKey);
	}

	async reinstateCredentials(
		credentials: VerifiableCredential | VerifiableCredential[],
		publish: boolean,
		customer: CustomerEntity,
		symmetricKey: string
	) {
		const agent = await this.createAgent(customer);
		await this.validateCredentialAccess(credentials, customer);
		return await Veramo.instance.unsuspendCredentials(agent, credentials, publish, symmetricKey);
	}

	private async validateCredentialAccess(
		credentials: VerifiableCredential | VerifiableCredential[],
		customer: CustomerEntity
	) {
		credentials = Array.isArray(credentials) ? credentials : [credentials];
		if (!customer) {
			throw new Error('Customer not found');
		}

		for (const credential of credentials) {
			const decodedCredential =
				typeof credential === 'string' ? await Cheqd.decodeCredentialJWT(credential) : credential;

			const issuerId =
				typeof decodedCredential.issuer === 'string' ? decodedCredential.issuer : decodedCredential.issuer.id;

			const existsInWallet = await IdentifierService.instance.find({ did: issuerId, customer: customer });

			if (!existsInWallet) {
				throw new Error(`${issuerId} not found in wallet`);
			}
		}
	}

	async trackOperation(trackOperation: ITrackOperation): Promise<ITrackResult> {
		// For now it tracks only resource-related operations but in future we will track all other actions
		switch (trackOperation.category) {
			case OPERATION_CATEGORY_NAME_RESOURCE:
				return await this.trackResourceOperation(trackOperation);
			case OPERATION_CATEGORY_NAME_CREDENTIAL_STATUS:
				return await this.trackResourceOperation(trackOperation);
			case OPERATION_CATEGORY_NAME_CREDENTIAL:
				return await this.trackResourceOperation(trackOperation);
			default: {
				return {
					created: false,
					error: `Category ${trackOperation.category} is not supported`,
				};
			}
		}
	}

	async trackResourceOperation(trackOperation: ITrackOperation): Promise<ITrackResult> {
		const customer = trackOperation.customer;
		const did = trackOperation.did;
		const resource = trackOperation.data.resource;
		const encrypted = trackOperation.data.encrypted;
		const symmetricKey = trackOperation.data.symmetricKey;

		const identifier = await IdentifierService.instance.get(did);
		if (!identifier) {
			throw new Error(`Identifier ${did} not found`);
		}
		if (!identifier.controllerKeyId) {
			throw new Error(`Identifier ${did} does not have link to the controller key...`);
		}
		const key = await KeyService.instance.get(identifier.controllerKeyId);
		if (!key) {
			throw new Error(`Key for ${did} not found`);
		}

		const resourceEntity = await ResourceService.instance.createFromLinkedResource(
			resource,
			customer,
			key,
			identifier,
			encrypted,
			symmetricKey
		);
		if (!resourceEntity) {
			return {
				created: false,
				error: `Resource for ${did} was not tracked`,
			};
		}
		return {
			created: true,
			error: '',
		};
	}
	async setAPIKey(apiKey: string, customer: CustomerEntity, user: UserEntity): Promise<APIKeyEntity> {
		const keys = await APIKeyService.instance.find({ customer: customer, user: user });
		if (keys.length > 0) {
			throw new Error(`API key for customer ${customer.customerId} and user ${user.logToId} already exists`);
		}
		const apiKeyEntity = await APIKeyService.instance.create(apiKey, customer, user);
		if (!apiKeyEntity) {
			throw new Error(`Cannot create API key for customer ${customer.customerId} and user ${user.logToId}`);
		}
		return apiKeyEntity;
	}

	async updateAPIKey(apiKey: APIKeyEntity, newApiKey: string): Promise<APIKeyEntity> {
		const key = await APIKeyService.instance.get(apiKey.apiKeyId);
		if (!key) {
			throw new Error(`API key with id ${apiKey.apiKeyId} not found`);
		}
		const apiKeyEntity = await APIKeyService.instance.update(
			key.apiKeyId,
			newApiKey,
			await APIKeyService.instance.getExpiryDate(newApiKey)
		);
		if (!apiKeyEntity) {
			throw new Error(`Cannot update API key with id ${apiKey.apiKeyId}`);
		}
		return apiKeyEntity;
	}

	async getAPIKey(customer: CustomerEntity, user: UserEntity): Promise<APIKeyEntity | undefined> {
		const keys = await APIKeyService.instance.find({ customer: customer, user: user });
		if (keys.length > 1) {
			throw new Error(
				`For the customer with customer id ${customer.customerId} and user with logToId ${user.logToId} there more then 1 API key`
			);
		}
		if (keys.length == 0) {
			return undefined;
		}
		return keys[0];
	}
}
