import type { Request, Response } from 'express'
import { check, param, validationResult } from 'express-validator'
import { fromString } from 'uint8arrays'
import { DIDDocument } from 'did-resolver'
import { v4 } from 'uuid'
import { MethodSpecificIdAlgo, VerificationMethods, CheqdNetwork } from '@cheqd/sdk'
import { MsgCreateResourcePayload } from '@cheqd/ts-proto/cheqd/resource/v2/index.js'

import { Identity } from '../services/identity/index.js'
import { generateDidDoc, validateSpecCompliantPayload } from '../helpers/helpers.js'

/**
 * @openapi
 * 
 * components:
 *   schemas:
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
 *       description: This input field contains either a complete DID document, or an incremental change (diff) to a DID document. See <a href=\"https://identity.foundation/did-registration/#diddocument\">https://identity.foundation/did-registration/#diddocument</a>.
 *       type: object
 *       properties:
 *         context:
 *           type: array
 *           items:
 *             type: string
 *         id:
 *          type: string
 *          example: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *         controllers:
 *           type: array
 *           items:
 *             type: string
 *           example: [
 *             did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *           ]
 *         authentication:
 *           type: array
 *           items:
 *             type: string
 *           example: [
 *             did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0#key-0
 *           ]
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
 *         verificationMethod:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VerificationMethod'
 *         service:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Service'
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
 *     VerificationMethod:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0#key-0
 *         type:
 *           type: string
 *           example: Ed25519VerificationKey2018
 *         controller:
 *           type: string
 *           example: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0
 *         publicKeyMultibase:
 *           type: string
 *           example: BTJiso1S4iSiReP6wGksSneGfiKHxz9SYcm2KknpqBJt
 *         publicKeyJwk:
 *           type: array
 *           items:
 *             type: string
 *     Service:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: did:cheqd:testnet:7bf81a20-633c-4cc7-bc4a-5a45801005e0#rand
 *         type:
 *           type: string
 *           example: rand
 *         serviceEndpoint:
 *           type: array
 *           items:
 *             type: string
 *             example: https://rand.in
*/

export class IssuerController {

  public static didValidator = [
    check('didDocument').optional().isArray().custom((value)=>{
      const { valid } = validateSpecCompliantPayload(value)
      return valid
    }).withMessage('Invalid didDocument'),
    check('secret.verificationMethod.type')
      .optional()
      .isString()
      .isIn([VerificationMethods.Ed255192020, VerificationMethods.Ed255192018, VerificationMethods.JWK])
      .withMessage('Invalid verificationMethod'),
    check('secret.verificationMethod.id')
      .optional()
      .isString()
      .withMessage('Invalid verificationMethod'),      
    check('options.methodSpecificIdAlgo').optional().isString().isIn([MethodSpecificIdAlgo.Base58, MethodSpecificIdAlgo.Uuid]).withMessage('Invalid methodSpecificIdAlgo'),
    check('options.network').optional().isString().isIn([CheqdNetwork.Mainnet, CheqdNetwork.Testnet]).withMessage('Invalid network'),
  ]

  public static resourceValidator = [
    param('did').exists().isString().contains('did:cheqd').withMessage('Invalid DID'),
    check('jobId').custom((value, {req})=>{
      if(!value && !(req.body.name && req.body.type && req.body.data)) return false
      return true
    }).withMessage('name, type and data are required'),
    check('name').optional().isString().withMessage('Invalid name'),
    check('type').optional().isString().withMessage('Invalid type'),
    check('data').optional().isString().withMessage('Invalid data'),
    check('alsoKnownAs').optional().isArray().withMessage('Invalid alsoKnownAs'),
    check('alsoKnownAs.*.uri').isString().withMessage('Invalid uri'),
    check('alsoKnownAs.*.description').isString().withMessage('Invalid description')
  ]
  
  /**
   * @openapi
   * 
   * /key/create:
   *   post:
   *     tags: [ Key ]
   *     summary: Create a key pair.
   *     security: [ bearerAuth: [] ]
   *     responses:
   *       200:
   *         description: The request was successful.
   *         content:
   *           application/json:
   *             schema: 
   *               $ref: '#/components/schemas/KeyResult'
   *       400:
   *         description: A problem with the input fields has occurred. Additional state information plus metadata may be available in the response body.
   *         content:
   *           application/json:
   *             schema: 
   *               $ref: '#/components/schemas/InvalidRequest'
   *             example:
   *               error: Invalid Request
   *       401:
   *         $ref: '#/components/schemas/UnauthorizedError'
   *       500:
   *         description: An internal error has occurred. Additional state information plus metadata may be available in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InvalidRequest'
   *             example: 
   *               error: Internal Error
   */
  public async createKey(request: Request, response: Response) {
    try {
      const key = await Identity.instance.createKey('Ed25519', response.locals.customerId)
      return response.status(200).json(key)
    } catch (error) {
        return response.status(500).json({
            error: `${error}`
        })
    }
  }

