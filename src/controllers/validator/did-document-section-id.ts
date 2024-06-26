import { DIDValidator } from './did.js';
import type { IValidationResult, IValidator, Validatable } from './validator.js';

export class DIDDocumentSectionIDValidator implements IValidator {
	protected didValidator: IValidator;

	constructor(didValidator?: IValidator) {
		if (!didValidator) {
			didValidator = new DIDValidator();
		}
		this.didValidator = didValidator;
	}

	validate(DIDId: Validatable): IValidationResult {
		if (typeof DIDId !== 'string') {
			return {
				valid: false,
				error: 'didDocument.<section>.id should be a string',
			};
		}
		const id = DIDId as string;

		const did = id.split('#')[0];
		const keyId = id.split('#')[1];
		if (!did || !keyId) {
			return {
				valid: false,
				error: 'didDocument.<section>.id does not have right format. Expected DID#keyId',
			};
		}
		if (id.split('#').length > 2) {
			return {
				valid: false,
				error: 'didDocument.<section>.id does not have right format. Expected DID#keyId',
			};
		}
		// Check that it's valid DID
		const _v = this.didValidator.validate(did);
		if (!_v.valid) {
			return {
				valid: false,
				error: `Invalid format of DID Document Section ID. DID has unexpected format: ${_v.error}`,
			};
		}
		return { valid: true };
	}
}
