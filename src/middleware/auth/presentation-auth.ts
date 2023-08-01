import { Request, Response } from "express";
import { AbstractAuthHandler } from "./base-auth.js";
import { IAuthResponse } from "../../types/authentication.js";

export class PresentationAuthHandler extends AbstractAuthHandler {

    constructor () {
        super()
        // true means allowUnauthorized
        this.registerRoute('/presentation/verify', 'POST', '', { allowUnauthorized: true })
    }
    public async handle(request: Request, response: Response): Promise<IAuthResponse> {
        if (!request.path.includes('/presentation')) {
            return super.handle(request, response)
        }
        return this.commonPermissionCheck(request)
    }

}