  /**
   * @openapi
   * 
   * /key/{kid}:
   *   get:
   *     tags: [ Key ]
   *     summary: Fetch a key pair.
   *     security: [ bearerAuth: [] ]
   *     parameters:
   *       - name: kid
   *         in: path
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: The request was successful.
   *         content:
   *           application/json:
   *             schema: 
   *               $ref: '#/components/schemas/KeyResult'
   *       400:
   *         description: A problem with the input fields has occurred. Additional state information plus metadata may be available in the response body.
   *         content:
   *           application/json:
   *             schema: 
   *               $ref: '#/components/schemas/InvalidRequest'
   *             example:
   *               error: Invalid Request
   *       401:
   *         $ref: '#/components/schemas/UnauthorizedError'
   *       500:
   *         description: An internal error has occurred. Additional state information plus metadata may be available in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InvalidRequest'
   *             example: 
   *               error: Internal Error
   */
  public async getKey(request: Request, response: Response) {
    try {
      const key = await Identity.instance.getKey(request.params.kid, response.locals.customerId)
      return response.status(200).json(key)
    } catch (error) {
        return response.status(500).json({
            error: `${error}`
        })
    }
  }

  public async createDid(request: Request, response: Response) {
    const result = validationResult(request)
    if (!result.isEmpty()) {
      return response.status(400).json({
        error: result.array()[0].msg
      })
    }

    const { options, secret } = request.body
    const { methodSpecificIdAlgo, network, versionId = v4()} = options
    const verificationMethod = secret?.verificationMethod
    let didDocument: DIDDocument
    let kids: string[] = [] 
    try {
      if (options.didDocument) {
        didDocument = options.didDocument
      } else if (verificationMethod) {
        const key = await Identity.instance.createKey('Ed25519', response.locals.customerId)
        kids.push(key.kid)
        didDocument = generateDidDoc({
          verificationMethod: verificationMethod.type,
          verificationMethodId: verificationMethod.id || 'key-1',
          methodSpecificIdAlgo: (methodSpecificIdAlgo as MethodSpecificIdAlgo) || MethodSpecificIdAlgo.Uuid,
          network,
          publicKey: key.publicKeyHex
        })
        didDocument.assertionMethod = didDocument.authentication
      } else {
        return response.status(400).json({
            error: 'Provide a DID Document or atleast one verification method'
        })
      }

      const did = await Identity.instance.createDid(network, didDocument, response.locals.customerId)
      return response.status(200).json(did)
    } catch (error) {
        return response.status(500).json({
            error: `${error}`
        })
    }
  }

  public async createResource(request: Request, response: Response) {
    const result = validationResult(request)
    if (!result.isEmpty()) {
      return response.status(400).json({
        error: result.array()[0].msg
      })
    }

    const { did } = request.params
    let { data, name, type, alsoKnownAs, version, network } = request.body
    
    let resourcePayload: Partial<MsgCreateResourcePayload> = {}
    try {
      // check if did is registered on the ledger
      let resolvedDocument: any = await Identity.instance.resolveDid(did)
      if(!resolvedDocument?.didDocument || resolvedDocument.didDocumentMetadata.deactivated) {
        return response.status(400).send({
            error: `${did} is a Deactivated DID`
        })
      } else {
        resolvedDocument = resolvedDocument.didDocument
      }
      
      resourcePayload = {
        collectionId: did.split(':').pop()!,
        id: v4(),
        name,
        resourceType: type,
        data: fromString(data, 'base64'),
        version,
        alsoKnownAs
      }
      network = network || (did.split(':'))[2]
      const result = await Identity.instance.createResource( network, resourcePayload, response.locals.customerId)    
      if ( result ) {
        return response.status(201).json({
            resource: resourcePayload
        })
      } else {
        return response.status(500).json({
            error: 'Error creating resource'
        })
      }
    } catch (error) {
      return response.status(500).json({
        error: `${error}`
      })
    }
  }

  public async getDids(request: Request, response: Response) {
    try {
      let did: any
      if(request.params.did) {
        did = await Identity.instance.resolveDid(request.params.did)
      } else {
        did = await Identity.instance.listDids(response.locals.customerId)
      }

      return response.status(200).json(did)
    } catch (error) {
        return response.status(500).json({
            error: `${error}`
        })
    }
  }

}
