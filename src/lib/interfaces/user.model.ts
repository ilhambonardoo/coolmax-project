import { User as PrismaUser } from "@/generated/prisma/client";

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  name?: string;
  role: string;
  token?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  name: string;
}

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  username: string;
  name: string;
  password: string;
}

export interface User extends PrismaUser {
  user?: PrismaUser;
}

export function toUserResponse(user: PrismaUser, token?: string): UserResponse {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name || undefined,
    role: user.role,
    token: token || "",
  };
}
