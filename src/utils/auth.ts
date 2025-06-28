import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!;

export const createAccessToken = (user: any) =>
	jwt.sign({ id: user._id, username: user.username }, ACCESS_TOKEN_SECRET, {
		expiresIn: "15m",
	});

export const createRefreshToken = (user: any) =>
	jwt.sign({ id: user._id }, REFRESH_TOKEN_SECRET, {
		expiresIn: "7d",
	});

export const verifyRefreshToken = (token: string) => jwt.verify(token, REFRESH_TOKEN_SECRET);

export const decodeUserFromToken = (authHeader?: string) => {
	if (!authHeader) return null;

	const token = authHeader.replace("Bearer ", "").trim();
	if (!token) return null;

	try {
		const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
		return payload;
	} catch (err) {
		console.warn("❌ Invalid access token");
		return null;
	}
};
