import express from "express";
import pkg from "express-openid-connect";
const { requiresAuth } = pkg;
import createSaasPlanController from "../controllers/saasplan.controller.js";
import requireAdmin from "../middlewares/checkadmin.middleware.js";
const router = express.Router();
router.post("/saasplan", requiresAuth(), requireAdmin, createSaasPlanController);
export default router;
