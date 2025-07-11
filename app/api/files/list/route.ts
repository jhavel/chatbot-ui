import { createClient } from "@/lib/supabase/server"
import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(cookies())
    const profile = await getServerProfile()

    const { searchParams } = new URL(req.url)

    // Extract query parameters
    const searchQuery = searchParams.get("search") || null
    const tags = searchParams.get("tags")
      ? searchParams
          .get("tags")!
          .split(",")
          .map(tag => tag.trim())
      : null
    const fileTypes = searchParams.get("types")
      ? searchParams
          .get("types")!
          .split(",")
          .map(type => type.trim())
      : null
    const relatedEntityId = searchParams.get("related_entity_id") || null
    const relatedEntityType = searchParams.get("related_entity_type") || null
    const folderId = searchParams.get("folder_id") || null
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const sortBy = searchParams.get("sort_by") || "uploaded_at"
    const sortOrder = searchParams.get("sort_order") || "DESC"

    // Validate parameters
    if (limit > 100) {
      return NextResponse.json(
        { error: "Limit cannot exceed 100" },
        { status: 400 }
      )
    }

    // Build the query
    let query = supabase
      .from("files")
      .select("*")
      .eq("user_id", profile.user_id)
      .not("name", "ilike", "[DELETED]%") // Exclude files marked as deleted

    // Apply filters
    if (searchQuery) {
      query = query.or(
        `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
      )
    }

    if (tags && tags.length > 0) {
      query = query.overlaps("tags", tags)
    }

    if (fileTypes && fileTypes.length > 0) {
      query = query.in("type", fileTypes)
    }

    if (relatedEntityId) {
      query = query.eq("related_entity_id", relatedEntityId)
    }

    if (relatedEntityType) {
      query = query.eq("related_entity_type", relatedEntityType)
    }

    if (folderId) {
      query = query.eq("folder_id", folderId)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "ASC" })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: files, error, count } = await query

    if (error) {
      console.error("Error fetching files:", error)
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("files")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.user_id)
      .not("name", "ilike", "[DELETED]%") // Exclude files marked as deleted

    return NextResponse.json({
      success: true,
      files: files || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: offset + limit < (totalCount || 0)
      }
    })
  } catch (error: any) {
    console.error("File list error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch files" },
      { status: 500 }
    )
  }
}
