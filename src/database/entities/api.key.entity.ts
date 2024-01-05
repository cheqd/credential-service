import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import * as dotenv from 'dotenv';
import { CustomerEntity } from './customer.entity.js';
import { UserEntity } from './user.entity.js';
dotenv.config();

@Entity('apiKey')
export class APIKeyEntity {
	@PrimaryGeneratedColumn('uuid')
	apiKeyId!: string;

	@Column({
		type: 'text',
		nullable: false,
	})
	apiKey!: string;

	@Column({
		type: 'timestamptz',
		nullable: false,
	})
	expiresAt!: Date;

	@Column({
		type: 'timestamptz',
		nullable: false,
	})
	createdAt!: Date;

	@Column({
		type: 'timestamptz',
		nullable: true,
	})
	updatedAt!: Date;

	@ManyToOne(() => CustomerEntity, (customer) => customer.customerId, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'customerId' })
	customer!: CustomerEntity;

	@ManyToOne(() => UserEntity, (user) => user.logToId, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user!: UserEntity;

	@BeforeInsert()
	setCreatedAt() {
		this.createdAt = new Date();
	}

	@BeforeUpdate()
	setUpdateAt() {
		this.updatedAt = new Date();
	}

	public isExpired(): boolean {
		return this.expiresAt < new Date();
	}

	constructor(apiKeyId: string, apiKey: string, expiresAt: Date, customer: CustomerEntity, user: UserEntity) {
		this.apiKeyId = apiKeyId;
		this.apiKey = apiKey;
		this.expiresAt = expiresAt;
		this.customer = customer;
		this.user = user;
	}
}