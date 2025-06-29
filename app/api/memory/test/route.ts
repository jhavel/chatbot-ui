import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { saveEnhancedMemory, getRelevantMemories } from "@/lib/memory-system"

export async function POST(request: NextRequest) {
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

    const { action } = await request.json()

    if (action === "save_test_memories") {
      // Save some test memories
      const testMemories = [
        "My name is John and I'm a software developer",
        "I prefer working with TypeScript and React",
        "I like to work on AI and machine learning projects",
        "My favorite programming language is Python",
        "I enjoy hiking and outdoor activities on weekends"
      ]

      const savedMemories = []
      for (const memory of testMemories) {
        try {
          const saved = await saveEnhancedMemory(supabase, memory, user.id)
          savedMemories.push(saved)
          console.log(`✅ Saved test memory: ${memory}`)
        } catch (error) {
          console.error(`❌ Failed to save memory: ${memory}`, error)
        }
      }

      return NextResponse.json({
        success: true,
        message: `Saved ${savedMemories.length} test memories`,
        memories: savedMemories
      })
    }

    if (action === "test_retrieval") {
      // Test memory retrieval
      const testQuery = "What is my name and what do I do for work?"
      const relevantMemories = await getRelevantMemories(
        supabase,
        user.id,
        testQuery,
        5,
        0.3
      )

      return NextResponse.json({
        success: true,
        query: testQuery,
        foundMemories: relevantMemories.length,
        memories: relevantMemories
      })
    }

    if (action === "test_save") {
      // Test memory saving
      const testMemory =
        "I am testing the memory system to see if it works properly"
      const { saveEnhancedMemory } = await import("@/lib/memory-system")

      try {
        const savedMemory = await saveEnhancedMemory(
          supabase,
          testMemory,
          user.id
        )
        return NextResponse.json({
          success: true,
          action: "test_save",
          memory: savedMemory
        })
      } catch (error) {
        return NextResponse.json({
          success: false,
          action: "test_save",
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in memory test:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
