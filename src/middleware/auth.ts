import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "";

export function AuthMiddleware(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json(
      {
        status: "error",
        message: "Unauthorized no token provided",
      },
      {
        status: 401,
      },
    );
  }

  try {
    jwt.verify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Unauthorized invalid token or expired token",
        error,
      },
      { status: 401 },
    );
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  return token || null;
}
