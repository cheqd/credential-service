import type { Repository } from 'typeorm';

import { Connection } from '../database/connection/connection.js';

import * as dotenv from 'dotenv';
import { OperationEntity } from '../database/entities/operation.entity.js';
import { v4 } from 'uuid';
dotenv.config();

export class OperationService {
	public operationRepository: Repository<OperationEntity>;

	public static instance = new OperationService();

	constructor() {
		this.operationRepository = Connection.instance.dbConnection.getRepository(OperationEntity);
	}

	public async create(
		category: string,
		operationName: string,
		defaultFee: number,
		deprecated = false
	): Promise<OperationEntity> {
		if (!category) {
			throw new Error('Operation category is not specified');
		}
		if (!operationName) {
			throw new Error('Operation name is not specified');
		}
		if (!defaultFee) {
			throw new Error('Operation default fee is not specified');
		}
		if (!deprecated) {
			throw new Error('Operation deprecated is not specified');
		}
		const operationId = v4();
		const operationEntity = new OperationEntity(operationId, category, operationName, defaultFee, deprecated);
		const operation = (await this.operationRepository.insert(operationEntity)).identifiers[0];
		if (!operation) throw new Error(`Cannot create a new operation`);

		return operationEntity;
	}

	public async update(
		operationId: string,
		category: string,
		operationName: string,
		defaultFee: number,
		deprecated = false
	) {
		const existingOperation = await this.get(operationId);
		if (!existingOperation) {
			throw new Error(`Operation with id ${operationId} does not exist`);
		}
		if (category) {
			existingOperation.category = category;
		}
		if (operationName) {
			existingOperation.operationName = operationName;
		}
		if (defaultFee) {
			existingOperation.defaultFee = defaultFee;
		}
		if (deprecated) {
			existingOperation.deprecated = deprecated;
		}

		return await this.operationRepository.save(existingOperation);
	}

	public async get(operationId: string) {
		return await this.operationRepository.findOne({
			where: { operationId },
		});
	}

	public async find(where: Record<string, unknown>) {
		return await this.operationRepository.find({
			where: where,
		});
	}
}
