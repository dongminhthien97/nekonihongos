export type UserRole = "USER" | "ADMIN";

export type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";

export interface User {
  id: number;
  username: string;
  fullName?: string;
  email: string;
  role: UserRole | string;

  avatar?: string;
  avatarUrl?: string;

  level: number;
  points: number;
  streak?: number;
  longestStreak?: number;

  joinDate: string;
  lastLoginDate?: string;
  status?: UserStatus | string;

  vocabularyProgress?: number;
  kanjiProgress?: number;
  grammarProgress?: number;
  exerciseProgress?: number;
}

