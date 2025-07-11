import { createClient } from "@supabase/supabase-js"
import { Database } from "@/supabase/types"

export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase admin configuration is missing. Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file. " +
        "You can find this key in your Supabase project dashboard under Settings > API > Project API keys > service_role key."
    )
  }

  return createClient<Database>(supabaseUrl, supabaseKey)
}
