import { StudentPlanStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

async function deactivateStudents() {
  try {
    const now = new Date();
    const expiredStudentPlans = await prisma.studentPlan.findMany({
      where: {
        status: StudentPlanStatus.SUCCEEDED,
        endDate: { lt: now },
      },
      select: { id: true, studentId: true },
    });

    if (expiredStudentPlans.length > 0) {
      const studentIds = expiredStudentPlans.map((p) => p.studentId);
      const studentPlanIds = expiredStudentPlans.map((p) => p.id);

      // Deactivate students only if they were active
      await prisma.student.updateMany({
        where: {
          id: { in: studentIds },
          isActive: true,
        },
        data: { isActive: false },
      });

      // Mark all plans as expired for avoiding reprocessing
      await prisma.studentPlan.updateMany({
        where: { id: { in: studentPlanIds } },
        data: { status: StudentPlanStatus.EXPIRED },
      });

      console.log(`Cronjob: ${studentIds.length} students deactivated`);
    } else {
      console.log("Cronjob: no students to deactivate");
    }
  } catch (error) {
    console.error("Error in Student Cronjob:", error);
  }
}

export { deactivateStudents };
