import express from "express";
import {
  createStudentController,
  deleteStudentController,
  getStudentByIdController,
  getAllStudentsController,
  updateStudentController,
  getActiveStudentsController,
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
router.get(
  "/students",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  getAllStudentsController,
);

router.get(
  "/students/active",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  getActiveStudentsController,
);

router.get(
  "/student/:studentId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  getStudentByIdController,
);
router.delete(
  "/student/:studentId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  deleteStudentController,
);
router.patch(
  "/student/:studentId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  updateStudentController,
);

export default router;
