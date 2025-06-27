import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { updateMemoryAccess } from "@/lib/memory-system"

export async function POST(
  request: NextRequest,
  { params }: { params: { memoryId: string } }
) {
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

    const memoryId = params.memoryId

    if (!memoryId) {
      return NextResponse.json({ error: "Missing memory ID" }, { status: 400 })
    }

    // Verify the user owns this memory
    const { data: memory, error: memoryError } = await supabase
      .from("memories")
      .select("user_id")
      .eq("id", memoryId)
      .single()

    if (memoryError || !memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 })
    }

    if (memory.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await updateMemoryAccess(supabase, memoryId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating memory access:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
