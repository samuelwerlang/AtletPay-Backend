import express from "express"
import createStudentController from "../controllers/students.controller.js";
import pkg from 'express-openid-connect';
const { requiresAuth } = pkg;

const router = express.Router();

router.post('/student', 
    requiresAuth(),
    createStudentController,
)

export default router;