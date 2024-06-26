import validator from 'validator';
import bs58 from 'bs58';
import type { IValidationResult, IValidator, Validatable } from './validator.js';

export class IndyStyleIdentifierValidator implements IValidator {
	private static readonly ID_LENGTH = 16;

	validate(id: Validatable): IValidationResult {
		if (typeof id !== 'string') {
			return {
				valid: false,
				error: 'Indy-style DID identifier should be a string',
			};
		}
		id = id as string;
		try {
			bs58.decode(id);
			const decoded = bs58.decode(id);
			if (decoded.length !== IndyStyleIdentifierValidator.ID_LENGTH) {
				return {
					valid: false,
					error: `Indy-style DID identifier does not have ${IndyStyleIdentifierValidator.ID_LENGTH} bytes length`,
				};
			}
		} catch (e) {
			return {
				valid: false,
				error: 'Indy-style DID identifier is not a valid Base58 string',
			};
		}
		return { valid: true };
	}
}

export class UUIDIdentifierValidator implements IValidator {
	validate(id: Validatable): IValidationResult {
		if (typeof id !== 'string') {
			return {
				valid: false,
				error: 'UUID-style DID Identifier should be a string',
			};
		}
		id = id as string;
		if (!validator.isUUID(id)) {
			return {
				valid: false,
				error: 'Identifier is not valid UUID',
			};
		}
		return { valid: true };
	}
}

export class CheqdIdentifierValidator implements IValidator {
	protected validators: IValidator[];

	constructor(validators = [new UUIDIdentifierValidator(), new IndyStyleIdentifierValidator()]) {
		this.validators = validators;
	}

	validate(id: Validatable): IValidationResult {
		if (typeof id !== 'string') {
			return {
				valid: false,
				error: 'Cheqd DID identifier should be a string',
			};
		}
		id = id as string;
		const results = this.validators.map((v) => v.validate(id));
		if (results.every((v) => !v.valid)) {
			return {
				valid: false,
				error:
					'Cheqd DID identifier is not valid. Failed identifier checks: ' +
					results.map((v) => v.error).join(', '),
			};
		}
		return { valid: true };
	}
}

export class KeyIdentifierValidator implements IValidator {
	validate(id: Validatable): IValidationResult {
		if (typeof id !== 'string') {
			return {
				valid: false,
				error: 'Key DID identifier should be a string',
			};
		}
		id = id as string;
		// ToDo add more checks for did:key identifier
		return { valid: true };
	}
}

export class VeridaIdentifierValidator implements IValidator {
	validate(id: Validatable): IValidationResult {
		if (typeof id !== 'string') {
			return {
				valid: false,
				error: 'Verida DID identifier should be a string',
			};
		}
		id = id as string;
		// ToDo add more checks for did:vda identifier
		return { valid: true };
	}
}
