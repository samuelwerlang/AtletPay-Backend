import express from "express";
import { jwtCheck } from "../middlewares/auth.middleware.js";
import createStudentController from "../controllers/students.controller.js";
const router = express.Router();
router.post("/student", jwtCheck, createStudentController);
export default router;
