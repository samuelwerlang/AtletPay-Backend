import { prisma } from "../lib/prisma.js";
async function createStudentService(studentInfo) {
    if (!studentInfo.userAuth0Id) {
        throw new Error("Student must be linked to a user");
    }
    if (!studentInfo.name?.trim()) {
        throw new Error("Student name is required");
    }
    const user = await prisma.user.findUnique({
        where: { auth0Id: studentInfo.userAuth0Id },
    });
    if (!user) {
        throw new Error("Could not find user (personal)");
    }
    try {
        return await prisma.student.create({
            data: {
                name: studentInfo.name,
                email: studentInfo.email,
                phone: studentInfo.phone,
                userId: user.id,
            },
        });
    }
    catch (error) {
        if (error.code === "P2002") {
            throw new Error("Student with this email already exists");
        }
        throw error;
    }
}
export default createStudentService;
