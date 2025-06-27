import { NextRequest, NextResponse } from "next/server"
import { getServerProfile } from "@/lib/server/server-chat-helpers"
import {
  summarizeMemory,
  summarizeMemoryWithType,
  shouldSummarize
} from "@/lib/memory-summarization"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export async function POST(request: NextRequest) {
  try {
    const profile = await getServerProfile()
    const { action, memoryId, content, memoryType } = await request.json()

    console.log(
      `📝 Memory summarization request: ${action} for user ${profile.user_id}`
    )

    switch (action) {
      case "summarize_single":
        // Summarize a single piece of content
        if (!content) {
          return NextResponse.json(
            { error: "Content is required for summarization" },
            { status: 400 }
          )
        }

        const summarizedContent = memoryType
          ? await summarizeMemoryWithType(content, memoryType)
          : await summarizeMemory(content)

        return NextResponse.json({
          success: true,
          action: "summarize_single",
          original: content,
          summarized: summarizedContent,
          shouldSummarize: shouldSummarize(content)
        })

      case "summarize_memory":
        // Summarize an existing memory by ID
        if (!memoryId) {
          return NextResponse.json(
            { error: "Memory ID is required" },
            { status: 400 }
          )
        }

        // Get the memory from database
        const { data: memory, error: fetchError } = await supabase
          .from("memories")
          .select("content, memory_type")
          .eq("id", memoryId)
          .eq("user_id", profile.user_id)
          .single()

        if (fetchError || !memory) {
          return NextResponse.json(
            { error: "Memory not found" },
            { status: 404 }
          )
        }

        const summarizedMemory = memory.memory_type
          ? await summarizeMemoryWithType(memory.content, memory.memory_type)
          : await summarizeMemory(memory.content)

        // Update the memory with summarized content
        const { error: updateError } = await supabase
          .from("memories")
          .update({
            content: summarizedMemory,
            updated_at: new Date().toISOString()
          })
          .eq("id", memoryId)
          .eq("user_id", profile.user_id)

        if (updateError) {
          console.error("Error updating summarized memory:", updateError)
          return NextResponse.json(
            { error: "Failed to update memory" },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          action: "summarize_memory",
          memoryId,
          original: memory.content,
          summarized: summarizedMemory
        })

      case "find_long_memories":
        // Find memories that should be summarized
        const { data: longMemories, error: longMemoriesError } = await supabase
          .from("memories")
          .select("id, content, memory_type, created_at")
          .eq("user_id", profile.user_id)
          .gte("content", "200") // Filter by content length (approximate)
          .order("created_at", { ascending: false })

        if (longMemoriesError) {
          console.error("Error fetching long memories:", longMemoriesError)
          return NextResponse.json(
            { error: "Failed to fetch memories" },
            { status: 500 }
          )
        }

        // Filter memories that actually need summarization
        const memoriesToSummarize =
          longMemories?.filter(memory => shouldSummarize(memory.content)) || []

        return NextResponse.json({
          success: true,
          action: "find_long_memories",
          memories: memoriesToSummarize.map(memory => ({
            id: memory.id,
            content: memory.content,
            memory_type: memory.memory_type,
            created_at: memory.created_at,
            shouldSummarize: shouldSummarize(memory.content)
          }))
        })

      case "batch_summarize":
        // Summarize multiple memories at once
        const { memoryIds } = await request.json()

        if (!memoryIds || !Array.isArray(memoryIds)) {
          return NextResponse.json(
            { error: "Memory IDs array is required" },
            { status: 400 }
          )
        }

        const results = []
        for (const id of memoryIds) {
          try {
            // Get the memory
            const { data: memory, error: fetchError } = await supabase
              .from("memories")
              .select("content, memory_type")
              .eq("id", id)
              .eq("user_id", profile.user_id)
              .single()

            if (fetchError || !memory) {
              results.push({ id, error: "Memory not found" })
              continue
            }

            // Summarize if needed
            if (shouldSummarize(memory.content)) {
              const summarized = memory.memory_type
                ? await summarizeMemoryWithType(
                    memory.content,
                    memory.memory_type
                  )
                : await summarizeMemory(memory.content)

              // Update the memory
              const { error: updateError } = await supabase
                .from("memories")
                .update({
                  content: summarized,
                  updated_at: new Date().toISOString()
                })
                .eq("id", id)
                .eq("user_id", profile.user_id)

              if (updateError) {
                results.push({ id, error: "Failed to update" })
              } else {
                results.push({
                  id,
                  success: true,
                  original: memory.content,
                  summarized
                })
              }
            } else {
              results.push({
                id,
                skipped: true,
                reason: "No summarization needed"
              })
            }
          } catch (error) {
            results.push({ id, error: "Processing failed" })
          }
        }

        return NextResponse.json({
          success: true,
          action: "batch_summarize",
          results
        })

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Supported actions: summarize_single, summarize_memory, find_long_memories, batch_summarize"
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("❌ Memory summarization error:", error)
    return NextResponse.json(
      { error: "Internal server error during memory summarization" },
      { status: 500 }
    )
  }
}
