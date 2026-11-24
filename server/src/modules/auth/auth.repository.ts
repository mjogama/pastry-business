import db from "@app/config/db";

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
}

export interface AuthRepository {
  findByUsername(username: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
}

export class PrismaAuthRepository implements AuthRepository {
  findByUsername(username: string): Promise<UserRecord | null> {
    return db.user.findUnique({ where: { username } });
  }

  findById(id: string): Promise<UserRecord | null> {
    return db.user.findUnique({ where: { id } });
  }
}
