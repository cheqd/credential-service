import type { Request, Response } from 'express'

import { DIDDocument } from 'did-resolver'
import { v4 } from 'uuid'
import { MethodSpecificIdAlgo } from '@cheqd/sdk'

import { Identity } from '../services/identity.js'
import { CustomerService } from '../services/customer.js'
import { generateDidDoc, validateSpecCompliantPayload } from '../helpers/helpers.js'
import { CustomerEntity } from '../database/entities/customer.entity.js'

export class IssuerController {
  
  public async createKey(request: Request, response: Response) {
    try {
      const key = await Identity.instance.createKey()
      await CustomerService.instance.update(response.locals.customerId, { kids: [key.kid] })
      return response.status(200).json(key)
    } catch (error) {
        return response.status(500).json({
            error: `${error}`
        })
    }
  }

  public async getKey(request: Request, response: Response) {
    try {
      const isOwner = await CustomerService.instance.find(response.locals.customerId, {kid: request.params.kid})
      if(!isOwner) {
          return response.status(401).json(`Not found`)
      }
      const key = await Identity.instance.getKey(request.params.kid)
      return response.status(200).json(key)
    } catch (error) {
        return response.status(500).json({
            error: `${error}`
        })
    }
  }

  public async createDid(request: Request, response: Response) {
    const { options, secret } = request.body
    const { methodSpecificIdAlgo, network, versionId = v4()} = options
    const verificationMethod = secret?.verificationMethod
    let didDocument: DIDDocument
    let kids: string[] = [] 
    try {
      if (options.didDocument && validateSpecCompliantPayload(options.didDocument)) {
        didDocument = options.didDocument
      } else if (verificationMethod) {
        const key = await Identity.instance.createKey()
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
      await CustomerService.instance.update(response.locals.customerId, { kids, dids: [did.did] })
      return response.status(200).json(did)
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
        const customer = await CustomerService.instance.get(response.locals.customerId) as CustomerEntity
        did = customer.dids
      }

      return response.status(200).json(did)
    } catch (error) {
        return response.status(500).json({
            error: `${error}`
        })
    }
  }

}
