import { supabase } from "@/lib/supabase/browser-client"
import { createClient } from "@/lib/supabase/client"
import { TablesInsert, TablesUpdate } from "@/supabase/types"
import mammoth from "mammoth"
import { toast } from "sonner"
import { uploadFile } from "./storage/files"

export const getFileById = async (fileId: string) => {
  const { data: file, error } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .single()

  if (!file) {
    throw new Error(error.message)
  }

  return file
}

export const getFileWorkspacesByWorkspaceId = async (workspaceId: string) => {
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select(
      `
      id,
      name,
      files (*)
    `
    )
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    throw new Error(error.message)
  }

  return workspace
}

export const getFileWorkspacesByFileId = async (fileId: string) => {
  const { data: file, error } = await supabase
    .from("files")
    .select(
      `
      id, 
      name, 
      workspaces (*)
    `
    )
    .eq("id", fileId)
    .single()

  if (!file) {
    throw new Error(error.message)
  }

  return file
}

export const createFileBasedOnExtension = async (
  file: File,
  fileRecord: TablesInsert<"files">,
  workspace_id: string,
  embeddingsProvider: "openai" | "local"
) => {
  const fileExtension = file.name.split(".").pop()

  if (fileExtension === "docx") {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({
      arrayBuffer
    })

    return createDocXFile(
      result.value,
      file,
      fileRecord,
      workspace_id,
      embeddingsProvider
    )
  } else {
    return createFile(file, fileRecord, workspace_id, embeddingsProvider)
  }
}

// For non-docx files
export const createFile = async (
  file: File,
  fileRecord: TablesInsert<"files">,
  workspace_id: string,
  embeddingsProvider: "openai" | "local"
) => {
  let validFilename = fileRecord.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase()
  const extension = file.name.split(".").pop()
  const extensionIndex = validFilename.lastIndexOf(".")
  const baseName = validFilename.substring(
    0,
    extensionIndex < 0 ? undefined : extensionIndex
  )
  const maxBaseNameLength = 100 - (extension?.length || 0) - 1
  if (baseName.length > maxBaseNameLength) {
    fileRecord.name = baseName.substring(0, maxBaseNameLength) + "." + extension
  } else {
    fileRecord.name = baseName + "." + extension
  }
  const { data: createdFile, error } = await supabase
    .from("files")
    .insert([fileRecord])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await createFileWorkspace({
    user_id: createdFile.user_id,
    file_id: createdFile.id,
    workspace_id
  })

  const filePath = await uploadFile(file, {
    name: createdFile.name,
    user_id: createdFile.user_id,
    file_id: createdFile.name
  })

  await updateFile(createdFile.id, {
    file_path: filePath
  })

  const formData = new FormData()
  formData.append("file_id", createdFile.id)
  formData.append("embeddingsProvider", embeddingsProvider)

  const response = await fetch("/api/retrieval/process", {
    method: "POST",
    body: formData
  })

  if (!response.ok) {
    const jsonText = await response.text()
    const json = JSON.parse(jsonText)
    console.error(
      `Error processing file:${createdFile.id}, status:${response.status}, response:${json.message}`
    )
    toast.error("Failed to process file. Reason:" + json.message, {
      duration: 10000
    })
    await deleteFile(createdFile.id)
  }

  const fetchedFile = await getFileById(createdFile.id)

  return fetchedFile
}

// // Handle docx files
export const createDocXFile = async (
  text: string,
  file: File,
  fileRecord: TablesInsert<"files">,
  workspace_id: string,
  embeddingsProvider: "openai" | "local"
) => {
  const { data: createdFile, error } = await supabase
    .from("files")
    .insert([fileRecord])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await createFileWorkspace({
    user_id: createdFile.user_id,
    file_id: createdFile.id,
    workspace_id
  })

  const filePath = await uploadFile(file, {
    name: createdFile.name,
    user_id: createdFile.user_id,
    file_id: createdFile.name
  })

  await updateFile(createdFile.id, {
    file_path: filePath
  })

  const response = await fetch("/api/retrieval/process/docx", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: text,
      fileId: createdFile.id,
      embeddingsProvider,
      fileExtension: "docx"
    })
  })

  if (!response.ok) {
    const jsonText = await response.text()
    const json = JSON.parse(jsonText)
    console.error(
      `Error processing file:${createdFile.id}, status:${response.status}, response:${json.message}`
    )
    toast.error("Failed to process file. Reason:" + json.message, {
      duration: 10000
    })
    await deleteFile(createdFile.id)
  }

  const fetchedFile = await getFileById(createdFile.id)

  return fetchedFile
}

