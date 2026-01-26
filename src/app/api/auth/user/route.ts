import { handleError } from "@/lib/errors/handler-error";
import { AuthMiddleware, getTokenFromRequest } from "@/middleware/auth";
import { UserService } from "@/services/auth/user.services";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authResponse = AuthMiddleware(request);
    if (authResponse.status === 401) {
      return authResponse;
    }

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        {
          status: "error",
          message: "Unauthorized: No token provided",
        },
        { status: 401 },
      );
    }

    const response = await UserService.get(token);

    return NextResponse.json(
      {
        status: "Success",
        data: response,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return handleError(error);
  }
}
