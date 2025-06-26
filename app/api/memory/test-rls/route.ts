import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

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

    const testResults: any = {
      user_id: user.id,
      timestamp: new Date().toISOString(),
      tests: {}
    }

    // Test 1: Check if we can query memories
    try {
      const { data: memories, error: memoriesError } = await supabase
        .from("memories")
        .select("id, content")
        .eq("user_id", user.id)
        .limit(1)

      testResults.tests.memories_query = {
        success: !memoriesError,
        error: memoriesError?.message,
        count: memories?.length || 0
      }
    } catch (error) {
      testResults.tests.memories_query = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }

    // Test 2: Check if we can query memory_clusters
    try {
      const { data: clusters, error: clustersError } = await supabase
        .from("memory_clusters")
        .select("id, name")
        .eq("user_id", user.id)
        .limit(1)

      testResults.tests.clusters_query = {
        success: !clustersError,
        error: clustersError?.message,
        count: clusters?.length || 0
      }
    } catch (error) {
      testResults.tests.clusters_query = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }

    // Test 3: Try to insert a test memory
    try {
      const { data: insertMemory, error: insertMemoryError } = await supabase
        .from("memories")
        .insert([
          {
            user_id: user.id,
            content: "RLS test memory - should be deleted",
            relevance_score: 0.1,
            memory_type: "test"
          }
        ])
        .select()
        .single()

      testResults.tests.memory_insert = {
        success: !insertMemoryError,
        error: insertMemoryError?.message,
        inserted_id: insertMemory?.id
      }

      // Clean up the test memory
      if (insertMemory?.id) {
        await supabase.from("memories").delete().eq("id", insertMemory.id)
      }
    } catch (error) {
      testResults.tests.memory_insert = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }

    // Test 4: Try to insert a test cluster
    try {
      const { data: insertCluster, error: insertClusterError } = await supabase
        .from("memory_clusters")
        .insert([
          {
            user_id: user.id,
            name: "RLS Test Cluster",
            description: "Test cluster - should be deleted"
          }
        ])
        .select()
        .single()

      testResults.tests.cluster_insert = {
        success: !insertClusterError,
        error: insertClusterError?.message,
        inserted_id: insertCluster?.id
      }

      // Clean up the test cluster
      if (insertCluster?.id) {
        await supabase
          .from("memory_clusters")
          .delete()
          .eq("id", insertCluster.id)
      }
    } catch (error) {
      testResults.tests.cluster_insert = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }

    // Check RLS policies
    try {
      const { data: policies, error: policiesError } = await supabase.rpc(
        "get_rls_policies",
        { table_names: ["memories", "memory_clusters"] }
      )

      testResults.tests.rls_policies = {
        success: !policiesError,
        error: policiesError?.message,
        policies: policies
      }
    } catch (error) {
      testResults.tests.rls_policies = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }

    return NextResponse.json(testResults)
  } catch (error) {
    console.error("Error in RLS test:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
