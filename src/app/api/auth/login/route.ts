import { handleError } from "@/lib/errors/handler-error";
import { UserService } from "@/services/auth/user.services";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await UserService.login(body);

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
