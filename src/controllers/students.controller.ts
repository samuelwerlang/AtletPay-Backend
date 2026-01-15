import {Request, Response} from "express";
import createStudentService from "../services/student.services.js";

async function createStudentController(req : Request, res : Response) {

    const {name, phone, email} = req.body;
    const userAuth0Id : string = req.oidc.user?.sub;
    if (!req.oidc.user?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (!name || !email) {
  return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const student = await createStudentService({
            userAuth0Id : userAuth0Id,
            name,
            phone,
            email,
        });
        res.json(student);
    } catch (error) {
        res.status(500).send("Failed to create Student");
        console.error(error);
    }
}

export default createStudentController;