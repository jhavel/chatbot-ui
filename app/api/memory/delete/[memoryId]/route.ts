import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { memoryId: string } }
) {
  try {
    console.log("🗑️ Memory delete endpoint called for:", params.memoryId)
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

    const { memoryId } = params

    if (!memoryId) {
      console.log("❌ Missing memory ID")
      return NextResponse.json({ error: "Missing memory ID" }, { status: 400 })
    }

    // First, verify the memory belongs to the user
    const { data: memory, error: fetchError } = await supabase
      .from("memories")
      .select("id, user_id, content")
      .eq("id", memoryId)
      .single()

    if (fetchError || !memory) {
      console.error("❌ Memory not found:", fetchError)
      return NextResponse.json({ error: "Memory not found" }, { status: 404 })
    }

    // Verify ownership
    if (memory.user_id !== user.id) {
      console.log(
        "❌ Memory ownership mismatch:",
        memory.user_id,
        "vs",
        user.id
      )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ Memory ownership verified, proceeding with deletion")

    // Delete the memory
    const { error: deleteError } = await supabase
      .from("memories")
      .delete()
      .eq("id", memoryId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("❌ Database error during deletion:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete memory" },
        { status: 500 }
      )
    }

    console.log("✅ Memory deleted successfully:", memoryId)

    return NextResponse.json({
      success: true,
      message: "Memory deleted successfully",
      deletedMemoryId: memoryId
    })
  } catch (error) {
    console.error("❌ Unexpected error in memory delete:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
