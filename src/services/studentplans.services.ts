import { prisma } from "../lib/prisma.js";

interface IStundentPlan {
  planId: string;
  studentId: string;
  startDate: number;
  endDate: number;
}

//async function createStudentPlanService()
