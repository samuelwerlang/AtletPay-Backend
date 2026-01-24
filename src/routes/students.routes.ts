import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import {
  createStudentController,
  deleteStudentController,
  getStudentController,
  updateStudentController,
} from "../controllers/students.controller.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
const router = express.Router();

router.post("/student", jwtCheck, requireAuth, createStudentController);
router.get("/student/:studentId", jwtCheck, requireAuth, getStudentController);
router.delete("/student/:studentId", jwtCheck, requireAuth, deleteStudentController);
router.patch("/student/:studentId", jwtCheck, requireAuth, updateStudentController);

export default router;
