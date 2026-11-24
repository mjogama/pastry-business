import { signToken } from "@shared/auth/tokens";

/** A Cookie header carrying a valid access token, for tests that call protected routes. */
export const authCookie = () => `access_token=${signToken("access", "00000000-0000-7000-8000-000000000000")}`;
