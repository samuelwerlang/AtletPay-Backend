import * as z from "zod";
import createSaasPlanService from "../services/createSaasplan.services.js";
import { SaasPlanType } from "@prisma/client";
const createSaasPlanSchema = z.object({
    name: z.string().min(1),
    price: z.number().positive(),
    maxPlans: z.number().int().positive().optional(),
    maxStudents: z.number().int().positive().optional(),
    stripePriceId: z.string().min(1),
    type: z.enum(SaasPlanType),
});
async function createSaasPlanController(req, res) {
    try {
        const validatedData = createSaasPlanSchema.parse(req.body);
        const saasPlan = await createSaasPlanService({
            name: validatedData.name,
            price: validatedData.price,
            maxPlans: validatedData.maxPlans,
            maxStudents: validatedData.maxStudents,
            StripePriceId: validatedData.stripePriceId, // 🔑 mapeamento
            type: validatedData.type,
        });
        return res.status(201).json(saasPlan);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues,
            });
        }
        console.error(error);
        return res.status(500).json({
            message: "Failed to create saas plan",
        });
    }
}
export default createSaasPlanController;
