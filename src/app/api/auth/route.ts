import { handleError } from "@/lib/errors/handler-error";
import { UserService } from "@/services/auth/user.services";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    const response = await UserService.logout();

    return NextResponse.json(
      {
        status: "Success",
        data: response,
      },
      { status: 200 },
    );
  } catch (error) {
    handleError(error);
  }
}
