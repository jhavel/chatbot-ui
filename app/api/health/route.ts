import { NextResponse } from "next/server"
import {
  checkSupabaseConnection,
  checkSupabaseStorage
} from "@/lib/supabase/health-check"

export async function GET() {
  try {
    // Validate environment configuration
    try {
      // Import the validation function dynamically
      const { validateSupabaseConfig } = await import(
        "@/lib/supabase/validation.js"
      )
      validateSupabaseConfig()
    } catch (error) {
      return NextResponse.json(
        {
          status: "unhealthy",
          error: "Configuration error",
          message:
            error instanceof Error
              ? error.message
              : "Unknown configuration error"
        },
        { status: 503 }
      )
    }

    // Check database connection
    const dbHealthy = await checkSupabaseConnection()

    if (!dbHealthy) {
      return NextResponse.json(
        {
          status: "unhealthy",
          database: "disconnected",
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      )
    }

    // Check storage connection
    const storageHealthy = await checkSupabaseStorage()

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      storage: storageHealthy ? "connected" : "disconnected",
      version: process.env.npm_package_version || "unknown"
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
