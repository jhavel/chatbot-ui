import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { saveMemoryUnified } from "@/lib/memory-interface"

export async function POST(request: NextRequest) {
  console.log("[DEBUG] /api/memory/save route hit")
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, user_id } = await request.json()

    if (!content || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify the user is saving their own memory
    if (user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Pass the session-aware supabase client to saveMemoryUnified
    const memory = await saveMemoryUnified(supabase, {
      content,
      user_id,
      source: "user",
      context: { api: "/api/memory/save" },
      validationLevel: "normal"
    })

    console.log("💾 Memory saved successfully:", memory.id)

    return NextResponse.json(memory)
  } catch (error) {
    console.error("Error saving memory:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
