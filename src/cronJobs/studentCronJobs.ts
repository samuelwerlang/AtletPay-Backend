import { StudentPlanStatus, UserRole } from "@prisma/client";
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

async function reconcileStudentUserLinks() {
  try {
    const pendingStudents = await prisma.student.findMany({
      where: {
        studentUserId: null,
        email: { not: null },
      },
      select: { id: true, email: true },
    });

    if (!pendingStudents.length) {
      console.log("Cronjob: no student-user links to reconcile");
      return;
    }

    let linkedCount = 0;
    let skippedCount = 0;

    for (const student of pendingStudents) {
      const normalizedEmail = student.email?.trim();
      if (!normalizedEmail) {
        skippedCount += 1;
        continue;
      }

      const studentUser = await prisma.user.findFirst({
        where: {
          role: UserRole.STUDENT,
          email: { equals: normalizedEmail, mode: "insensitive" },
          studentProfile: null,
        },
        select: { id: true },
      });

      if (!studentUser) {
        skippedCount += 1;
        continue;
      }

      await prisma.student.update({
        where: { id: student.id },
        data: { studentUserId: studentUser.id },
      });

      linkedCount += 1;
    }

    console.log(
      `Cronjob: reconciled ${linkedCount} student-user links (skipped ${skippedCount})`,
    );
  } catch (error) {
    console.error("Error in student-link reconciliation Cronjob:", error);
  }
}

export { deactivateStudents, reconcileStudentUserLinks };
