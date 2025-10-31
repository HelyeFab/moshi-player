import { NextResponse } from "next/server"

export async function GET() {
  try {
    const timestamp = new Date().toISOString()

    return NextResponse.json(
      {
        status: "healthy",
        timestamp,
        service: "yt-player",
        version: "1.0.0"
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
