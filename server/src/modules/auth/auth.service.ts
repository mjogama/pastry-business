import bcrypt from "bcryptjs";

import type { AuthUser, LoginInput } from "./auth.schema";
import { UnauthorizedError } from "@shared/errors/AppError";
import { signToken, verifyToken } from "@shared/auth/tokens";
import type { AuthRepository, UserRecord } from "./auth.repository";

export interface Session {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// Compared against when the username is unknown, so a miss takes as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const toUser = ({ id, username }: UserRecord): AuthUser => ({ id, username });

const toSession = (record: UserRecord): Session => ({
  user: toUser(record),
  accessToken: signToken("access", record.id),
  refreshToken: signToken("refresh", record.id),
});

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async login({ username, password }: LoginInput): Promise<Session> {
    const record = await this.repository.findByUsername(username);
    const matches = await bcrypt.compare(password, record?.passwordHash ?? DUMMY_HASH);
    if (!record || !matches) throw new UnauthorizedError("Invalid username or password");
    return toSession(record);
  }

  async refresh(refreshToken: string): Promise<Session> {
    const record = await this.repository.findById(verifyToken("refresh", refreshToken));
    if (!record) throw new UnauthorizedError("Invalid or expired session");
    return toSession(record);
  }

  async me(userId: string): Promise<AuthUser> {
    const record = await this.repository.findById(userId);
    if (!record) throw new UnauthorizedError("Invalid or expired session");
    return toUser(record);
  }
}