export const createFiles = async (
  files: TablesInsert<"files">[],
  workspace_id: string
) => {
  const { data: createdFiles, error } = await supabase
    .from("files")
    .insert(files)
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  await createFileWorkspaces(
    createdFiles.map(file => ({
      user_id: file.user_id,
      file_id: file.id,
      workspace_id
    }))
  )

  return createdFiles
}

export const createFileWorkspace = async (item: {
  user_id: string
  file_id: string
  workspace_id: string
}) => {
  const { data: createdFileWorkspace, error } = await supabase
    .from("file_workspaces")
    .insert([item])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdFileWorkspace
}

export const createFileWorkspaces = async (
  items: { user_id: string; file_id: string; workspace_id: string }[]
) => {
  const { data: createdFileWorkspaces, error } = await supabase
    .from("file_workspaces")
    .insert(items)
    .select("*")

  if (error) throw new Error(error.message)

  return createdFileWorkspaces
}

export const updateFile = async (
  fileId: string,
  file: TablesUpdate<"files">
) => {
  const { data: updatedFile, error } = await supabase
    .from("files")
    .update(file)
    .eq("id", fileId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedFile
}

export const deleteFile = async (fileId: string) => {
  const supabase = createClient()

  try {
    // Get file details first
    const { data: file, error: fetchError } = await supabase
      .from("files")
      .select("file_path")
      .eq("id", fileId)
      .single()

    if (fetchError) {
      throw new Error(`File not found: ${fetchError.message}`)
    }

    // Delete related entities
    await deleteFileWorkspaces(fileId)
    await deleteCollectionFiles(fileId)
    await deleteAssistantFiles(fileId)
    await deleteChatFiles(fileId)

    // Delete from storage if path exists
    if (file.file_path) {
      try {
        const { error: storageError } = await supabase.storage
          .from("files")
          .remove([file.file_path])

        if (storageError) {
          console.warn(`Storage deletion failed for ${fileId}:`, storageError)
        }
      } catch (storageError) {
        console.warn(`Storage deletion error for ${fileId}:`, storageError)
      }
    }

    // Delete database record
    const { error: deleteError } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId)

    if (deleteError) {
      throw new Error(`Database deletion failed: ${deleteError.message}`)
    }

    return true
  } catch (error) {
    console.error(`Error deleting file ${fileId}:`, error)
    throw error
  }
}

// Helper functions for related entity deletion
export const deleteFileWorkspaces = async (fileId: string) => {
  const supabase = createClient()
  const { error } = await supabase
    .from("file_workspaces")
    .delete()
    .eq("file_id", fileId)

  if (error) {
    console.warn(`Failed to delete file workspaces for ${fileId}:`, error)
  }
}

export const deleteCollectionFiles = async (fileId: string) => {
  const supabase = createClient()
  const { error } = await supabase
    .from("collection_files")
    .delete()
    .eq("file_id", fileId)

  if (error) {
    console.warn(`Failed to delete collection files for ${fileId}:`, error)
  }
}

export const deleteAssistantFiles = async (fileId: string) => {
  const supabase = createClient()
  const { error } = await supabase
    .from("assistant_files")
    .delete()
    .eq("file_id", fileId)

  if (error) {
    console.warn(`Failed to delete assistant files for ${fileId}:`, error)
  }
}

export const deleteChatFiles = async (fileId: string) => {
  const supabase = createClient()
  const { error } = await supabase
    .from("chat_files")
    .delete()
    .eq("file_id", fileId)

  if (error) {
    console.warn(`Failed to delete chat files for ${fileId}:`, error)
  }
}

export const deleteFileWorkspace = async (
  fileId: string,
  workspaceId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from("file_workspaces")
    .delete()
    .eq("file_id", fileId)
    .eq("workspace_id", workspaceId)

  if (error) throw new Error(error.message)

  return true
}

