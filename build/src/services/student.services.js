import { prisma } from "../lib/prisma.js";
async function createStudentService(studentInfo) {
    if (!studentInfo.personalId || !studentInfo.name) {
        throw new Error("Missing required student data");
    }
    // Verifica aluno duplicado para o MESMO personal
    if (studentInfo.email) {
        const existingStudent = await prisma.student.findFirst({
            where: {
                personalId: studentInfo.personalId,
                email: studentInfo.email,
            },
        });
        if (existingStudent) {
            return existingStudent;
        }
    }
    const createdStudent = await prisma.student.create({
        data: studentInfo,
    });
    return createdStudent;
}
export default createStudentService;
