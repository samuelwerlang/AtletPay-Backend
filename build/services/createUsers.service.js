import { prisma } from "../lib/prisma.js";
async function createUserService(userCredentials) {
    if (!userCredentials) {
        throw new Error("Could not reach user credentials");
    }
    const existingUser = await prisma.user.findUnique({
        where: { auth0Id: userCredentials.auth0Id },
    });
    if (existingUser) {
        return existingUser;
    }
    const createdUser = await prisma.user.create({ data: userCredentials });
    return createdUser;
}
export default createUserService;
