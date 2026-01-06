import { NextResponse } from "next/server";
import { db } from "@/services/firebase.service";

export async function GET() {
  try {
    const snapshot = await db.ref("/.info/connected").get();
    const isConnected = snapshot.val();

    return NextResponse.json({
      success: true,
      firebase_connected: isConnected,
      message: isConnected ? "Firebase connected" : "Firebase disconnected",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: `Firebase error: ${error}`,
      },
      { status: 500 }
    );
  }
}
