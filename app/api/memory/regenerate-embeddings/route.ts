import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import {
  generateEmbedding,
  extractSemanticTags,
  determineMemoryType,
  calculateImportanceScore
} from "@/lib/memory-system"

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

    console.log("🔄 Starting embedding regeneration for user:", user.id)

    // Get memories without embeddings
    const { data: memoriesWithoutEmbeddings, error: fetchError } =
      await supabase
        .from("memories")
        .select("id, content, user_id")
        .eq("user_id", user.id)
        .is("embedding", null)

    if (fetchError) {
      console.error("❌ Error fetching memories:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    console.log(
      `📊 Found ${memoriesWithoutEmbeddings?.length || 0} memories without embeddings`
    )

    if (!memoriesWithoutEmbeddings || memoriesWithoutEmbeddings.length === 0) {
      return NextResponse.json({
        message: "All memories already have embeddings",
        processed: 0
      })
    }

    let processed = 0
    let errors = 0

    // Process each memory
    for (const memory of memoriesWithoutEmbeddings) {
      try {
        console.log(
          `🔄 Processing memory ${processed + 1}/${memoriesWithoutEmbeddings.length}:`,
          memory.content.substring(0, 50) + "..."
        )

        // Generate embedding
        const embedding = await generateEmbedding(memory.content)

        // Extract semantic tags
        const semanticTags = await extractSemanticTags(memory.content)

        // Determine memory type
        const memoryType = determineMemoryType(memory.content)

        // Calculate importance score
        const importanceScore = calculateImportanceScore(
          memory.content,
          memoryType
        )

        // Update the memory with embeddings and metadata
        const { error: updateError } = await supabase
          .from("memories")
          .update({
            embedding: embedding,
            semantic_tags: semanticTags,
            memory_type: memoryType,
            importance_score: importanceScore,
            relevance_score: 1.0
          })
          .eq("id", memory.id)

        if (updateError) {
          console.error(`❌ Error updating memory ${memory.id}:`, updateError)
          errors++
        } else {
          console.log(`✅ Successfully updated memory ${memory.id}`)
          processed++
        }
      } catch (error) {
        console.error(`❌ Error processing memory ${memory.id}:`, error)
        errors++
      }
    }

    console.log(
      `🎉 Embedding regeneration complete: ${processed} processed, ${errors} errors`
    )

    return NextResponse.json({
      message: "Embedding regeneration complete",
      total: memoriesWithoutEmbeddings.length,
      processed,
      errors
    })
  } catch (error) {
    console.error("❌ Error in embedding regeneration:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
