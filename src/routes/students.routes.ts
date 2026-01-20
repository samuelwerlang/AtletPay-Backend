import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import createStudentController from "../controllers/students.controller.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
const router = express.Router();

router.post("/student", jwtCheck, requireAuth, createStudentController);

export default router;
