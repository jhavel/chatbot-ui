import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Memory list endpoint called")
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log("❌ Authentication failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ User authenticated:", user.id)

    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get("user_id")

    if (!user_id) {
      console.log("❌ Missing user_id parameter")
      return NextResponse.json(
        { error: "Missing user_id parameter" },
        { status: 400 }
      )
    }

    // Verify the user is requesting their own memories
    if (user_id !== user.id) {
      console.log("❌ User ID mismatch:", user_id, "vs", user.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("📡 Querying memories for user:", user_id)

    // Get memories with default values for null columns
    const { data, error } = await supabase
      .from("memories")
      .select(
        `
        id, 
        content, 
        created_at, 
        relevance_score, 
        access_count, 
        last_accessed, 
        semantic_tags, 
        memory_type, 
        importance_score, 
        user_id
      `
      )
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Apply default values in JavaScript instead of SQL
    const memoriesWithDefaults = (data || []).map(memory => ({
      ...memory,
      relevance_score: memory.relevance_score || 1.0,
      access_count: memory.access_count || 0,
      semantic_tags: memory.semantic_tags || [],
      memory_type: memory.memory_type || "general",
      importance_score: memory.importance_score || 0.5
    }))

    console.log(
      "✅ Memories retrieved:",
      memoriesWithDefaults.length,
      "memories"
    )
    return NextResponse.json(memoriesWithDefaults)
  } catch (error) {
    console.error("❌ Unexpected error in memory list:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
