import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
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

    const debugInfo: any = {
      user_id: user.id,
      timestamp: new Date().toISOString()
    }

    // Check total memories count
    const { count: totalMemories, error: countError } = await supabase
      .from("memories")
      .select("*", { count: "exact", head: true })

    debugInfo.totalMemories = totalMemories
    debugInfo.countError = countError

    // Check user's memories count
    const { count: userMemories, error: userCountError } = await supabase
      .from("memories")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    debugInfo.userMemories = userMemories
    debugInfo.userCountError = userCountError

    // Get sample memories
    const { data: sampleMemories, error: sampleError } = await supabase
      .from("memories")
      .select("id, content, created_at, user_id")
      .eq("user_id", user.id)
      .limit(5)
      .order("created_at", { ascending: false })

    debugInfo.sampleMemories = sampleMemories
    debugInfo.sampleError = sampleError

    // Check memory clusters
    const { data: clusters, error: clustersError } = await supabase
      .from("memory_clusters")
      .select("id, name, memory_count, user_id")
      .eq("user_id", user.id)

    debugInfo.clusters = clusters
    debugInfo.clustersError = clustersError

    // Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from("memories")
      .select("*")
      .limit(1)

    debugInfo.tableColumns =
      tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : []
    debugInfo.tableError = tableError

    // Check if memories have embeddings
    const { data: embeddingCheck, error: embeddingError } = await supabase
      .from("memories")
      .select("id, content, embedding")
      .eq("user_id", user.id)
      .limit(5)

    debugInfo.embeddingCheck = embeddingCheck?.map(m => ({
      id: m.id,
      content: m.content.substring(0, 50) + "...",
      hasEmbedding: m.embedding !== null && m.embedding !== undefined
    }))
    debugInfo.embeddingError = embeddingError

    // Count memories with and without embeddings
    const { count: withEmbeddings, error: withEmbeddingsError } = await supabase
      .from("memories")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("embedding", "is", null)

    const { count: withoutEmbeddings, error: withoutEmbeddingsError } =
      await supabase
        .from("memories")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("embedding", null)

    debugInfo.embeddingStats = {
      withEmbeddings: withEmbeddings || 0,
      withoutEmbeddings: withoutEmbeddings || 0,
      withEmbeddingsError,
      withoutEmbeddingsError
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("Error in memory debug:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
