import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const getMemoriesByUserId = async (user_id: string) => {
  const { data, error } = await supabase
    .from("memories")
    .select("id, content, created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export const saveMemory = async (content: string, user_id: string) => {
  const { error } = await supabase
    .from("memories")
    .insert([{ content, user_id }])
  if (error) console.error("[Memory Save Error]", error.message)
}
