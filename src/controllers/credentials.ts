import type { Request, Response } from 'express'

import { CredentialRequest, W3CVerifiableCredential } from '../types/types'
import { GuardedCredentials } from '../middleware/guard'
import { applyMixins } from '../middleware/_'
import { Credentials } from '../services/credentials'

export class CredentialController {

    public async issue(request: Request, response: Response) {
		switch (request.params.type) {
			case 'Ticket':
				const body = request.body
				return await Credentials.instance.issue_ticket_credential(body.data, body.subjectId)
			default:
				applyMixins(GuardedCredentials, [Credentials])

				const credentials = new GuardedCredentials()

				const { authenticated, user, subjectId, provider, error } = await credentials.guard(request)

				if (!(authenticated)) {
					return response.status(400).json({
                        message: JSON.stringify(error)
                    })
				}
				const verifiable_credential = await credentials.issue_person_credential(user, provider, subjectId)
                return response.status(200).json(verifiable_credential)
		}
	}

    public async verify(request: Request, response: Response) {
        if (request?.headers && (!request.headers['content-type'] || request.headers['content-type'] != 'application/json')) {
            return response.status(405).json({ error: 'Unsupported media type.' })
        }
		const _body: Record<any, any> = request.body
		const _credential = _body['credential']
		const credential_request = { ...request as Request, credential: _credential as W3CVerifiableCredential } as CredentialRequest
		const verified = await Credentials.instance.verify_credentials(credential_request)
        return response.json(verified)
	}

}