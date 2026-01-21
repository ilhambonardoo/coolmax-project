import { NextResponse } from "next/server";
import { sensorService } from "@/services/firebase/sensors.service";

export async function GET() {
  try {
    const history = sensorService.getSensorHistory();
    return NextResponse.json(
      {
        success: true,
        data: history,
        count: history.length,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: `${error}`,
      },
      { status: 500 }
    );
  }
}
