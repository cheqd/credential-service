import type { CheqdNetwork, MethodSpecificIdAlgo, Service, VerificationMethods } from '@cheqd/sdk';
import type { DIDDocument, DIDResolutionResult, VerificationMethod } from 'did-resolver';
import type { UnsuccessfulQueryResponseBody, UnsuccessfulResponseBody } from './shared.js';
import type { IIdentifier } from '@veramo/core';
import type { KeyImport } from './key.js';

// Interfaces
export interface DidImportRequest {
	did: string;
	keys: KeyImport[];
	controllerKeyId?: string;
}

// Requests

export type DIDRequest = {
	did: string;
};

export type CreateDidRequestBody = {
	didDocument?: DIDDocument;
	identifierFormatType: MethodSpecificIdAlgo;
	network: CheqdNetwork;
	verificationMethodType?: VerificationMethods;
	service?: Service | Service[];
	'@context'?: string | string[];
	key?: string;
	options?: {
		verificationMethodType: VerificationMethods;
		key: string;
	};
};

export type UpdateDidRequestBody = {
	did: string;
	service: Service[];
	verificationMethod: VerificationMethod[];
	authentication: string[];
	didDocument?: DIDDocument;
};

export type ImportDidRequestBody = DidImportRequest;

export type DeactivateDIDRequestParams = DIDRequest;

export type GetDIDRequestParams = DIDRequest;

export type ResolveDIDRequestParams = DIDRequest;

// Responses
//Positive

export type CreateDidResponseBody = IIdentifier;

export type UpdateDidResponseBody = IIdentifier;

export type DeactivateDidResponseBody = DIDResolutionResult;

export type ListDidsResponseBody = string[];

export type QueryDidResponseBody = DIDResolutionResult;

export type ResolveDidResponseBody = any;

// Negative

export type UnsuccessfulCreateDidResponseBody = UnsuccessfulResponseBody;

export type UnsuccessfulUpdateDidResponseBody = UnsuccessfulResponseBody;

export type UnsuccessfulDeactivateDidResponseBody = UnsuccessfulResponseBody | { deactivated: boolean };

export type UnsuccessfulGetDidResponseBody = UnsuccessfulQueryResponseBody;

export type UnsuccessfulResolveDidResponseBody = UnsuccessfulQueryResponseBody;
