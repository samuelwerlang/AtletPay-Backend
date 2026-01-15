import {Request, Response} from "express"
import createUserService from "../services/users.service.js"

async function createUserController(req : Request, res : Response) {
    const user = req.oidc.user;

    if(!user) {
        return res.status(401).json({ error : "Unauthorized", date: String(Date.now())});
    }

    const createdUser = await createUserService({
        auth0Id : user.sub,
        email : user.email,
        name : user.name
    });

    return res.status(200).json(createdUser);
}

export default createUserController;