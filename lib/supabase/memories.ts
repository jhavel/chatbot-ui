import { createClient } from "@supabase/supabase-js"
import { validateMemoryContent } from "../memory-validation"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Save a memory entry with a user_id
export const saveMemory = async (
  content: string,
  user_id: string,
  supabase: any
) => {
  if (!validateMemoryContent(content)) {
    console.warn("❌ Memory content validation failed - skipping save")
    return
  }

  const { data, error } = await supabase
    .from("memories")
    .insert([{ content, user_id }])

  if (error) throw error
  return data
}

// Get all memory entries (newest first)
export const getMemories = async () => {
  const { data, error } = await supabase
    .from("memories")
    .select("content")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}
