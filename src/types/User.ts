// src/types/User.ts
export interface User {
  id: number;
  username: string;
  fullName?: string;
  email: string;
  role: string;
  avatar?: string;
  avatarUrl?: string;
  level: number;
  points: number;
  streak?: number;
  vocabularyProgress: number;
  kanjiProgress: number;
  grammarProgress: number;
  exerciseProgress: number;
  joinDate: string;
}