// Enhanced file operations for the new features

export const searchFiles = async (
  userId: string,
  options: {
    searchQuery?: string
    tags?: string[]
    fileTypes?: string[]
    relatedEntityId?: string
    relatedEntityType?: string
    folderId?: string
    limit?: number
    offset?: number
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
  } = {}
) => {
  const {
    searchQuery,
    tags,
    fileTypes,
    relatedEntityId,
    relatedEntityType,
    folderId,
    limit = 20,
    offset = 0,
    sortBy = "uploaded_at",
    sortOrder = "DESC"
  } = options

  let query = supabase
    .from("files")
    .select("*")
    .eq("user_id", userId)
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

  const { data: files, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return files || []
}

export const getFileStats = async (userId: string) => {
  const { data: files, error } = await supabase
    .from("files")
    .select("name, size, tokens, type, tags, uploaded_at")
    .eq("user_id", userId)
    .not("name", "ilike", "[DELETED]%") // Exclude files marked as deleted

  if (error) {
    throw new Error(error.message)
  }

  const totalFiles = files?.length || 0
  const totalSize = files?.reduce((sum, file) => sum + (file.size || 0), 0) || 0
  const totalTokens =
    files?.reduce((sum, file) => sum + (file.tokens || 0), 0) || 0

  // File type distribution
  const fileTypes: Record<string, number> = {}
  files?.forEach(file => {
    const type = file.type || "unknown"
    fileTypes[type] = (fileTypes[type] || 0) + 1
  })

  // Tag distribution
  const tagCounts: Record<string, number> = {}
  files?.forEach(file => {
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
    files?.filter(
      file => file.uploaded_at && new Date(file.uploaded_at) >= sevenDaysAgo
    ).length || 0

  return {
    totalFiles,
    totalSize,
    totalTokens,
    fileTypes,
    tagCounts,
    recentUploads
  }
}

export const getRelatedFiles = async (fileId: string, limit: number = 5) => {
  // First get the target file to understand its properties
  const { data: targetFile, error: targetError } = await supabase
    .from("files")
    .select("user_id, tags, type")
    .eq("id", fileId)
    .single()

  if (targetError || !targetFile) {
    throw new Error("Target file not found")
  }

  // Get related files based on tags and type
  const { data: relatedFiles, error } = await supabase
    .from("files")
    .select("id, name, description, type, tags")
    .eq("user_id", targetFile.user_id)
    .neq("id", fileId)
    .not("name", "ilike", "[DELETED]%") // Exclude files marked as deleted
    .order("uploaded_at", { ascending: false })
    .limit(limit * 2) // Get more to filter by relevance

  if (error) {
    throw new Error(error.message)
  }

  // Score and sort by relevance
  const scoredFiles =
    relatedFiles?.map(file => {
      let score = 0

      // Tag overlap
      if (targetFile.tags && file.tags) {
        const commonTags = targetFile.tags.filter(tag =>
          file.tags?.includes(tag)
        )
        score += commonTags.length * 0.8
      }

      // Same type
      if (file.type === targetFile.type) {
        score += 0.6
      }

      return { ...file, relevanceScore: score }
    }) || []

  // Sort by relevance score and return top results
  return scoredFiles
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)
}

export const updateFileTags = async (fileId: string, tags: string[]) => {
  const { data: updatedFile, error } = await supabase
    .from("files")
    .update({ tags })
    .eq("id", fileId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedFile
}

export const getPopularTags = async (userId: string, limit: number = 10) => {
  const { data: files, error } = await supabase
    .from("files")
    .select("tags")
    .eq("user_id", userId)
    .not("tags", "is", null)
    .not("name", "ilike", "[DELETED]%") // Exclude files marked as deleted

  if (error) {
    throw new Error(error.message)
  }

  const tagCounts: Record<string, number> = {}
  files?.forEach(file => {
    if (file.tags && Array.isArray(file.tags)) {
      file.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    }
  })

  return Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }))
}

export const linkFileToEntity = async (
  fileId: string,
  entityId: string,
  entityType: string
) => {
  const { data: updatedFile, error } = await supabase
    .from("files")
    .update({
      related_entity_id: entityId,
      related_entity_type: entityType
    })
    .eq("id", fileId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedFile
}
