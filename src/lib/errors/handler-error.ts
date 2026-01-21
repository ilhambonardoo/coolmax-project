import { NextResponse } from "next/server";
import { ResponseError } from "./response-error";

export function handleError(error: unknown) {
  if (error instanceof ResponseError) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
      },
      { status: error.statusCode },
    );
  }

  return NextResponse.json(
    {
      status: "error",
      message: "Internal server error",
    },
    { status: 500 },
  );
}
