import * as z from "zod";
import { Request, Response } from "express";
import {
  createCPFService,
  getCPFService,
  deleteCPFService,
} from "../services/usertaxId.services.js";

const createCPFBodySchema = z.object({
  cpf: z.string().min(11).max(14), // CPF tem 11 dígitos, mas pode ter formatação
});

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

async function createCPFController(req: Request, res: Response) {
  const parsedBody = createCPFBodySchema.parse(req.body);
  const user = res.locals.user;

  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const cpf = await createCPFService(user.id, parsedBody.cpf);

  return res.status(200).json({ message: "CPF criado com sucesso", cpf });
}

async function getCPFController(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const user = res.locals.user;

  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const cpf = await getCPFService(id);

  return res.status(200).json({ cpf });
}

async function deleteCPFController(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const user = res.locals.user;

  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const result = await deleteCPFService(id);

  return res.status(200).json({ message: "CPF deletado com sucesso", result });
}

export { createCPFController, getCPFController, deleteCPFController };
