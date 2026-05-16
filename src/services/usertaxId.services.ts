import config from "../config/config.js";
import { prisma } from "../lib/prisma.js";
import crypto, { createCipheriv, createDecipheriv } from "node:crypto";

async function createCPFService(userId: string, CPF: string) {
  if (!userId) {
    throw new Error("UserId missing");
  }

  const algorithm = config.cipheriv_algorithm;
  const password = config.cipheriv_password;

  // gerar chave
  const key = crypto.scryptSync(password, "salt", 24);

  // gerar IV
  const iv = crypto.randomBytes(16);

  // criar cipher
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  // criptografar
  let encrypted = cipher.update(CPF, "utf8", "hex");
  encrypted += cipher.final("hex");

  // opcional: salvar IV junto (IMPORTANTE para descriptografar depois)
  const result = iv.toString("hex") + ":" + encrypted;

  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      CPF: result,
    },
  });
}

async function getCPFService(userId: string) {
  if (!userId) {
    throw new Error("UserId missing");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { CPF: true },
  });

  if (!user || !user.CPF) {
    throw new Error("CPF not found");
  }

  const algorithm = config.cipheriv_algorithm;
  const password = config.cipheriv_password;
  const key = crypto.scryptSync(password, "salt", 24);

  const [ivHex, encrypted] = user.CPF.split(":");
  const iv = Buffer.from(ivHex, "hex");

  const decipher = createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

async function deleteCPFService(userId: string) {
  if (!userId) {
    throw new Error("UserId missing");
  }
  return await prisma.user.update({
    where: { id: userId },
    data: { CPF: null },
  });
}

export { createCPFService, getCPFService, deleteCPFService };
