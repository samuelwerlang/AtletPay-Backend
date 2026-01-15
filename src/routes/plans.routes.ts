import express from "express"
import pkg from 'express-openid-connect';
const { requiresAuth } = pkg;

const router = express.Router();

//router.post('/plans', 
 //   requiresAuth(),
 //   createPlanController
//)