import express from "express";
import {
  createStudentController,
  deleteStudentController,
  getStudentByIdController,
  getAllStudentsController,
  updateStudentController,
} from "../controllers/students.controller.js";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
import getCurrentUser from "../middlewares/getCurrentUser.middleware.js";
import checkSaasSubscription from "../middlewares/checkSaasSubscription.middleware.js";
import checkStudentLimit from "../middlewares/checkStudentLimit.middleware.js";
const router = express.Router();

router.post(
  "/student",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  checkStudentLimit,
  createStudentController,
);
router.get("/students", jwtCheck, requireAuth, getAllStudentsController);
router.get(
  "/student/:studentId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  getStudentByIdController,
);
router.delete(
  "/student/:studentId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  deleteStudentController,
);
router.patch(
  "/student/:studentId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  updateStudentController,
);

export default router;
