import { Request, Response, NextFunction } from "express";

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorizedUser = req.auth;
  if (!authorizedUser) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  return next();
}

export default requireAuth;
