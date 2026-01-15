import {Request, Response} from "express";
import createStudentService from "../services/student.services";

async function createStudentController(req : Request, res : Response) {

    const {name, phone, email} = req.body;
    const userPersonalId = req.oidc.user?.sub;
    if (!req.oidc.user?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (!name || !email) {
  return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const student = await createStudentService({
            personalId : userPersonalId,
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