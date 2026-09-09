/**
 * @openapi
 *
 * components:
 *   schemas:
 *     AlsoKnownAs:
 *       type: object
 *       properties:
 *         alsoKnownAs:
 *           type: array
 *           description: Optional field to assign a set of alternative URIs where the DID-Linked Resource can be fetched from.
 *           items:
 *             type: object
 *             properties:
 *               uri:
 *                 type: string
 *                 format: uri
 *                 description: URI where the DID-Linked Resource can be fetched from. Can be any type of URI (e.g., DID, HTTPS, IPFS, etc.)
 *               description:
 *                 type: string
 *                 description: Optional description of the URI.
 *     CredentialRequest:
 *       description: Input fields for the creating a Verifiable Credential.
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         issuerDid:
 *           description: DID of the Verifiable Credential issuer. This needs to be a `did:cheqd` DID.
 *           type: string
 *           example: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *         subjectDid:
 *           description: DID of the Verifiable Credential holder/subject. This needs to be a `did:key` DID.
 *           type: string
 *           example: did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
 *         attributes:
 *           description: JSON object containing the attributes to be included in the credential.
 *           type: object
 *           example: {
 *              name: Bob,
 *              gender: male
 *           }
 *         '@context':
 *           description: Optional properties to be included in the `@context` property of the credential.
 *           type: array
 *           items:
 *             type: string
 *           example: [https://schema.org/schema.jsonld, https://veramo.io/contexts/profile/v1]
 *         type:
 *           description: Optional properties to be included in the `type` property of the credential.
 *           type: array
 *           items:
 *             type: string
 *           example: [Person]
 *         expirationDate:
 *           description: Optional expiration date according to the <a href=https://www.w3.org/TR/vc-data-model/#expiration> VC Data Model specification</a>.
 *           type: string
 *           format: date-time
 *           example: 2023-06-08T13:49:28.000Z
 *         format:
 *           description: Format of the Verifiable Credential. Defaults to VC-JWT.
 *           type: string
 *           enum:
 *             - jwt
 *             - jsonld
 *           example: jwt
 *         credentialStatus:
 *           description: Optional `credentialStatus` properties for VC revocation or suspension. Takes `statusListName` and `statusListPurpose` as inputs.
 *           type: object
 *           required:
 *             - statusPurpose
 *             - statusListName
 *             - statusListType
 *           properties:
 *             statusPurpose:
 *               type: string
 *               enum:
 *                 - revocation
 *                 - suspension
 *             statusListName:
 *               type: string
 *             statusListType:
 *               type: string
 *               enum:
 *                 - StatusList2021
 *                 - BitstringStatusList
 *             statusListIndex:
 *               type: number
 *             statusListVersion:
 *               type: string
 *               format: date-time
 *             statusListRangeStart:
 *               type: number
 *             statusListRangeEnd:
 *               type: number
 *             indexNotIn:
 *               type: number
 *           example:
 *             statusPurpose: revocation
 *             statusListName: employee-credentials
 *             statusListType: StatusList2021
 *         termsOfUse:
 *           description: Terms of use can be utilized by an issuer or a holder to communicate the terms under which a verifiable credential was issued.
 *           type: array
 *           items:
 *              type: object
 *              example: {
 *                type: IssuerPolicy,
 *                id: http://example.com/policies/credential/4,
 *                profile: http://example.com/profiles/credential,
 *                prohibition: [{
 *                      assigner: https://example.edu/issuers/14,
 *                      assignee: AllVerifiers,
 *                      target: http://example.edu/credentials/3732,
 *                      action: [ "Archival" ]
 *                }]
 *              }
 *         refreshService:
 *           description: RefreshService property MUST be one or more refresh services that provides enough information to the recipient's software such that the recipient can refresh the verifiable credential.
 *           type: array
 *           items:
 *              type: object
 *              example: {
 *                type: ManualRefreshService2018,
 *                id: https://example.edu/refresh/3732
 *              }
 *         evidence:
 *           description: Evidence property MUST be one or more evidence schemes providing enough information for a verifier to determine whether the evidence gathered by the issuer meets its confidence requirements for relying on the credential.
 *           type: array
 *           items:
 *              type: object
 *              example: {
 *                type: ["DocumentVerification"],
 *                id: https://example.edu/evidence/f2aeec97-fc0d-42bf-8ca7-0548192d4231,
 *                verifier: "https://example.edu/issuers/14",
 *                evidenceDocument: DriversLicense,
 *                subjectPresence: Physical,
 *                documentPresence: Physical,
 *                licenseNumber: 123AB4567
 *              }
 *       connector:
 *         type: string
 *         enum:
 *           - verida
 *           - resource
 *       required:
 *         - issuerDid
 *         - subjectDid
 *         - attributes
 *       example:
 *         issuerDid: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *         subjectDid: did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
 *         attributes:
 *           gender: male
 *           name: Bob
 *         '@context':
 *           - https://schema.org
 *         type:
 *           - Person
 *         format: jwt
 *         credentialStatus:
 *           statusPurpose: revocation
 *           statusListName: employee-credentials
 *           statusListIndex: 10
 *           statusListType: StatusList2021
 *     Credential:
 *       description: Input fields for revoking/suspending a Verifiable Credential.
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         '@context':
 *           type: array
 *           items:
 *             type: string
 *           example: [https://www.w3.org/2018/credentials/v1, https://schema.org, https://veramo.io/contexts/profile/v1]
 *         type:
 *           type: array
 *           items:
 *             type: string
 *           example: [VerifiableCredential, Person]
 *         expirationDate:
 *           type: string
 *           format: date-time
 *           example: 2023-06-08T13:49:28.000Z
 *         issuer:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: DID
 *               example: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *         credentialSubject:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: DID
 *               example: did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
 *         credentialStatus:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: https://resolver.cheqd.net/1.0/identifiers/did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e?resourceName=cheqd-suspension-1&resourceType=StatusList2021Suspension#20
 *             statusListIndex:
 *               type: number
 *               example: 20
 *             statusPurpose:
 *               type: string
 *               enum:
 *                 - revocation
 *                 - suspension
 *               example: suspension
 *             type:
 *               type: string
 *               enum:
 *                 - StatusList2021Entry
 *                 - BitstringStatusListEntry
 *         issuanceDate:
 *           type: string
 *           format: date-time
 *           example: 2023-06-08T13:49:28.000Z
 *         proof:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *             jwt:
 *               type: string
 *           example: {
 *            type: JwtProof2020,
 *            jwt: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkaWQ6Y2hlcWQ6dGVzdG5ldDo3YmY4MWEyMC02MzNjLTRjYzctYmM0YS01YTQ1ODAxMDA1ZTAiLCJuYmYiOjE2ODYyMzIxNjgsInN1YiI6ImRpZDprZXk6ejZNa2hhWGdCWkR2b3REa0w1MjU3ZmFpenRpR2lDMlF0S0xHcGJubkVHdGEyZG9LIiwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiLCJodHRwczovL3NjaGVtYS5vcmciLCJodHRwczovL3ZlcmFtby5pby9jb250ZXh0cy9wcm9maWxlL3YxIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImdlbmRlciI6Im1hbGUiLCJuYW1lIjoiQm9iIn0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJQZXJzb24iXX19.wMfdR6RtyAZA4eoWya5Aw97wwER2Cm5Guk780Xw8H9fA3sfudIJeLRLboqixpTchqSbYeA7KbuCTAnLgXTD_Cg,
 *           }
 *       example:
 *         '@context':
 *           - https://www.w3.org/2018/credentials/v1
 *           - https://schema.org
 *           - https://veramo.io/contexts/profile/v1
 *         credentialSubject:
 *           gender: male
 *           id: did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
 *           name: Bob
 *         credentialStatus:
 *           id: https://resolver.cheqd.net/1.0/identifiers/did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e?resourceName=cheqd-suspension-1&resourceType=StatusList2021Suspension#20
 *           statusIndex: 20
 *           statusPurpose: suspension
 *           type: StatusList2021Entry
 *         issuanceDate: 2023-06-08T13:49:28.000Z
 *         issuer:
 *           id: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *         proof:
 *           jwt: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkaWQ6Y2hlcWQ6dGVzdG5ldDo3YmY4MWEyMC02MzNjLTRjYzctYmM0YS01YTQ1ODAxMDA1ZTAiLCJuYmYiOjE2ODYyMzIxNjgsInN1YiI6ImRpZDprZXk6ejZNa2hhWGdCWkR2b3REa0w1MjU3ZmFpenRpR2lDMlF0S0xHcGJubkVHdGEyZG9LIiwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiLCJodHRwczovL3NjaGVtYS5vcmciLCJodHRwczovL3ZlcmFtby5pby9jb250ZXh0cy9wcm9maWxlL3YxIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImdlbmRlciI6Im1hbGUiLCJuYW1lIjoiQm9iIn0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJQZXJzb24iXX19.wMfdR6RtyAZA4eoWya5Aw97wwER2Cm5Guk780Xw8H9fA3sfudIJeLRLboqixpTchqSbYeA7KbuCTAnLgXTD_Cg
 *           type: JwtProof2020
 *         type:
 *           - VerifiableCredential
 *           - Person
 *     VerifiableCredential:
 *       type: object
 *       required:
 *         - "@context"
 *         - type
 *         - issuer
 *         - issuanceDate
 *         - credentialSubject
 *       properties:
 *         "@context":
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *           description: JSON-LD context
 *         id:
 *           type: string
 *           description: Credential identifier
 *         type:
 *           type: array
 *           items:
 *             type: string
 *           description: Credential types
 *         issuer:
 *           oneOf:
 *             - type: string
 *             - type: object
 *               properties:
 *                 id:
 *                   type: string
 *           description: Credential issuer
 *         issuanceDate:
 *           type: string
 *           format: date-time
 *           description: Issuance date
 *         expirationDate:
 *           type: string
 *           format: date-time
 *           description: Expiration date
 *         credentialSubject:
 *           type: object
 *           additionalProperties: true
 *           description: Credential subject claims
 *         proof:
 *           type: object
 *           additionalProperties: true
 *           description: Cryptographic proof
 *         credentialStatus:
 *           type: object
 *           additionalProperties: true
 *           description: Credential status information
 *     IssuedCredentialResponse:
 *       type: object
 *       required:
 *         - issuedCredentialId
 *         - providerId
 *         - format
 *         - type
 *         - status
 *         - issuedAt
 *       properties:
 *         issuedCredentialId:
 *           type: string
 *           description: Unique identifier for the issued credential
 *         providerId:
 *           type: string
 *           description: Provider identifier
 *         providerCredentialId:
 *           type: string
 *           description: Provider-specific credential ID
 *         issuerId:
 *           type: string
 *           description: DID or identifier of the credential issuer
 *         subjectId:
 *           type: string
 *           description: DID or identifier of the credential subject
 *         format:
 *           type: string
 *           description: Credential format (e.g., jwt_vc, jsonld)
 *           example: jwt_vc
 *         category:
 *           type: string
 *           description: Credential category
 *           enum: [credential, accreditation]
 *         type:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of credential types
 *           example: ["VerifiableCredential"]
 *         status:
 *           type: string
 *           description: Current status of the credential
 *           enum: [active, revoked, suspended, expired]
 *         statusUpdatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when status was last updated
 *         issuedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when credential was issued
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when credential expires
 *         credentialStatus:
 *           type: object
 *           additionalProperties: true
 *           description: Credential status configuration
 *         statusRegistryId:
 *           type: string
 *           description: UUID of the Status Registry
 *         statusIndex:
 *           type: number
 *           description: Allocated Index of the Status Registry
 *         retryCount:
 *           type: number
 *           description: Retry Count in case of failures
 *         lastError:
 *           type: string
 *           description: Last error message in case of failure
 *         providerMetadata:
 *           type: object
 *           additionalProperties: true
 *           description: Provider-specific metadata
 *         credential:
 *           $ref: '#/components/schemas/VerifiableCredential'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when record was last updated
 *     ListCredentialResult:
 *       type: object
 *       properties:
 *          total:
 *            type: number
 *          credentials:
 *            type: array
 *            items:
 *              $ref: '#/components/schemas/IssuedCredentialResponse'
 *     CredentialRevokeRequest:
 *       type: object
 *       properties:
 *         credential:
 *           description: Verifiable Credential to be revoked as a VC-JWT string or a JSON object.
 *           oneOf:
 *             - type: object
 *             - type: string
 *         symmetricKey:
 *           description: The symmetric key used to encrypt the StatusList2021 DID-Linked Resource. Required if the StatusList2021 DID-Linked Resource is encrypted.
 *           type: string
 *     RevocationResult:
 *       properties:
 *         revoked:
 *           type: boolean
 *           example: true
 *     SuspensionResult:
 *       properties:
 *         suspended:
 *           type: boolean
 *           example: true
 *     UnsuspensionResult:
 *       properties:
 *         unsuspended:
 *           type: boolean
 *           example: true
 *     CredentialVerifyRequest:
 *       type: object
 *       properties:
 *         credential:
 *           description: Verifiable Credential to be verified as a VC-JWT string or a JSON object.
 *           type: object
 *         policies:
 *           description: Custom verification policies to execute when verifying credential.
 *           type: object
 *           properties:
 *             issuanceDate:
 *               description: Policy to skip the `issuanceDate` (`nbf`) timestamp check when set to `false`.
 *               type: boolean
 *               default: true
 *             expirationDate:
 *               description: Policy to skip the `expirationDate` (`exp`) timestamp check when set to `false`.
 *               type: boolean
 *               default: true
 *             audience:
 *               description: Policy to skip the audience check when set to `false`.
 *               type: boolean
 *               default: false
 *             checkExternalProvider:
 *               description: Policy to also check other providers when set to `true`.
 *               type: boolean
 *               default: false
 *     RetryCredentialRequest:
 *       type: object
 *       properties:
 *         attributes:
 *           description: JSON object containing the attributes to be included in the credential.
 *           type: object
 *           example: {
 *              name: Bob,
 *              gender: male
 *           }
 *         '@context':
 *           description: Optional properties to be included in the `@context` property of the credential.
 *           type: array
 *           items:
 *             type: string
 *           example: [https://schema.org/schema.jsonld, https://veramo.io/contexts/profile/v1]
 *         type:
 *           description: Optional properties to be included in the `type` property of the credential.
 *           type: array
 *           items:
 *             type: string
 *           example: [Person]
 *         expirationDate:
 *           description: Optional expiration date according to the <a href=https://www.w3.org/TR/vc-data-model/#expiration> VC Data Model specification</a>.
 *           type: string
 *           format: date-time
 *           example: 2023-06-08T13:49:28.000Z
 *         termsOfUse:
 *           description: Terms of use can be utilized by an issuer or a holder to communicate the terms under which a verifiable credential was issued.
 *           type: array
 *           items:
 *              type: object
 *              example: {
 *                type: IssuerPolicy,
 *                id: http://example.com/policies/credential/4,
 *                profile: http://example.com/profiles/credential,
 *                prohibition: [{
 *                      assigner: https://example.edu/issuers/14,
 *                      assignee: AllVerifiers,
 *                      target: http://example.edu/credentials/3732,
 *                      action: [ "Archival" ]
 *                }]
 *              }
 *         refreshService:
 *           description: RefreshService property MUST be one or more refresh services that provides enough information to the recipient's software such that the recipient can refresh the verifiable credential.
 *           type: array
 *           items:
 *              type: object
 *              example: {
 *                type: ManualRefreshService2018,
 *                id: https://example.edu/refresh/3732
 *              }
 *         evidence:
 *           description: Evidence property MUST be one or more evidence schemes providing enough information for a verifier to determine whether the evidence gathered by the issuer meets its confidence requirements for relying on the credential.
 *           type: array
 *           items:
 *              type: object
 *              example: {
 *                type: ["DocumentVerification"],
 *                id: https://example.edu/evidence/f2aeec97-fc0d-42bf-8ca7-0548192d4231,
 *                verifier: "https://example.edu/issuers/14",
 *                evidenceDocument: DriversLicense,
 *                subjectPresence: Physical,
 *                documentPresence: Physical,
 *                licenseNumber: 123AB4567
 *              }
 *       required:
 *         - attributes
 *     VerifyPresentationResult:
 *       type: object
 *       properties:
 *         verified:
 *           type: boolean
 *         issuer:
 *           type: string
 *         signer:
 *           type: object
 *         jwt:
 *           type: string
 *         verifiableCredential:
 *           type: object
 *     VerifyCredentialResult:
 *       type: object
 *       properties:
 *         verified:
 *           type: boolean
 *         issuer:
 *           type: string
 *         signer:
 *           type: object
 *         jwt:
 *           type: string
 *         verifiableCredential:
 *           type: object
 *       example:
 *         verified: true
 *         polices: {}
 *         issuer: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *         signer:
 *           controller: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *           id: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0#key-1
 *           publicKeyBase58: BTJiso1S4iSiReP6wGksSneGfiKHxz9SYcm2KknpqBJt
 *           type: Ed25519VerificationKey2018
 *     AccreditationVerifyResponse:
 *       type: object
 *       properties:
 *         verified:
 *           type: boolean
 *         issuer:
 *           type: string
 *         signer:
 *           type: object
 *         jwt:
 *           type: string
 *         verifiableCredential:
 *           type: object
 *         accreditorDids:
 *           type: array
 *           items:
 *              type: string
 *         rootAuthorization:
 *           type: object
 *         termsOfUse:
 *          type: object
 *          properties:
 *           type:
 *             type: string
 *           trustFrameworkId:
 *              type: string
 *           trustFramework:
 *             type: string
 *     AccreditationIssueRequest:
 *       description: Input fields for the creating a Verifiable Accreditation.
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         issuerDid:
 *           description: DID of the Verifiable Accreditation issuer. This needs to be a `did:cheqd` DID.
 *           type: string
 *           example: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *         subjectDid:
 *           description: DID of the Verifiable Accreditation holder/subject. This needs to be a `did:cheqd` DID.
 *           type: string
 *           example: did:cheqd:testnet:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
 *         schemas:
 *            description: The list of schemas the subject DID is accredited for.
 *            type: array
 *            items:
 *              $ref: '#/components/schemas/SchemaUrl'
 *         accreditationName:
 *           description: Unique name of the Verifiable Accreditation.
 *           type: string
 *         attributes:
 *           description: JSON object containing the attributes to be included in the Accreditation.
 *           type: object
 *         '@context':
 *           description: Optional properties to be included in the `@context` property of the Accreditation.
 *           type: array
 *           items:
 *             type: string
 *           example: [https://schema.org/schema.jsonld, https://veramo.io/contexts/profile/v1]
 *         parentAccreditation:
 *           description: DID URL of the parent Verifiable Accreditation, required for accredit/attest operation.
 *           type: string
 *         rootAuthorization:
 *           description: DID URL of the root Verifiable Accreditation, required for accredit/attest operation.
 *           type: string
 *         trustFramework:
 *           description: Name or Type of the Trust Framework, required for authorize operation.
 *           type: string
 *         trustFrameworkId:
 *           description: Url of the Trust Framework, required for authorize operation.
 *           type: string
 *         type:
 *           description: Optional properties to be included in the `type` property of the Accreditation.
 *           type: array
 *           items:
 *             type: string
 *           example: [Person]
 *         expirationDate:
 *           description: Optional expiration date according to the <a href=https://www.w3.org/TR/vc-data-model/#expiration> VC Data Model specification</a>.
 *           type: string
 *           format: date-time
 *           example: 2023-06-08T13:49:28.000Z
 *         format:
 *           description: Format of the Verifiable Accreditation. Defaults to VC-JWT.
 *           type: string
 *           enum:
 *             - jwt
 *             - jsonld
 *           example: jwt
 *         credentialStatus:
 *           description: Optional `credentialStatus` properties for VC revocation or suspension. Takes `statusListName` and `statusListPurpose` as inputs.
 *           type: object
 *           required:
 *             - statusPurpose
 *             - statusListName
 *           properties:
 *             statusPurpose:
 *               type: string
 *               enum:
 *                 - revocation
 *                 - suspension
 *             statusListName:
 *               type: string
 *             statusListIndex:
 *               type: number
 *             statusListVersion:
 *               type: string
 *               format: date-time
 *             statusListRangeStart:
 *               type: number
 *             statusListRangeEnd:
 *               type: number
 *             indexNotIn:
 *               type: number
 *           example:
 *             statusPurpose: revocation
 *             statusListName: employee-credentials
 *         termsOfUse:
 *           description: Terms of use can be utilized by an issuer or a holder to communicate the terms under which a verifiable credential was issued.
 *           type: array
 *           items:
 *              type: object
 *              example: {
 *                type: IssuerPolicy,
 *                id: http://example.com/policies/credential/4,
 *                profile: http://example.com/profiles/credential,
 *                prohibition: [{
 *                      assigner: https://example.edu/issuers/14,
 *                      assignee: AllVerifiers,
 *                      target: http://example.edu/credentials/3732,
 *                      action: [ "Archival" ]
 *                }]
 *              }
 *         refreshService:
 *           description: RefreshService property MUST be one or more refresh services that provides enough information to the recipient's software such that the recipient can refresh the verifiable credential.
 *           type: array
 *           items:
 *              type: object
 *              example: {
 *                type: ManualRefreshService2018,
 *                id: https://example.edu/refresh/3732
 *              }
 *         evidence:
 *           description: Evidence property MUST be one or more evidence schemes providing enough information for a verifier to determine whether the evidence gathered by the issuer meets its confidence requirements for relying on the credential.
 *           type: array
 *           items:
 *              type: object
 *              example: {
 *                type: ["DocumentVerification"],
 *                id: https://example.edu/evidence/f2aeec97-fc0d-42bf-8ca7-0548192d4231,
 *                verifier: "https://example.edu/issuers/14",
 *                evidenceDocument: DriversLicense,
 *                subjectPresence: Physical,
 *                documentPresence: Physical,
 *                licenseNumber: 123AB4567
 *              }
 *       required:
 *         - issuerDid
 *         - subjectDid
 *         - schemas
 *         - accreditationName
 *       example:
 *         issuerDid: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *         subjectDid: did:cheqd:testnet:2582fe17-9b25-45e4-8104-1cfca430f0c3
 *         schemas:
 *           - type: MuseumPassCredential
 *             url: https://resolver.cheqd.net/1.0/identifiers/did:cheqd:testnet:0a5b94d0-a417-48ed-a6f5-4abc9e95888d?resourceName=MuseumPassCredentialSchema&resourceType=JsonSchemaValidator2018
 *         format: jwt
 *         accreditationName: authorizeAccreditation
 *         trustFramework: https://learn.cheqd.io/governance/start
 *         trustFrameworkId: cheqd Governance Framework
 *         parentAccreditation: did:cheqd:testnet:15b74787-6e48-4fd5-8020-eab24e990578?resourceName=accreditAccreditation&resourceType=VerifiableAccreditationToAccredit
 *         rootAuthorization: did:cheqd:testnet:5RpEg66jhhbmASWPXJRWrA?resourceName=authorizeAccreditation&resourceType=VerifiableAuthorizationForTrustChain
 *         credentialStatus:
 *           statusPurpose: revocation
 *           statusListName: employee-credentials
 *           statusListIndex: 10
 *     AccreditationVerifyRequest:
 *       type: object
 *       properties:
 *         subjectDid:
 *           description: DID of the Verifiable  Accreditation holder/subject. This needs to be a `did:key` DID.
 *           type: string
 *           example: did:cheqd:testnet:5efa5126-c070-420f-a9c2-d22ae6eefb92
 *         didUrl:
 *           description: DID URL of the Verifiable Accreditation to be verified as a VC-JWT string or a JSON object.
 *           type: string
 *           example: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e?resourceName=cheqd-issuer-logo&resourceType=CredentialArtwork
 *         did:
 *           description: DID of the Verifiable Accreditation holder/subject
 *           type: string
 *           example: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e
 *         resourceId:
 *           description: Unique resource identifier of the Verifiable Accreditation
 *           type: string
 *           example: 398cee0a-efac-4643-9f4c-74c48c72a14b
 *         resourceName:
 *           description: Resource name of the Verifiable Accreditation
 *           type: string
 *           example: cheqd-issuer-logo
 *         resourceType:
 *           description: Resource type of the Verifiable Accreditation
 *           type: string
 *           example: CredentialArtwork
 *         schemas:
 *            description: The list of schemas the subject DID is accredited for.
 *            type: array
 *            items:
 *              $ref: '#/components/schemas/SchemaUrl'
 *         policies:
 *           description: Custom verification policies to execute when verifying  Accreditation.
 *           type: object
 *           properties:
 *             issuanceDate:
 *               description: Policy to skip the `issuanceDate` (`nbf`) timestamp check when set to `false`.
 *               type: boolean
 *               default: true
 *             expirationDate:
 *               description: Policy to skip the `expirationDate` (`exp`) timestamp check when set to `false`.
 *               type: boolean
 *               default: true
 *             audience:
 *               description: Policy to skip the audience check when set to `false`.
 *               type: boolean
 *               default: false
 *       required:
 *         - subjectDid
 *     AccreditationRevokeRequest:
 *       type: object
 *       properties:
 *         didUrl:
 *           description: Verifiable  Accreditation to be verified as a VC-JWT string or a JSON object.
 *           type: string
 *           example: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e?resourceName=cheqd-issuer-logo&resourceType=CredentialArtwork
 *         did:
 *           type: string
 *           example: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e
 *         resourceId:
 *           type: string
 *           example: 398cee0a-efac-4643-9f4c-74c48c72a14b
 *         resourceName:
 *           type: string
 *           example: cheqd-issuer-logo
 *         resourceType:
 *           type: string
 *           example: CredentialArtwork
 *         symmetricKey:
 *           description: The symmetric key used to encrypt the StatusList2021 DID-Linked Resource. Required if the StatusList2021 DID-Linked Resource is encrypted.
 *           type: string
 *     PresentationCreateRequest:
 *       type: object
 *       required:
 *         - credentials
 *       properties:
 *         credentials:
 *           description: Verifiable Credentials to be used for VP-JWT creation as a VP-JWT strings or a JSON objectsf.
 *           type: array
 *           items:
 *             type: object
 *         holderDid:
 *           description: DID of holder
 *           type: string
 *         verifierDid:
 *           description: DID of verifier
 *           type: string
 *     PresentationVerifyRequest:
 *       type: object
 *       required:
 *         - presentation
 *       properties:
 *         presentation:
 *           description: Verifiable Presentation to be verified as a VP-JWT string or a JSON object.
 *           type: object
 *         verifierDid:
 *           description: Provide an optional verifier DID (also known as 'domain' parameter), if the verifier DID in the presentation is not managed in the wallet.
 *           type: string
 *         makeFeePayment:
 *           description: Automatically make fee payment (if required) based on payment conditions to unlock encrypted StatusList2021 or BitstringStatusList DID-Linked Resource.
 *           type: boolean
 *           default: false
 *         policies:
 *           description: Custom verification policies to execute when verifying presentation.
 *           type: object
 *           properties:
 *             issuanceDate:
 *               description: Policy to skip the `issuanceDate` (`nbf`) timestamp check when set to `false`.
 *               type: boolean
 *               default: true
 *             expirationDate:
 *               description: Policy to skip the `expirationDate` (`exp`) timestamp check when set to `false`.
 *               type: boolean
 *               default: true
 *             audience:
 *               description: Policy to skip the audience check when set to `false`.
 *               type: boolean
 *               default: false
 *     CredentialStatusRecordResult:
 *       type: object
 *       properties:
 *         statusListId:
 *           type: string
 *           description: Unique identifier for the status registry
 *         statusListName:
 *           type: string
 *           description: Name of the status list resource
 *         uri:
 *           type: string
 *           description: DID URL of the status list resource
 *         issuerId:
 *           type: string
 *           format: uri
 *           description: DID of the issuer
 *         previousUri:
 *           type: string
 *           nullable: true
 *           description: Link to previous registry in the chain (for FULL registries)
 *         nextUri:
 *           type: string
 *           nullable: true
 *           description: Link to next registry in the chain (STANDBY registry)
 *         listType:
 *           type: string
 *           description: Type of status list (StatusList2021Revocation, StatusList2021Suspension, BitstringStatusListCredential)
 *         storageType:
 *           type: string
 *           enum:
 *             - cheqd
 *             - ipfs
 *             - dock
 *             - paradym
 *           description: Storage provider for the status list
 *         encrypted:
 *           type: boolean
 *           description: Whether the status list is encrypted
 *         credentialCategory:
 *           type: string
 *           enum:
 *             - credential
 *             - accreditation
 *           description: Category of credentials this status list is for
 *         size:
 *           type: integer
 *           description: Maximum capacity of the status list (total number of indices)
 *         writeCursor:
 *           type: integer
 *           description: Current write cursor position (last assigned index)
 *         state:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - STANDBY
 *             - FULL
 *           description: Current state of the registry
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the registry was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the registry was last updated
 *         sealedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp when the registry was sealed (marked as FULL)
 *         statusPurpose:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *           description: Status purpose or list of status purposes
 *         deprecated:
 *           type: boolean
 *           description: Whether the registry is deprecated
 *       example:
 *         statusListId: 5945233a-a4b5-422b-b893-eaed5cedd2dc
 *         statusListName: cheqd-employee-credentials
 *         uri: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e?resourceName=cheqd-employee-credentials&resourceType=StatusList2021Revocation
 *         issuerId: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e
 *         previousUri: null
 *         nextUri: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e?resourceName=cheqd-employee-credentials-ext1&resourceType=StatusList2021Revocation
 *         listType: StatusList2021Revocation
 *         storageType: cheqd
 *         encrypted: false
 *         credentialCategory: credential
 *         size: 131072
 *         writeCursor: 105432
 *         state: ACTIVE
 *         createdAt: 2023-06-26T11:45:19.349Z
 *         updatedAt: 2023-06-26T11:45:20.000Z
 *         statusPurpose: ["revocation"]
 *         sealedAt: null
 *         deprecated: false
 *     ListCredentialStatusRecordsResult:
 *      type: object
 *      properties:
 *          total:
 *              type: number
 *          records:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/CredentialStatusRecordResult'
 *      example:
 *         total: 1
 *         records:
 *           - statusListId: 5945233a-a4b5-422b-b893-eaed5cedd2dc
 *             statusListName: cheqd-employee-credentials
 *             uri: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e?resourceName=cheqd-employee-credentials&resourceType=StatusList2021Revocation
 *             issuerId: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e
 *             previousUri: null
 *             nextUri: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e?resourceName=cheqd-employee-credentials-ext1&resourceType=StatusList2021Revocation
 *             listType: StatusList2021Revocation
 *             storageType: cheqd
 *             encrypted: false
 *             credentialCategory: credential
 *             size: 131072
 *             writeCursor: 105432
 *             state: ACTIVE
 *             createdAt: 2023-06-26T11:45:19.349Z
 *             updatedAt: 2023-06-26T11:45:20.000Z
 *             sealedAt: null
 *             deprecated: false
 *     CredentialStatusCreateBody:
 *       allOf:
 *         - type: object
 *           required:
 *             - did
 *             - statusListName
 *           properties:
 *             did:
 *               description: DID of the StatusList2021 or BitstringStatusList publisher.
 *               type: string
 *               format: uri
 *             statusListName:
 *               description: The name of the StatusList2021 or BitstringStatusList DID-Linked Resource to be created.
 *               type: string
 *             length:
 *               description: The length of the status list to be created. The default and minimum length is 131072 which is 16kb.
 *               type: integer
 *               minimum: 0
 *               exclusiveMinimum: true
 *               default: 131072
 *             encoding:
 *               description: The encoding format of the StatusList2021 or BitstringStatusList (only base64url supported) DiD-Linked Resource to be created.
 *               type: string
 *               default: base64url
 *               enum:
 *                 - base64url
 *                 - hex
 *             statusListVersion:
 *               description: Optional field to assign a human-readable version in the StatusList2021 or BitstringStatusList DID-Linked Resource.
 *               type: string
 *             statusSize:
 *               description: "Only for BitstringStatusList: bits per credential, used to support multiple status in same list."
 *               type: integer
 *               minimum: 1
 *             credentialCategory:
 *               description: Category of credentials this status list is for.
 *               type: string
 *               enum:
 *                  - credential
 *                  - accreditation
 *             statusMessages:
 *               description: "Only for BitstringStatusList (Mandatory if statusSize > 1): Message explaining each bit"
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     example: "0x0"
 *                   message:
 *                     type: string
 *                     example: valid
 *             ttl:
 *               description: "Only for BitstringStatusList: Time to Live in Miliseconds (not expiry)."
 *               type: integer
 *               minimum: 1000
 *         - $ref: '#/components/schemas/AlsoKnownAs'
 *     CredentialStatusCreateUnencryptedRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/CredentialStatusCreateBody'
 *       example:
 *         did: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e
 *         statusListName: cheqd-employee-credentials
 *         length: 140000
 *         encoding: base64url
 *     CredentialStatusUnencryptedResult:
 *       type: object
 *       properties:
 *         resource:
 *           type: object
 *           properties:
 *             StatusList2021:
 *               type: object
 *               properties:
 *                 encodedList:
 *                   type: string
 *                   example: H4sIAAAAAAAAA-3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAADwaDhDr_xcRAAA
 *                 type:
 *                   type: string
 *                   example: StatusList2021Revocation
 *                 validFrom:
 *                   type: string
 *                   format: date-time
 *                   example: 2023-06-26T11:45:19.349Z
 *             metadata:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: StatusList2021Revocation
 *                 encoding:
 *                   type: string
 *                   example: base64url
 *                 encrypted:
 *                   type: boolean
 *                   example: false
 *         resourceMetadata:
 *           type: object
 *           example:
 *             resourceURI: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e/resources/5945233a-a4b5-422b-b893-eaed5cedd2dc
 *             resourceCollectionId: 7c2b990c-3d05-4ebf-91af-f4f4d0091d2e
 *             resourceId: 5945233a-a4b5-422b-b893-eaed5cedd2dc
 *             resourceName: cheqd-employee-credentials
 *             resourceType: StatusList2021Revocation
 *             mediaType: application/json
 *             resourceVersion: 1.0.0
 *             created: 2023-06-26T11:45:20Z
 *             checksum: 909e22e371a41afbb96c330a97752cf7c8856088f1f937f87decbef06cbe9ca2
 *             previousVersionId: null
 *             nextVersionId: null
 *     CredentialStatusCreateUnencryptedResult:
 *       allOf:
 *         - type: object
 *           properties:
 *             created:
 *               type: boolean
 *               example: true
 *         - $ref: '#/components/schemas/CredentialStatusUnencryptedResult'
 *     CredentialStatusEncryptedPaymentConditionsBody:
 *       type: object
 *       properties:
 *         feePaymentAddress:
 *           description: The cheqd/Cosmos payment address where payments to unlock the encrypted StatusList2021 or BitstringStatusList DID-Linked Resource need to be sent.
 *           type: string
 *           example: cheqd1qs0nhyk868c246defezhz5eymlt0dmajna2csg
 *         feePaymentAmount:
 *           description: Amount in CHEQ tokens to unlock the encrypted StatusList2021 or BitstringStatusList DID-Linked Resource.
 *           type: number
 *           minimum: 0
 *           exclusiveMinimum: true
 *           default: 20
 *         feePaymentWindow:
 *           description: Time window (in minutes) within which the payment to unlock the encrypted StatusList2021 or BitstringStatusList DID-Linked Resource is considered valid.
 *           type: number
 *           minimum: 0
 *           exclusiveMinimum: true
 *           default: 10
 *     CredentialStatusEncryptedPaymentConditionsJson:
 *       type: object
 *       properties:
 *         paymentConditions:
 *           allOf:
 *            - $ref: '#/components/schemas/CredentialStatusEncryptedPaymentConditionsBody'
 *     CredentialStatusCreateEncryptedFormRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/CredentialStatusCreateBody'
 *         - $ref: '#/components/schemas/CredentialStatusEncryptedPaymentConditionsBody'
 *         - type: object
 *           required:
 *             - feePaymentAddress
 *             - feePaymentAmount
 *             - feePaymentWindow
 *     CredentialStatusCreateEncryptedJsonRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/CredentialStatusCreateBody'
 *         - $ref: '#/components/schemas/CredentialStatusEncryptedPaymentConditionsJson'
 *         - type: object
 *           required:
 *             - paymentConditions
 *       example:
 *         did: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e
 *         statusListName: cheqd-employee-credentials-encrypted
 *         paymentConditions:
 *           - feePaymentAddress: cheqd1qs0nhyk868c246defezhz5eymlt0dmajna2csg
 *             feePaymentAmount: 20
 *             feePaymentWindow: 10
 *     CredentialStatusEncryptedResult:
 *       type: object
 *       properties:
 *         resource:
 *           type: object
 *           properties:
 *             StatusList2021:
 *               type: object
 *               properties:
 *                 encodedList:
 *                   type: string
 *                   example: 496fdfbeb745b4db03fcdb40566f9c4c4a1c0f184b31255e641b6e7bdfb9b6946c12be87ca3763be0393c00b67ac1e8737c106b32f46ef59c765754415b5e8cc7c65fccaa3374620430ea476301a5e0dd63340e7a27a68bc627518471f22e4a2
 *                 type:
 *                   type: string
 *                   example: StatusList2021Revocation
 *                 validFrom:
 *                   type: string
 *                   format: date-time
 *                   example: 2023-06-26T11:45:19.349Z
 *             metadata:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: StatusList2021Revocation
 *                 encoding:
 *                   type: string
 *                   example: base64url
 *                 encrypted:
 *                   type: boolean
 *                   example: true
 *                 encryptedSymmetricKey:
 *                   type: string
 *                   example: b11182dc524b8181f9a6aef4c4ad0a1c14e40033b9112dffd8d1bcf6cc3b85abc07ded2205ee94068a99f4202502cb0855f322583fa6ce1534d3a05bf36891766ea2c5f90a982b3040680762977d404d758a2370224a239c8279aa7d21e980931c42055b17ca4c7dbffa4782480a8b6279cf989b2f166d5fdb4b2c1b5a63927200000000000000203018dcaba26df45a415bb599218b27ca853a70289d7a3ed3ed0e3730452e8f8d9af91b6e71312565d2c069341f6660ab
 *                 paymentConditions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       feePaymentAddress:
 *                         type: string
 *                         example: cheqd1qs0nhyk868c246defezhz5eymlt0dmajna2csg
 *                       feePaymentAmount:
 *                         type: string
 *                         example: 20000000000ncheq
 *                       intervalInSeconds:
 *                         type: number
 *                         example: 600
 *                       type:
 *                         type: string
 *                         example: timelockPayment
 *             resourceMetadata:
 *               type: object
 *               example:
 *                 resourceURI: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e/resources/5945233a-a4b5-422b-b893-eaed5cedd2dc
 *                 resourceCollectionId: 7c2b990c-3d05-4ebf-91af-f4f4d0091d2e
 *                 resourceId: 5945233a-a4b5-422b-b893-eaed5cedd2dc
 *                 resourceName: cheqd-revocation-encrypted-1
 *                 resourceType: StatusList2021Revocation
 *                 mediaType: application/json
 *                 resourceVersion: 2023-06-26T11:45:19.349Z
 *                 created: 2023-06-26T11:45:20Z
 *                 checksum: 909e22e371a41afbb96c330a97752cf7c8856088f1f937f87decbef06cbe9ca2
 *                 previousVersionId: null
 *                 nextVersionId: null
 *             symmetricKey:
 *               type: string
 *               example: dfe204ee95ae74ea5d74b94c3d8ff782273905b07fbc9f8c3d961c3b43849f18
 *     CredentialStatusCreateEncryptedResult:
 *       allOf:
 *         - type: object
 *           properties:
 *             created:
 *               type: boolean
 *               example: true
 *         - $ref: '#/components/schemas/CredentialStatusEncryptedResult'
 *     CredentialStatusUpdateBody:
 *       type: object
 *       required:
 *         - did
 *         - statusListName
 *         - indices
 *       properties:
 *         did:
 *           description: DID of the StatusList2021 publisher.
 *           type: string
 *           format: uri
 *         statusListName:
 *           description: The name of the StatusList2021 DID-Linked Resource to be updated.
 *           type: string
 *         indices:
 *           description: List of credential status indices to be updated. The indices must be in the range of the status list.
 *           type: array
 *           items:
 *             type: integer
 *             minimum: 0
 *             exclusiveMinimum: false
 *         statusListVersion:
 *           description: Optional field to assign a human-readable version in the StatusList2021 DID-Linked Resource.
 *           type: string
 *     CredentialStatusUpdateUnencryptedRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/CredentialStatusUpdateBody'
 *       example:
 *         did: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e
 *         statusListName: cheqd-employee-credentials
 *         indices:
 *           - 10
 *           - 3199
 *           - 12109
 *           - 130999
 *     CredentialStatusUpdateUnencryptedResult:
 *       allOf:
 *         - type: object
 *           properties:
 *             updated:
 *               type: boolean
 *               example: true
 *         - oneOf:
 *           - $ref: '#/components/schemas/RevocationResult'
 *           - $ref: '#/components/schemas/SuspensionResult'
 *           - $ref: '#/components/schemas/UnsuspensionResult'
 *         - $ref: '#/components/schemas/CredentialStatusUnencryptedResult'
 *     CredentialStatusUpdateEncryptedFormRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/CredentialStatusUpdateBody'
 *         - type: object
 *           required:
 *             - symmetricKey
 *           properties:
 *             symmetricKey:
 *               description: The symmetric key used to encrypt the StatusList2021 DID-Linked Resource.
 *               type: string
 *         - $ref: '#/components/schemas/CredentialStatusEncryptedPaymentConditionsBody'
 *     CredentialStatusUpdateEncryptedJsonRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/CredentialStatusUpdateBody'
 *         - type: object
 *           required:
 *             - symmetricKey
 *           properties:
 *             symmetricKey:
 *               description: The symmetric key used to encrypt the StatusList2021 DID-Linked Resource.
 *               type: string
 *         - $ref: '#/components/schemas/CredentialStatusEncryptedPaymentConditionsJson'
 *       example:
 *         did: did:cheqd:testnet:7c2b990c-3d05-4ebf-91af-f4f4d0091d2e
 *         statusListName: cheqd-employee-credentials-encrypted
 *         indices:
 *           - 10
 *           - 3199
 *           - 12109
 *           - 130999
 *         symmetricKey: dfe204ee95ae74ea5d74b94c3d8ff782273905b07fbc9f8c3d961c3b43849f18
 *     CredentialStatusUpdateEncryptedResult:
 *       allOf:
 *         - type: object
 *           properties:
 *             updated:
 *               type: boolean
 *               example: true
 *         - oneOf:
 *           - $ref: '#/components/schemas/RevocationResult'
 *           - $ref: '#/components/schemas/SuspensionResult'
 *           - $ref: '#/components/schemas/UnsuspensionResult'
 *         - $ref: '#/components/schemas/CredentialStatusEncryptedResult'
 *     CredentialStatusCheckRequest:
 *       type: object
 *       required:
 *         - did
 *         - statusListName
 *       properties:
 *         did:
 *           description: DID of the StatusList2021 publisher.
 *           type: string
 *           format: uri
 *         statusListName:
 *           description: The name of the StatusList2021 DID-Linked Resource to be checked.
 *           type: string
 *         index:
 *           description: Credential status index to be checked for revocation or suspension.
 *           type: integer
 *           minimum: 0
 *           exclusiveMinimum: false
 *         indices:
 *           description: List of credential status indices to be checked for revocation or suspension.
 *           type: array
 *           items:
 *            type: integer
 *         indexRangeStart:
 *           description: Start of the credential status index range to be checked for revocation or suspension.
 *           type: integer
 *         indexRangeEnd:
 *          description: End of the credential status index range to be checked for revocation or suspension.
 *          type: integer
 *         statusListCredential:
 *           description: Optional Resolvable DID URL of the BitstringStatusList credential to be checked.
 *           type: string
 *         statusSize:
 *           description: Optional size of the BitstringStatusList.
 *           type: number
 *           default: 2
 *         statusMessage:
 *           description: Array of status messages for each bit in the BitstringStatusList.
 *           type: array
 *         makeFeePayment:
 *           description: Automatically make fee payment (if required) based on payment conditions to unlock encrypted StatusList2021 or BitstringStatusList DID-Linked Resource.
 *           type: boolean
 *           default: true
 *     CredentialStatusCheckResult:
 *       oneOf:
 *       - $ref: '#/components/schemas/CredentialStatusCheckRevocationResult'
 *       - $ref: '#/components/schemas/CredentialStatusCheckSuspensionResult'
 *     CredentialStatusCheckRevocationResult:
 *       type: object
 *       properties:
 *         checked:
 *           type: boolean
 *           example: true
 *         revoked:
 *           type: boolean
 *           example: false
 *     CredentialStatusCheckSuspensionResult:
 *       type: object
 *       properties:
 *         checked:
 *           type: boolean
 *           example: true
 *         suspended:
 *           type: boolean
 *           example: false
 *     CredentialStatusListSearchResult:
 *       allOf:
 *         - type: object
 *           properties:
 *             found:
 *               type: boolean
 *               example: true
 *         - oneOf:
 *           - $ref: '#/components/schemas/CredentialStatusUnencryptedResult'
 *           - $ref: '#/components/schemas/CredentialStatusEncryptedResult'
 *     KeyImportRequest:
 *       type: object
 *       properties:
 *         alias:
 *           type: string
 *         type:
 *           type: string
 *           enum: [ Ed25519, Secp256k1 ]
 *         privateKeyHex:
 *           type: string
 *     KeyResult:
 *       type: object
 *       properties:
 *         kid:
 *           type: string
 *         type:
 *           type: string
 *           enum: [ Ed25519, Secp256k1 ]
 *         publicKeyHex:
 *           type: string
 *     DidDocument:
 *       description: This input field contains either a complete DID document, or an incremental change (diff) to a DID document. See <a href="https://identity.foundation/did-registration/#diddocument">Universal DID Registrar specification</a>.
 *       type: object
 *       properties:
 *         '@context':
 *           type: array
 *           items:
 *             type: string
 *         id:
 *          type: string
 *         controllers:
 *           type: array
 *           items:
 *             type: string
 *         verificationMethod:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VerificationMethod'
 *         service:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Service'
 *         authentication:
 *           type: array
 *           items:
 *             type: string
 *         assertionMethod:
 *           type: array
 *           items:
 *             type: string
 *         capabilityInvocation:
 *           type: array
 *           items:
 *             type: string
 *         capabilityDelegation:
 *           type: array
 *           items:
 *             type: string
 *         keyAgreement:
 *           type: array
 *           items:
 *             type: string
 *       example:
 *         '@context':
 *           - https://www.w3.org/ns/did/v1
 *         id: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *         controller:
 *           - did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *         verificationMethod:
 *           - id: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0#key-1
 *             type: Ed25519VerificationKey2018
 *             controller: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *             publicKeyBase58: z6MkkVbyHJLLjdjU5B62DaJ4mkdMdUkttf9UqySSkA9bVTeZ
 *         authentication:
 *           - did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0#key-1
 *         service:
 *           - id: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0#service-1
 *             type: LinkedDomains
 *             serviceEndpoint:
 *               - https://example.com
 *     DidDocumentWithoutVerificationMethod:
 *       type: object
 *       properties:
 *         '@context':
 *           type: array
 *           items:
 *             type: string
 *         id:
 *          type: string
 *         controllers:
 *           type: array
 *           items:
 *             type: string
 *         service:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Service'
 *         authentication:
 *           type: array
 *           items:
 *             type: string
 *         assertionMethod:
 *           type: array
 *           items:
 *             type: string
 *         capabilityInvocation:
 *           type: array
 *           items:
 *             type: string
 *         capabilityDelegation:
 *           type: array
 *           items:
 *             type: string
 *         keyAgreement:
 *           type: array
 *           items:
 *             type: string
 *       example:
 *         '@context':
 *           - https://www.w3.org/ns/did/v1
 *         id: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *         controller:
 *           - did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *         authentication:
 *           - did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0#key-1
 *         service:
 *           - id: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0#service-1
 *             type: LinkedDomains
 *             serviceEndpoint:
 *               - https://example.com
 *     DidCreateRequestFormBased:
 *       type: object
 *       properties:
 *         network:
 *           description: Network to create the DID on (testnet or mainnet)
 *           type: string
 *           enum:
 *             - testnet
 *             - mainnet
 *         providerId:
 *           description: Identity Provider to create the DID
 *           type: string
 *           required: false
 *         identifierFormatType:
 *           description: Algorithm to use for generating the method-specific ID. The two styles supported are UUIDs and Indy-style Base58. See <a href="https://docs.cheqd.io/identity/architecture/adr-list/adr-001-cheqd-did-method#cheqd-did-method-did-cheqd">cheqd DID method documentation</a> for more details.
 *           type: string
 *           enum:
 *             - uuid
 *             - base58btc
 *         verificationMethodType:
 *           description: Type of verification method to use for the DID. See <a href="https://www.w3.org/TR/did-core/#verification-methods">DID Core specification</a> for more details. Only the types listed below are supported.
 *           type: string
 *           enum:
 *             - Ed25519VerificationKey2018
 *             - JsonWebKey2020
 *             - Ed25519VerificationKey2020
 *         service:
 *           description: It's a list of special objects which are designed to build the actual service. It's almost the same as in <a href="https://www.w3.org/TR/did-core/#services">DID Core specification</a>, but instead of `id` it utilises `idFragment` field for making the right `id` for each service. !!! WARN. Cause swagger-ui does not handle x-ww-form based arrays correctly, please frame all your services in brackets while using swagger UI. !!!
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               idFragment:
 *                 type: string
 *               type:
 *                 type: string
 *               serviceEndpoint:
 *                 type: array
 *                 items:
 *                   type: string
 *           example:
 *             - idFragment: service-1
 *               type: LinkedDomains
 *               serviceEndpoint: [
 *                 https://example.com
 *               ]
 *
 *         key:
 *           description: The unique identifier in hexadecimal public key format used in the verification method to create the DID.
 *           type: string
 *         '@context':
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - https://www.w3.org/ns/did/v1
 *
 *     DidCreateRequestJson:
 *       type: object
 *       properties:
 *         network:
 *           description: Network to create the DID on (testnet or mainnet)
 *           type: string
 *           enum:
 *             - testnet
 *             - mainnet
 *         providerId:
 *           description: Identity Provider to create the DID
 *           type: string
 *           required: false
 *         identifierFormatType:
 *           description: Algorithm to use for generating the method-specific ID. The two styles supported are UUIDs and Indy-style Base58. See <a href="https://docs.cheqd.io/identity/architecture/adr-list/adr-001-cheqd-did-method#cheqd-did-method-did-cheqd">cheqd DID method documentation</a> for more details.
 *           type: string
 *           enum:
 *             - uuid
 *             - base58btc
 *         options:
 *           type: object
 *           properties:
 *             key:
 *               type: string
 *               example: 8255ddadd75695e01f3d98fcec8ccc7861a030b317d4326b0e48a4d579ddc43a
 *             verificationMethodType:
 *               description: Type of verification method to use for the DID. See <a href="https://www.w3.org/TR/did-core/#verification-methods">DID Core specification</a> for more details. Only the types listed below are supported.
 *               type: string
 *               enum:
 *                 - Ed25519VerificationKey2018
 *                 - JsonWebKey2020
 *                 - Ed25519VerificationKey2020
 *         didDocument:
 *           $ref: '#/components/schemas/DidDocumentWithoutVerificationMethod'
 *     DidImportRequest:
 *       type: object
 *       properties:
 *         did:
 *           type: string
 *           description: DID to be imported
 *           format: uri
 *         keys:
 *           type: array
 *           description: List of keys required to import the DID
 *           items:
 *             $ref: '#/components/schemas/KeyImportRequest'
 *
 *       required:
 *          - did
 *          - keys
 *     PresentationCreateResult:
 *       type: object
 *       properties:
 *           vp:
 *              type: object
 *              description: Verifiable Presentation which could be provided to the verifier.
 *           nbf:
 *              type: integer
 *              description: Unix timestamp of the earliest time that the Verifiable Presentation is valid.
 *           iss:
 *              type: string
 *              description: DID of the issuer of the Verifiable Presentation. (Here it's supposed to be a holder DID)
 *           aud:
 *              type: array
 *              items:
 *                 type: string
 *              description: DID of the verifier of the Verifiable Presentation.
 *       example:
 *          vp:
 *              '@context':
 *                 - https://www.w3.org/2018/credentials/v1
 *              type:
 *                 - VerifiablePresentation
 *              verifiableCredential:
 *                 - eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsImh0dHBzOi8vc2NoZW1hLm9yZy9zY2hlbWEuanNvbmxkIiwiaHR0cHM6Ly92ZXJhbW8uaW8vY29udGV4dHMvcHJvZmlsZS92MSIsImh0dHBzOi8vdzNpZC5vcmcvdmMtc3RhdHVzLWxpc3QtMjAyMS92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiUGVyc29uIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7Im5hbWUiOiJCb2IiLCJnZW5kZXIiOiJtYWxlIn0sImNyZWRlbnRpYWxTdGF0dXMiOnsiaWQiOiJodHRwczovL3Jlc29sdmVyLmNoZXFkLm5ldC8xLjAvaWRlbnRpZmllcnMvZGlkOmNoZXFkOnRlc3RuZXQ6OTBkNWMxNDEtNzI0Zi00N2FkLTlhZTctYTdjMzNhOWU1NjQzP3Jlc291cmNlTmFtZT1zdXNwZW5zaW9uRW4mcmVzb3VyY2VUeXBlPVN0YXR1c0xpc3QyMDIxU3VzcGVuc2lvbiMxMzMzOCIsInR5cGUiOiJTdGF0dXNMaXN0MjAyMUVudHJ5Iiwic3RhdHVzUHVycG9zZSI6InN1c3BlbnNpb24iLCJzdGF0dXNMaXN0SW5kZXgiOiIxMzMzOCJ9fSwic3ViIjoiZGlkOmtleTp6Nk1raGFYZ0JaRHZvdERrTDUyNTdmYWl6dGlHaUMyUXRLTEdwYm5uRUd0YTJkb0siLCJuYmYiOjE3MDA0NzM0MTYsImlzcyI6ImRpZDpjaGVxZDp0ZXN0bmV0OjkwZDVjMTQxLTcyNGYtNDdhZC05YWU3LWE3YzMzYTllNTY0MyJ9.-14Ril1pZEy2HEEo48gTJr2yOtGxBhUGTFmzVdjAtyhFRsW5zZg9onHt6V9JQ8BaiYBlTkP9GzTnJ-O6hdiyCw
 *          nbf: 1700744275
 *          iss: did:cheqd:testnet:4b846d0f-2f6c-4ab6-9fe2-5b8db301c83c
 *          aud:
 *            - did:cheqd:testnet:8c71e9b6-c5a3-4250-8c58-fa591533cd22
 *     DidResult:
 *       type: object
 *       properties:
 *         did:
 *           type: string
 *         controllerKeyId:
 *           type: string
 *         keys:
 *           type: array
 *           items:
 *             type: object
 *         services:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Service'
 *     ListDidResult:
 *       type: object
 *       properties:
 *          total:
 *              type: number
 *          dids:
 *              type: array
 *              items:
 *                  type: string
 *     ExportDidResult:
 *       type: object
 *       properties:
 *         '@context':
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - https://w3id.org/wallet/v1
 *             - https://w3id.org/did-resolution/v1
 *         id:
 *           type: string
 *           example: did:cheqd:testnet:f5101dd8-447f-40a7-a9b8-700abeba389a
 *         type:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - DIDResolutionResponse
 *         didDidResolutionMetadata:
 *           $ref: '#/components/schemas/DidResolutionMetadata'
 *         didDocument:
 *           $ref: '#/components/schemas/DidDocument'
 *         didDocumentMetadata:
 *           $ref: '#/components/schemas/DeactivatedDidDocumentMetadata'
 *         keys:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               '@context':
 *                 type: array
 *                 items:
 *                   type: string
 *               id:
 *                 type: string
 *               type:
 *                 type: array
 *                 items:
 *                   type: string
 *               controller:
 *                 type: string
 *               name:
 *                 type: string
 *               correlation:
 *                 type: array
 *                 items:
 *                   type: string
 *               created:
 *                 type: string
 *               publicKeyMultibase:
 *                 type: string
 *               privateKeyMultibase:
 *                 type: string
 *               publicKeyBase58:
 *                 type: string
 *               privateKeyBase58:
 *                 type: string
 *     DidUpdateResponse:
 *       type: object
 *       properties:
 *          did:
 *            type: string
 *          controllerKeyId:
 *            type: string
 *            description: The default key id of which is the key associated with the first verificationMethod
 *          keys:
 *            type: array
 *            description: The list of keys associated with the list of verificationMethod's of DIDDocument
 *            items:
 *              type: object
 *          services:
 *            type: array
 *            items:
 *              $ref: '#/components/schemas/Service'
 *          controllerKeyRefs:
 *            type: array
 *            description: The list of keyRefs which were used for signing the transaction
 *            items:
 *              type: string
 *          controllerKeys:
 *            type: array
 *            description: The list of all possible keys, inlcuding all controller's keys
 *            items:
 *              type: string
 *     VerificationMethod:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *         controller:
 *           type: string
 *         publicKeyMultibase:
 *           type: string
 *         publicKeyJwk:
 *           type: array
 *           items:
 *             type: string
 *       example:
 *         controller: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *         id: did:cheqd:testnet :7bf81a20-633c-4cc7-bc4a-5a45801005e0#key-1
 *         publicKeyBase58: BTJiso1S4iSiReP6wGksSneGfiKHxz9SYcm2KknpqBJt
 *         type: Ed25519VerificationKey2018
 *     Service:
 *       description: Communicating or interacting with the DID subject or associated entities via one or more service endpoints. See <a href="https://www.w3.org/TR/did-core/#services">DID Core specification</a> for more details.
 *       type: object
 *       properties:
 *         id:
 *           description: DID appended with Service fragment ID (e.g., `#service-1` in `did:cheqd:mainnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0#service-1`)
 *           type: string
 *           example: did:cheqd:mainnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0#service-1
 *         type:
 *           description: Service type as defined in <a href="https://www.w3.org/TR/did-spec-registries/#service-types">DID Specification Registries</a>.
 *           type: string
 *           example: LinkedDomains
 *         serviceEndpoint:
 *           description: Service endpoint as defined in <a href="https://www.w3.org/TR/did-core/#services">DID Core Specification</a>.
 *           type: array
 *           items:
 *             type: string
 *             example: https://example.com
 *         priority:
 *           description: (Optional) Priority of the service endpoint, used for distinction when multiple did-communication service endpoints are present in a single DID document.
 *           type: integer
 *           example: 0
 *         recipientKeys:
 *           description: (Optional) List of recipient keys used to denote the default recipients of an endpoint.
 *           type: array
 *           items:
 *            type: string
 *            example: did:cheqd:mainnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0#key-1
 *         routingKeys:
 *           description: (Optional) List of routing keys used to used to denote the individual routing hops in between the sender and recipients.
 *           type: array
 *           items:
 *             type: string
 *             example: did:cheqd:mainnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0#key-2
 *         accept:
 *           description: (Optional) List of media types that the service endpoint accepts.
 *           type: array
 *           items:
 *             type: string
 *             example: didcomm/aip2;env=rfc587
 *     DidUpdateRequest:
 *       type: object
 *       properties:
 *         did:
 *           description: DID identifier to be updated.
 *           type: string
 *           example: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *         service:
 *           type: array
 *           description: Service section of the DID Document.
 *           items:
 *             $ref: '#/components/schemas/Service'
 *         verificationMethod:
 *           type: array
 *           description: Verification Method section of the DID Document.
 *           items:
 *             $ref: '#/components/schemas/VerificationMethod'
 *         authentication:
 *           description: Authentication section of the DID Document.
 *           type: array
 *           items:
 *             type: string
 *         publicKeyHexs:
 *           description: List of key references (publicKeys) which will be used for signing the message. The should be in hexadecimal format and placed in the wallet of current user.
 *           type: array
 *           items:
 *            type: string
 *         didDocument:
 *           $ref: '#/components/schemas/DidDocument'
 *     DidDeactivateRequest:
 *       type: object
 *       properties:
 *         publicKeyHexs:
 *           description: List of key references (publicKeys) which will be used for signing the message. The should be in hexadecimal format and placed in the wallet of current user.
 *           type: array
 *           items:
 *            type: string
 *     CreateResourceRequest:
 *       description: Input fields for DID-Linked Resource creation.
 *       type: object
 *       additionalProperties: false
 *       required:
 *         - name
 *         - type
 *         - data
 *         - encoding
 *       properties:
 *         data:
 *           description: Encoded string containing the data to be stored in the DID-Linked Resource.
 *           type: string
 *         encoding:
 *           description: Encoding format used to encode the data.
 *           type: string
 *           enum:
 *             - base64url
 *             - base64
 *             - hex
 *         name:
 *           description: Name of DID-Linked Resource.
 *           type: string
 *         type:
 *           description: Type of DID-Linked Resource. This is NOT the same as the media type, which is calculated automatically ledger-side.
 *           type: string
 *         alsoKnownAs:
 *           description: Optional field to assign a set of alternative URIs where the DID-Linked Resource can be fetched from.
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               uri:
 *                 type: string
 *               description:
 *                 type: string
 *         version:
 *           description: Optional field to assign a human-readable version in the DID-Linked Resource.
 *           type: string
 *         publicKeyHexs:
 *           description: List of key references (publicKeys) which will be used for signing the message. The should be in hexadecimal format and placed in the wallet of current user.
 *           type: array
 *           items:
 *            type: string
 *       example:
 *         data: SGVsbG8gV29ybGQ=
 *         encoding: base64url
 *         name: ResourceName
 *         type: TextDocument
 *     ResourceList:
 *       type: object
 *       properties:
 *         '@context':
 *           type: string
 *           example: https://w3id.org/did-resolution/v1
 *         contentMetadata:
 *           type: object
 *         contentStream:
 *           type: object
 *         dereferencingMetadata:
 *           $ref: '#/components/schemas/DereferencingMetadata'
 *     ListResourceResult:
 *       type: object
 *       properties:
 *          total:
 *              type: number
 *          resources:
 *              type: array
 *              items:
 *                  $ref: '#/components/schemas/ResourceMetadata'
 *     DereferencingMetadata:
 *       type: object
 *       properties:
 *         contentType:
 *           type: string
 *           example: application/did+ld+json
 *         did:
 *           $ref: '#/components/schemas/DidProperties'
 *         retrieved:
 *           type: string
 *           example: "2021-09-01T12:00:00Z"
 *     DidResolution:
 *       type: object
 *       properties:
 *          '@context':
 *            type: string
 *            example: https://w3id.org/did-resolution/v1
 *          didDidResolutionMetadata:
 *            $ref: '#/components/schemas/DidResolutionMetadata'
 *          didDocument:
 *            $ref: '#/components/schemas/DidDocument'
 *          didDocumentMetadata:
 *            $ref: '#/components/schemas/DidDocumentMetadata'
 *     DeactivatedDidResolution:
 *       type: object
 *       properties:
 *          '@context':
 *            type: string
 *            example: https://w3id.org/did-resolution/v1
 *          didDidResolutionMetadata:
 *            $ref: '#/components/schemas/DidResolutionMetadata'
 *          didDocument:
 *            $ref: '#/components/schemas/DidDocument'
 *          didDocumentMetadata:
 *            $ref: '#/components/schemas/DeactivatedDidDocumentMetadata'
 *     DidDocumentMetadata:
 *       type: object
 *       properties:
 *         created:
 *           type: string
 *           example: "2021-09-01T12:00:00Z"
 *         deactivated:
 *           type: boolean
 *           example: false
 *         updated:
 *           type: string
 *           example: "2021-09-10T12:00:00Z"
 *         versionId:
 *           type: string
 *           example: 3ccde6ba-6ba5-56f2-9f4f-8825561a9860
 *         linkedResourceMetadata:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ResourceMetadata'
 *     DeactivatedDidDocumentMetadata:
 *       type: object
 *       properties:
 *         created:
 *           type: string
 *           example: "2021-09-01T12:00:00Z"
 *         deactivated:
 *           type: boolean
 *           example: true
 *         updated:
 *           type: string
 *           example: "2021-09-10T12:00:00Z"
 *         versionId:
 *           type: string
 *           example: 3ccde6ba-6ba5-56f2-9f4f-8825561a9860
 *         linkedResourceMetadata:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ResourceMetadata'
 *     ResourceMetadata:
 *       type: object
 *       properties:
 *         resourceURI:
 *           type: string
 *           example: did:cheqd:testnet:55dbc8bf-fba3-4117-855c-1e0dc1d3bb47/resources/398cee0a-efac-4643-9f4c-74c48c72a14b
 *         resourceCollectionId:
 *           type: string
 *           example: 55dbc8bf-fba3-4117-855c-1e0dc1d3bb47
 *         resourceId:
 *           type: string
 *           example: 398cee0a-efac-4643-9f4c-74c48c72a14b
 *         resourceName:
 *           type: string
 *           example: cheqd-issuer-logo
 *         resourceType:
 *           type: string
 *           example: CredentialArtwork
 *         mediaType:
 *           type: string
 *           example: image/png
 *         resourceVersion:
 *           type: string
 *           example: "1.0"
 *         checksum:
 *           type: string
 *           example: a95380f460e63ad939541a57aecbfd795fcd37c6d78ee86c885340e33a91b559
 *         created:
 *           type: string
 *           example: "2021-09-01T12:00:00Z"
 *         nextVersionId:
 *           type: string
 *           example: d4829ac7-4566-478c-a408-b44767eddadc
 *         previousVersionId:
 *           type: string
 *           example: ad7a8442-3531-46eb-a024-53953ec6e4ff
 *     DidResolutionMetadata:
 *       type: object
 *       properties:
 *         contentType:
 *           allOf:
 *           - $ref: '#/components/schemas/ContentType'
 *           example: application/did+ld+json
 *         retrieved:
 *           type: string
 *           example: '2021-09-01T12:00:00Z'
 *         did:
 *           $ref: '#/components/schemas/DidProperties'
 *     ContentType:
 *       type: string
 *       enum:
 *       - application/did+json
 *       - application/did+ld+json
 *       - application/ld+json
 *       - application/json
 *     DidProperties:
 *       type: object
 *       properties:
 *         didString:
 *           type: string
 *           example: did:cheqd:testnet:55dbc8bf-fba3-4117-855c-1e0dc1d3bb47
 *         method:
 *           type: string
 *           example: cheqd
 *         methodSpecificId:
 *           type: string
 *           example: 55dbc8bf-fba3-4117-855c-1e0dc1d3bb47
 *     Customer:
 *       type: object
 *       properties:
 *         customer:
 *           type: object
 *           properties:
 *              customerId:
 *                 type: string
 *              name:
 *                  type: string
 *         paymentAccount:
 *           type: object
 *           properties:
 *              mainnet:
 *                  type: string
 *              testnet:
 *                  type: string
 *     QueryIdTokenResponseBody:
 *         type: object
 *         properties:
 *              idToken:
 *                  type: string
 *     AccountCreateRequest:
 *       type: object
 *       required:
 *         - primaryEmail
 *       properties:
 *         name:
 *          type: string
 *         primaryEmail:
 *          type: string
 *     AccountCreateResponse:
 *       type: object
 *       properties:
 *         customerId:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 *         paymentProviderId:
 *           type: string
 *     AccountAnalyticsResponse:
 *       type: object
 *       properties:
 *        dids:
 *         type: integer
 *        credentials:
 *          type: integer
 *        accreditations:
 *          type: integer
 *        resources:
 *          type: integer
 *     AccountNetworkBalance:
 *       type: object
 *       nullable: true
 *       description: Balance of a single payment account. `null` when the customer has no account on that network.
 *       properties:
 *         address:
 *           type: string
 *           example: cheqd1abcd...
 *         denom:
 *           type: string
 *           example: ncheq
 *         balance:
 *           type: object
 *           nullable: true
 *           description: On-chain balance. `null` when the network's RPC query failed.
 *           properties:
 *             ncheq:
 *               type: string
 *               example: "1500000000000"
 *             cheq:
 *               type: number
 *               example: 1500
 *         usd:
 *           type: number
 *           nullable: true
 *           description: balance.cheq multiplied by the CHEQ/USD rate. `null` when the balance or the rate is unavailable.
 *           example: 3.03
 *     AccountBalancesResponse:
 *       type: object
 *       properties:
 *         mainnet:
 *           $ref: '#/components/schemas/AccountNetworkBalance'
 *         testnet:
 *           $ref: '#/components/schemas/AccountNetworkBalance'
 *         rate:
 *           type: object
 *           nullable: true
 *           description: CHEQ/USD spot rate used for the `usd` fields. `null` when it could not be fetched.
 *           properties:
 *             cheqUsd:
 *               type: number
 *               example: 0.00202
 *             source:
 *               type: string
 *               example: coingecko
 *             asOf:
 *               type: string
 *               format: date-time
 *     SchemaUrl:
 *       type: object
 *       properties:
 *         types:
 *           type: array
 *           items:
 *            type: string
 *         url:
 *           type: string
 *     InvalidRequest:
 *       description: A problem with the input fields has occurred. Additional state information plus metadata may be available in the response body.
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: InvalidRequest
 *     InternalError:
 *       description: An internal error has occurred. Additional state information plus metadata may be available in the response body.
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: Internal Error
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: Unauthorized Error
 *     ListAccreditationResult:
 *       type: object
 *       properties:
 *         total:
 *           type: number
 *           description: Total number of accreditations.
 *           example: 5
 *         accreditations:
 *           type: array
 *           description: List of accreditations with credential data and tracking metadata.
 *           items:
 *             allOf:
 *               - $ref: '#/components/schemas/VerifiableCredential'
 *               - type: object
 *                 properties:
 *                   metadata:
 *                     type: object
 *                     description: Tracking metadata from the issued credential database record
 *                     properties:
 *                       issuedCredentialId:
 *                         type: string
 *                         description: Unique identifier for the issued credential
 *                       providerId:
 *                         type: string
 *                         description: Provider identifier
 *                       providerCredentialId:
 *                         type: string
 *                         description: Provider-specific credential ID (resourceId)
 *                       status:
 *                         type: string
 *                         description: Current status of the credential
 *                         enum: [issued, suspended, revoked]
 *                       statusUpdatedAt:
 *                         type: string
 *                         format: date-time
 *                         description: Timestamp when status was last updated
 */
