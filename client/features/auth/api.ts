import type { AuthUser, LoginInput } from "@common/modules/auth";

import { authClient } from "@/lib/api/auth-client";

/** POST /auth/login. On success the server sets the access and refresh cookies. */
export const login = (input: LoginInput) => authClient.post<AuthUser>("/auth/login", input);

/** GET /auth/me. Refreshes the session once if the access cookie is stale; goes to the login page if that fails. */
export const getSession = () => authClient.get<AuthUser>("/auth/me");
