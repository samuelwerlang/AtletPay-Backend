// import * as z from "zod";
// import { Request, Response } from "express";
// import {
//   createStudentPlanService,
//   cancelStudentPlanService,
// } from "../services/studentplans.services.js";

// const studentPlanSchema = z.object({
//   studentId: z.uuid(),
//   planId: z.uuid(),
//   //   startDate: z.date(),
//   //   endDate: z.date().optional(),
//   //   priceAtPurchase: z.int().positive(),
// });

// const idStudentPlan = z.object({
//   studentPlanId: z.uuid(),
// });

// // async function createStudentPlanController(req: Request, res: Response) {
// //   const validatedOutput = studentPlanSchema.parse(req.body);
// //   const user = res.locals.user;
// //   if (!user?.id) {
// //     return res
// //       .status(401)
// //       .json({ message: "User not loaded in request context" });
// //   }
// //   const studentPlan = await createStudentPlanService(validatedOutput, user!.id);
// //   return res.status(201).json(studentPlan);
// // }

// async function cancelStudentPlanController(req: Request, res: Response) {
//   const validatedOutput = idStudentPlan.parse(req.params);
//   const user = res.locals.user;
//   if (!user?.id) {
//     return res
//       .status(401)
//       .json({ message: "User not loaded in request context" });
//   }
//   const canceledStudentPlan = await cancelStudentPlanService(
//     validatedOutput.studentPlanId,
//     user!.id,
//   );
//   return res.status(200).json(canceledStudentPlan);
// }

// export { createStudentPlanController, cancelStudentPlanController };
