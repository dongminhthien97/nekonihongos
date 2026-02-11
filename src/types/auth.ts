import type { User } from "./User";

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

