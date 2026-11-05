import { createRemoteJWKSet, jwtVerify } from "jose";

const authBaseUrl = (
  process.env.BETTER_AUTH_URL ||
  process.env.CLIENT_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

const jwks = createRemoteJWKSet(new URL(`${authBaseUrl}/api/auth/jwks`));

export async function verifyToken(request, response, next) {
  const authorization = request.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return response.status(401).json({ message: "Authentication required." });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return response.status(401).json({ message: "Authentication required." });
  }

  try {
    const { payload } = await jwtVerify(token, jwks);

    request.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      image: payload.image,
    };

    return next();
  } catch (error) {
    console.error("Token verification failed:", error.code || error.message);

    return response.status(401).json({ message: "Invalid or expired token." });
  }
}
