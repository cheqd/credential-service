import {
    createAgent,
    IDIDManager,
    IResolver,
    IDataStore,
    IKeyManager,
    TAgent, W3CCredential, IAgentContext,
} from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { EthrDIDProvider } from '@veramo/did-provider-ethr'
import { WebDIDProvider } from '@veramo/did-provider-web'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import { CredentialIssuer } from '@veramo/credential-w3c'
import { getResolver as EthrDIDResolver } from 'ethr-did-resolver'
import { getResolver as WebDIDResolver } from 'web-did-resolver'

import { CheqdDIDProvider, CheqdResolver } from '../../../did-provider-cheqd/src'

import { KMS_SECRET_KEY, INFURA_PROJECT_ID, VC_SUBJECT, ISSUER_ID, VC_CONTEXT, VC_TYPE, HEADERS, VC_PROOF_FORMAT, CORS_HEADERS } from '../constants'
import { CredentialPayload, CredentialRequest, CredentialSubject } from '../types'

import { Identity } from './identity'
import {IContext} from "@veramo/credential-w3c/src/action-handler";

class CheqdCredentialIssue extends CredentialIssuer {
    constructor() {
        super()
        this.methods['verifyCredential'] = this.verifyCredential
    }
    async verifyCredential (credential: W3CCredential, context: IContext): Promise<boolean> {
        return true
    }
}

export class Credentials {

    agent: TAgent<any> | null | undefined

    constructor(agent?: TAgent<any>) {
        this.agent = agent
        if( !agent ) this.init_agent()
    }

    init_agent(): void {
        //@ts-ignore
        this.agent = createAgent<IDIDManager & IKeyManager & IDataStore & IResolver & LdCredentialModule>({
            plugins: [
                new KeyManager({
                    store: new MemoryKeyStore(),
                    kms: {
                        local: new KeyManagementSystem(
                            new MemoryPrivateKeyStore()
                        )
                    }
                }),
                //@ts-ignore
                new DIDManager({
                    store: new MemoryDIDStore(),
                    defaultProvider: 'did:cheqd:testnet',
                    providers: {
                        'did:cheqd:testnet': new CheqdDIDProvider(
                            {
                                defaultKms: 'local'
                            }
                        )
                    }
                }),
                new DIDResolverPlugin({
                    resolver: new Resolver({
                        ...EthrDIDResolver({ infuraProjectId: INFURA_PROJECT_ID }),
                        ...WebDIDResolver(),
                    })
                }),
                new CheqdCredentialIssue()
            ]
        })
    }

    async issue_credentials(request: Request): Promise<Response> {
        if( !this.agent ) throw new Error('No initialised agent found.')

        const issuer_id = await (new Identity(
            this.agent,
            'demo'
        )).create_demo_id(
            request,
            this.agent
        )

        const credential_subject: CredentialSubject = {
            id: VC_SUBJECT,
            type: undefined
        }

        const credential: CredentialPayload = {
            issuer: { id: issuer_id.did },
            '@context': VC_CONTEXT,
            type: [ VC_TYPE ],
            issuanceDate: new Date().toISOString(),
            credentialSubject: credential_subject,
            name: "Ankur Banerjee",
        }

        const verifiable_credential = await this.agent.execute(
            'createVerifiableCredential',
            {
                save: false,
                credential,
                proofFormat: VC_PROOF_FORMAT
            }
        )

        return new Response(
            JSON.stringify(
                verifiable_credential,
                null,
                2
            ),
            {
                headers: {
                    ...HEADERS.json
                }
            }
        )
    }

    async verify_credentials(request: CredentialRequest): Promise<Response> {
        if( !request.headers.get('Content-Type') || request.headers.get('Content-Type') != 'application/json' ) return new Response( JSON.stringify( { error: 'Unsupported media type.' } ), { status: 405, headers: HEADERS.json } )

        const credential = request?.credential;

        console.log("Credential: ", JSON.stringify(credential))

        if( !credential ) return new Response( JSON.stringify( { error: 'W3C Verifiable credential is not provided.' } ), { status: 400, headers: HEADERS.json } )

        const verified = await this.agent?.execute(
            'verifyCredential',
            {
                credential: credential
            }
        )

        return new Response(
            JSON.stringify(
                {
                    verified: verified
                }
            ),
            {
                headers: {
                    ...HEADERS.json
                }
            }
        )
    }
}