import { UserRole } from "@supseal/database";

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  brandId: string | null;
}
