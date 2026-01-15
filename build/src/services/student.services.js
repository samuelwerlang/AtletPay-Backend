import { prisma } from "../lib/prisma.js";
async function createStudentService(studentInfo) {
    if (!studentInfo.personalAuth0Id || !studentInfo.name) {
        throw new Error("Missing required student data");
    }
    const personal = await prisma.user.findUnique({
        where: {
            auth0Id: studentInfo.personalAuth0Id
        }
    });
    if (!personal) {
        throw new Error("Could not find user (personal)");
    }
    // Verifica aluno duplicado para o MESMO personal
    if (studentInfo.email) {
        const existingStudent = await prisma.student.findFirst({
            where: {
                personalId: studentInfo.personalAuth0Id,
                email: studentInfo.email,
            },
        });
        if (existingStudent) {
            return existingStudent;
        }
    }
    const createdStudent = await prisma.student.create({
        data: {
            name: studentInfo.name,
            email: studentInfo.email,
            phone: studentInfo.phone,
            personalId: personal.id,
        },
    });
    return createdStudent;
}
export default createStudentService;
