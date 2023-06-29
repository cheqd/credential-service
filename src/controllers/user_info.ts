import { Request, Response } from 'express'

import * as dotenv from 'dotenv'
dotenv.config()

export class UserInfo {

    public async getUserInfo(request: Request, response: Response) {
        if (request.user.isAuthenticated) {
            response.header("Content-Type",'application/json')
            response.send(JSON.stringify(request.user, null, 4))
        } else {
            return response.status(400).json({
                error: `Unauthorized error`
            })
        }
    }
}