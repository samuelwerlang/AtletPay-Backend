import express from "express"
import createUserController from "../controllers/users.controller.js"
import pkg from 'express-openid-connect';
const { requiresAuth } = pkg;
const router = express.Router()

router.post("/user",
    requiresAuth(),
    createUserController,
);

export default router;