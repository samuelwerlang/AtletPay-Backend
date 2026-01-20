import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import createUserController from "../controllers/users.controller.js";

const router = express.Router();

router.post("/user", jwtCheck, createUserController);

export default router;
