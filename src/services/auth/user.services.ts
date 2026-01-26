import { prisma } from "@/app/prisma";
import {
  CreateUserRequest,
  toUserResponse,
  UserResponse,
  LoginUserRequest,
  UpdateUserRequest,
  User,
} from "@/lib/interfaces/user.model";
import { ResponseError } from "@/lib/errors/response-error";
import { UserValidation } from "@/lib/validation/user.validation";
import { Validation } from "@/lib/validation/validation";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";

export class UserService {
  static async register(request: CreateUserRequest): Promise<UserResponse> {
    const registerRequest = Validation.validate(
      UserValidation.REGISTER,
      request,
    );

    const existsingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: registerRequest.email },
          { password: registerRequest.password },
        ],
      },
    });

    if (existsingUser) {
      throw new ResponseError(400, "Email or Password already exists");
    }

    registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

    const newUser = await prisma.user.create({
      data: registerRequest,
    });

    return toUserResponse(newUser);
  }

  static async generateToken(user: User): Promise<string> {
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return token;
  }

  static async login(request: LoginUserRequest): Promise<UserResponse> {
    const loginRequest = Validation.validate(UserValidation.LOGIN, request);

    const user = await prisma.user.findFirst({
      where: {
        email: loginRequest.email,
      },
    });

    if (!user) {
      throw new ResponseError(401, "Email or password wrong");
    }

    const isValidPassword = await bcrypt.compare(
      loginRequest.password,
      user?.password,
    );

    if (!isValidPassword) {
      throw new ResponseError(401, "Email or password wrong");
    }

    const accessToken = await this.generateToken(user);
    return toUserResponse(user, accessToken);
  }

  static async get(token: string): Promise<UserResponse> {
    try {
      const decode = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
      };

      const user = await prisma.user.findUnique({
        where: {
          id: decode.id,
          email: decode.email,
        },
      });

      if (!user) {
        throw new ResponseError(404, "User Not Found");
      }

      const accessToken = await this.generateToken(user);
      return toUserResponse(user, accessToken);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ResponseError(401, "Invalid or expired token");
      }
      throw error;
    }
  }

  static async update(
    user: User,
    request: UpdateUserRequest,
  ): Promise<UserResponse> {
    const updateRequest = Validation.validate(UserValidation.UPDATE, request);

    if (updateRequest.name) {
      user.name = updateRequest.name;
    }

    if (updateRequest.username) {
      user.username = updateRequest.username;
    }

    if (updateRequest.password) {
      user.password = await bcrypt.hash(updateRequest.password, 10);
    }

    const result = await prisma.user.update({
      where: {
        username: user.username,
      },
      data: user,
    });

    return toUserResponse(result);
  }

  static async logout(): Promise<{ message: string }> {
    return { message: "Logout Success" };
  }
}
