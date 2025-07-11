import { createClient } from "@/lib/supabase/server"
import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(cookies())
    const profile = await getServerProfile()

    // Get basic stats
    const { data: basicStats, error: basicError } = await supabase
      .from("files")
      .select("name, size, tokens, type, tags, uploaded_at")
      .eq("user_id", profile.user_id)
      .not("name", "ilike", "[DELETED]%") // Exclude files marked as deleted

    if (basicError) {
      console.error("Error fetching basic stats:", basicError)
      return NextResponse.json(
        { error: "Failed to fetch file statistics" },
        { status: 500 }
      )
    }

    // Calculate statistics
    const totalFiles = basicStats?.length || 0
    const totalSize =
      basicStats?.reduce((sum, file) => sum + (file.size || 0), 0) || 0
    const totalTokens =
      basicStats?.reduce((sum, file) => sum + (file.tokens || 0), 0) || 0

    // File type distribution
    const fileTypes: Record<string, number> = {}
    basicStats?.forEach(file => {
      const type = file.type || "unknown"
      fileTypes[type] = (fileTypes[type] || 0) + 1
    })

    // Tag distribution
    const tagCounts: Record<string, number> = {}
    basicStats?.forEach(file => {
      if (file.tags && Array.isArray(file.tags)) {
        file.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })

    // Recent uploads (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentUploads =
      basicStats?.filter(
        file => file.uploaded_at && new Date(file.uploaded_at) >= sevenDaysAgo
      ).length || 0

    // Uploads by day (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const uploadsByDay: Record<string, number> = {}
    basicStats?.forEach(file => {
      if (file.uploaded_at && new Date(file.uploaded_at) >= thirtyDaysAgo) {
        const date = new Date(file.uploaded_at).toISOString().split("T")[0]
        uploadsByDay[date] = (uploadsByDay[date] || 0) + 1
      }
    })

    // Largest files
    const largestFiles =
      basicStats
        ?.sort((a, b) => (b.size || 0) - (a.size || 0))
        .slice(0, 5)
        .map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        })) || []

    // Most tagged files
    const mostTaggedFiles =
      basicStats
        ?.filter(file => file.tags && file.tags.length > 0)
        .sort((a, b) => (b.tags?.length || 0) - (a.tags?.length || 0))
        .slice(0, 5)
        .map(file => ({
          name: file.name,
          tags: file.tags,
          tagCount: file.tags?.length || 0
        })) || []

    return NextResponse.json({
      success: true,
      stats: {
        totalFiles,
        totalSize,
        totalTokens,
        fileTypes,
        tagCounts,
        recentUploads,
        uploadsByDay,
        largestFiles,
        mostTaggedFiles
      }
    })
  } catch (error: any) {
    console.error("File stats error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch file statistics" },
      { status: 500 }
    )
  }
}
