import createUserService from "../services/createUsers.service.js";
async function createUserController(req, res) {
    try {
        const accessToken = req.headers.authorization?.split(" ")[1];
        if (!accessToken) {
            return res.status(401).json({ error: "Missing access token" });
        }
        const userInfoRes = await fetch("https://atletpay.us.auth0.com/userinfo", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json",
            },
        });
        if (!userInfoRes.ok) {
            const text = await userInfoRes.text();
            return res.status(401).json({
                error: "Failed to fetch user info from Auth0",
                details: text,
            });
        }
        const userInfo = await userInfoRes.json();
        const { sub, email, name } = userInfo;
        if (!sub || !email) {
            return res.status(400).json({
                error: "Invalid user info returned from Auth0",
            });
        }
        const user = await createUserService({
            auth0Id: sub,
            email,
            name,
        });
        return res.status(200).json(user);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
export default createUserController;
