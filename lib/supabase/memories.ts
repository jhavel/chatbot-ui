import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Save a memory entry
export const saveMemory = async (content: string) => {
  const { data, error } = await supabase.from("memories").insert([{ content }])
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
