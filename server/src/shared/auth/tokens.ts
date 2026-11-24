import jwt from "jsonwebtoken";

import { env } from "@app/config/env";
import { UnauthorizedError } from "@shared/errors/AppError";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

export type TokenType = "access" | "refresh";

const secrets = { access: env.JWT_ACCESS_SECRET, refresh: env.JWT_REFRESH_SECRET };
const ttls = { access: env.JWT_ACCESS_TTL_SECONDS, refresh: env.JWT_REFRESH_TTL_SECONDS };

/** Signs a token for a user. Without a TTL in the env the token has no `exp` and never expires. */
export const signToken = (type: TokenType, userId: string): string =>
  jwt.sign({ type }, secrets[type], { subject: userId, ...(ttls[type] && { expiresIn: ttls[type] }) });

/** Returns the user id a valid token of this type was issued to; throws `UnauthorizedError` otherwise. */
export const verifyToken = (type: TokenType, token: string): string => {
  try {
    const payload = jwt.verify(token, secrets[type], { algorithms: ["HS256"] });
    if (typeof payload !== "string" && payload.type === type && payload.sub) return payload.sub;
  } catch {
    // fall through to the error below
  }
  throw new UnauthorizedError("Invalid or expired session");
};
