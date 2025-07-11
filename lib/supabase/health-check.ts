import { createClient } from "./client"

export const checkSupabaseConnection = async () => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1)

    if (error) {
      console.error("Supabase connection failed:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Supabase health check failed:", error)
    return false
  }
}

export const checkSupabaseStorage = async () => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from("files")
      .list("", { limit: 1 })

    if (error) {
      console.error("Supabase storage check failed:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Supabase storage health check failed:", error)
    return false
  }
}
