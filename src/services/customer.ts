import { ArrayContains, Repository } from 'typeorm';

import { Connection } from '../database/connection/connection.js';
import { CustomerEntity } from '../database/entities/customer.entity.js';
import { getCosmosAccount } from '@cheqd/sdk';
import { IdentityServiceStrategySetup } from './identity/index.js';

import * as dotenv from 'dotenv';
dotenv.config();

export class CustomerService {
	public customerRepository: Repository<CustomerEntity>;

	public static instance = new CustomerService();

	constructor() {
		this.customerRepository = Connection.instance.dbConnection.getRepository(CustomerEntity);
	}

	public async create(customerId: string) {
		if (await this.find(customerId, {})) {
			throw new Error('Cannot create a new customer since the user is already associated with a Customer ID');
		}
		const kid = (await new IdentityServiceStrategySetup(customerId).agent.createKey('Secp256k1', customerId)).kid;
		const address = getCosmosAccount(kid);
		const customer = new CustomerEntity(customerId, kid, getCosmosAccount(kid));
		const customerEntity = (await this.customerRepository.insert(customer)).identifiers[0];
		return {
			customerId: customerEntity.customerId,
			address: address,
		};
	}

	public async update(
		customerId: string,
		{
			kids = [],
			dids = [],
			claimIds = [],
			presentationIds = [],
		}: { kids?: string[]; dids?: string[]; claimIds?: string[]; presentationIds?: string[] }
	) {
		const existingCustomer = await this.customerRepository.findOneBy({ customerId });
		if (!existingCustomer) {
			throw new Error(`CustomerId not found`);
		}

		existingCustomer.kids = this.concatenate(existingCustomer.kids, kids);
		existingCustomer.dids = this.concatenate(existingCustomer.dids, dids);
		existingCustomer.claimIds = this.concatenate(existingCustomer.claimIds, claimIds);
		existingCustomer.presentationIds = this.concatenate(existingCustomer.presentationIds, presentationIds);

		return await this.customerRepository.save(existingCustomer);
	}

	public async get(customerId?: string) {
		return customerId
			? await this.customerRepository.findOneBy({ customerId })
			: await this.customerRepository.find();
	}

	public async find(
		customerId: string,
		{ kid, did, claimId, presentationId }: { kid?: string; did?: string; claimId?: string; presentationId?: string }
	) {
		const where: Record<string, unknown> = {
			customerId,
		};

		if (kid) {
			where.kids = ArrayContains([kid]);
		}

		if (did) {
			where.dids = ArrayContains([did]);
		}

		if (claimId) {
			where.claimIds = ArrayContains([claimId]);
		}

		if (presentationId) {
			where.presentationIds = ArrayContains([presentationId]);
		}

		try {
			return (await this.customerRepository.findOne({ where })) ? true : false;
		} catch {
			return false;
		}
	}

	private concatenate<T>(array: T[], items: T[]): T[] {
		return array ? array.concat(items) : items;
	}
}
