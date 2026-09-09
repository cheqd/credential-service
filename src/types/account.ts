export interface BootStrapAccountResponse {
	customerInitialized: boolean;
	mainnetAccountProvisioned: boolean;
	testnetAccountProvisioned: boolean;
	customDataUpdated: boolean;
	testnetMinimumBalance: boolean;
	stripeAccountCreated: boolean;
	errors: string[];
}

export const BootStrapAccountResponse = {
	initialize() {
		return {
			customerInitialized: false,
			mainnetAccountProvisioned: false,
			testnetAccountProvisioned: false,
			customDataUpdated: false,
			testnetMinimumBalance: false,
			stripeAccountCreated: false,
			errors: [],
		} as BootStrapAccountResponse;
	},
};

// GET /account/balances

export interface AccountNetworkBalance {
	address: string;
	denom: string;
	// `null` when the on-chain balance query failed for this network (the address is still returned).
	balance: { ncheq: string; cheq: number } | null;
	// `cheq * rate.cheqUsd`; `null` when the balance or the CHEQ/USD rate is unavailable.
	usd: number | null;
}

export interface QueryAccountBalancesResponseBody {
	// `null` when the customer has no payment account on that network.
	mainnet: AccountNetworkBalance | null;
	testnet: AccountNetworkBalance | null;
	// `null` when the CHEQ/USD rate could not be fetched.
	rate: { cheqUsd: number; source: 'coingecko'; asOf: string } | null;
}
