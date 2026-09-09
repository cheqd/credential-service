import { EnvironmentType } from '@verida/types';

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			// Base
			NODE_ENV: EnvironmentType;
			PORT: string;
			NPM_CONFIG_LOGLEVEL: string;
			LOG_LEVEL: string | 'info';
			LOCAL_STORE_TTL: string | undefined;

			// Network API endpoints
			MAINNET_RPC_URL: string;
			TESTNET_RPC_URL: string;
			RESOLVER_URL: string;
			APPLICATION_BASE_URL: string | 'http://localhost:3000';
			CORS_ALLOWED_ORIGINS: string | APPLICATION_BASE_URL;
			ENABLE_EXTERNAL_DB: string | 'false';
			EXTERNAL_DB_CONNECTION_URL: string;
			EXTERNAL_DB_ENCRYPTION_KEY: string;
			EXTERNAL_DB_CERT: string | undefined;
			API_KEY_EXPIRATION: number;

			// LogTo
			LOGTO_ENDPOINT: string;
			LOGTO_APP_ID: string;
			LOGTO_APP_SECRET: string;
			LOGTO_DEFAULT_RESOURCE_URL: string;
			LOGTO_M2M_APP_ID: string;
			LOGTO_M2M_APP_SECRET: string;
			LOGTO_MANAGEMENT_API: string;
			LOGTO_TESTNET_ROLE_ID: string;
			LOGTO_DEFAULT_ROLE_ID: string;
			LOGTO_MAINNET_ROLE_ID: string;
			LOGTO_WEBHOOK_SECRET: string;

			// Authentication
			ENABLE_AUTHENTICATION: string | 'false';
			COOKIE_SECRET: string;

			// Verida
			ENABLE_VERIDA_CONNECTOR: string | 'false';
			POLYGON_RPC_URL_MAINNET: string;
			POLYGON_RPC_URL_TESTNET: string;
			VERIDA_PRIVATE_KEY: string;
			POLYGON_PRIVATE_KEY: string;

			// Without external db
			ISSUER_PRIVATE_KEY_HEX: string;
			ISSUER_PUBLIC_KEY_HEX: string;
			DEFAULT_FEE_PAYER_MNEMONIC: string;
			ISSUER_DID: string;

			// Faucet
			ENABLE_ACCOUNT_TOPUP: string | 'false';
			FAUCET_URI: string;
			FAUCET_API_KEY: string;
			FAUCET_AMOUNT: string;
			FAUCET_ACCESS_CLIENT_ID: string;
			FAUCET_ACCESS_CLIENT_SECRET: string;
			TESTNET_MINIMUM_BALANCE: string;
			TESTNET_FAUCET_UPPER_CAP_CHEQ: string;

			// CHEQ market data (CoinGecko)
			COINGECKO_API_URL: string;
			COINGECKO_TOKEN_ID: string;
			COINGECKO_API_KEY: string | undefined;
			CHEQ_USD_RATE_CACHE_TTL: string | undefined;

			// Creds
			CREDS_DECRYPTION_SECRET: string;

			// Providers
			PROVIDER_ENCRYPTION_KEY: string;
			PROVIDER_EXPORT_PASSWORD: string;

			// Stripe
			STRIPE_ENABLED: string | 'false';
			STRIPE_SECRET_KEY: string;
			STRIPE_PUBLISHABLE_KEY: string;
			STRIPE_WEBHOOK_SECRET: string;
			STRIPE_BUILD_PLAN_ID: string;
			STRIPE_BASIC_PLAN_ID: string | undefined;
			STRIPE_TEST_PLAN_ID: string;

			// Mailchimp
			MAILCHIMP_ENABLED: string | 'false';
			MAILCHIMP_API_KEY: string | undefined;
			MAILCHIMP_LIST_ID: string | undefined;
			MAILCHIMP_SERVER_PREFIX: string | undefined;
		}
	}

	namespace Express {
		interface Request {
			rawBody: Buffer;
		}
	}
}

export {};
