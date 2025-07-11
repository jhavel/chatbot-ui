import { supabase } from "@/lib/supabase/browser-client"
import { toast } from "sonner"

export const uploadFile = async (
  file: File,
  payload: {
    name: string
    user_id: string
    file_id: string
  }
) => {
  const SIZE_LIMIT = parseInt(
    process.env.NEXT_PUBLIC_USER_FILE_SIZE_LIMIT || "10000000"
  )

  if (file.size > SIZE_LIMIT) {
    throw new Error(
      `File must be less than ${Math.floor(SIZE_LIMIT / 1000000)}MB`
    )
  }

  const filePath = `${payload.user_id}/${Buffer.from(payload.file_id).toString("base64")}`

  const { error } = await supabase.storage
    .from("files")
    .upload(filePath, file, {
      upsert: true
    })

  if (error) {
    console.error("File upload error:", error)
    throw new Error(`Error uploading file: ${error.message}`)
  }

  return filePath
}

export const deleteFileFromStorage = async (filePath: string, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { error } = await supabase.storage.from("files").remove([filePath])

      if (error) {
        if (attempt === retries) {
          console.error(
            `Storage deletion failed after ${retries} attempts:`,
            error
          )
          throw new Error(
            `Failed to delete file from storage: ${error.message}`
          )
        }

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        continue
      }

      return true
    } catch (error) {
      if (attempt === retries) {
        throw error
      }

      console.warn(`Storage deletion attempt ${attempt} failed:`, error)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}

export const getFileFromStorage = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from("files")
    .createSignedUrl(filePath, 60 * 60 * 24) // 24hrs

  if (error) {
    console.error(`Error creating signed URL for file: ${filePath}`, error)
    throw new Error(`Error downloading file: ${error.message}`)
  }

  return data.signedUrl
}
