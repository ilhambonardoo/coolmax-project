import { NextRequest, NextResponse } from "next/server";
import { sensorService } from "@/services/sensors.service";
import { ResponseError } from "@/lib/errors/response-error";

export async function GET() {
  try {
    const data = await sensorService.readSensorData();

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: "Sensor data not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ResponseError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pwm, rpm, berat } = body;

    if (pwm === undefined || rpm === undefined || berat === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: pwm, rpm, berat",
        },
        { status: 400 }
      );
    }

    await sensorService.writeSensorData({
      pwm: Number(pwm),
      rpm: Number(rpm),
      berat: Number(berat),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Sensor data written successfully",
      },
      { status: 201 }
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
