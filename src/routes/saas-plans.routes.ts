import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import createSaasPlanController from "../controllers/saasplan.controller.js";
import requireAdmin from "../middlewares/checkadmin.middleware.js";

const router = express.Router();

router.post("/saasplan", jwtCheck, requireAdmin, createSaasPlanController);

export default router;
