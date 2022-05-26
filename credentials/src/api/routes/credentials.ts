import { Router } from 'itty-router'
import { Credentials } from '../controllers/credentials'
import { CredentialRequest, W3CVerifiableCredential } from '../types'

const router = Router({ base: '/api/credentials' })

router.all(
    '/',
    () => new Response( JSON.stringify( { ping: 'pong' } ) )
)

router.all(
    '/issue/*',
    async (request: Request) => {
        return await ( new Credentials() ).issue_credentials(request)
    }
)

router.post(
    '/verify',
    async (request: Request) => {
        const _body: Record<any, any> = await request.json()
        const _credential = _body[ 'credential' ]
        const credential_request = { ...request as Request, credential: _credential as W3CVerifiableCredential } as CredentialRequest
        return await ( new Credentials() ).verify_credentials(credential_request)
    }
)

export default router

