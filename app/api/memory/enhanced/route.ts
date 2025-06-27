import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import {
  getRelevantMemories,
  getMemoryClusters,
  getMemoriesByCluster,
  getMemoryStats,
  updateMemoryAccess
} from "@/lib/memory-system"

export async function GET(req: NextRequest) {
  const supabase = createClient(cookies())
  const { searchParams } = new URL(req.url)

  try {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const action = searchParams.get("action")

    switch (action) {
      case "contextual":
        const context = searchParams.get("context") || ""
        const limit = parseInt(searchParams.get("limit") || "5")
        const memories = await getRelevantMemories(
          supabase,
          user.id,
          context,
          limit
        )
        return NextResponse.json(memories)

      case "clusters":
        const clusters = await getMemoryClusters(supabase, user.id)
        return NextResponse.json(clusters)

      case "cluster-memories":
        const clusterId = searchParams.get("clusterId")
        if (!clusterId) {
          return NextResponse.json(
            { error: "Cluster ID required" },
            { status: 400 }
          )
        }
        const clusterMemories = await getMemoriesByCluster(
          supabase,
          clusterId,
          user.id
        )
        return NextResponse.json(clusterMemories)

      case "stats":
        const stats = await getMemoryStats(supabase, user.id)
        return NextResponse.json(stats)

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Enhanced memory API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient(cookies())

  try {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, memoryId } = await req.json()

    switch (action) {
      case "access":
        if (!memoryId) {
          return NextResponse.json(
            { error: "Memory ID required" },
            { status: 400 }
          )
        }
        await updateMemoryAccess(supabase, memoryId)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Enhanced memory API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
