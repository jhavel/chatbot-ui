import { Database, Tables } from "@/supabase/types"
import { VALID_ENV_KEYS } from "@/types/valid-keys"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function getServerProfile() {
  const cookieStore = cookies()
  // Debug: log all cookies
  console.log(
    "[getServerProfile] Cookies:",
    cookieStore.getAll().map(c => ({ name: c.name, value: c.value }))
  )
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value
          console.log(`[getServerProfile] Cookie get: ${name} = ${value}`)
          return value
        }
      }
    }
  )

  const userResult = await supabase.auth.getUser()
  console.log("[getServerProfile] supabase.auth.getUser() result:", userResult)
  const user = userResult.data.user
  if (!user) {
    console.log("[getServerProfile] No user found in session!")
    throw new Error("User not found (no Supabase user in session)")
  }

  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()
  console.log("[getServerProfile] Profile lookup:", profile, profileError)

  if (!profile) {
    // Auto-create profile if missing
    const email = user.email || "user@example.com"
    const displayName = email.split("@")[0]
    // Sanitize username: only letters, numbers, underscores, 3-25 chars
    const username = displayName.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 25)
    const newProfile = {
      user_id: user.id,
      display_name: displayName,
      username: username.length >= 3 ? username : `user_${user.id.slice(0, 8)}`,
      bio: "",
      has_onboarded: false,
      image_url: "",
      image_path: "",
      profile_context: "",
      use_azure_openai: false
    }
    const { data: createdProfile, error } = await supabase
      .from("profiles")
      .insert([newProfile])
      .select("*")
      .single()
    console.log(
      "[getServerProfile] Auto-created profile:",
      createdProfile,
      error
    )
    if (!createdProfile || error) {
      throw new Error(
        "Failed to auto-create user profile: " +
          (error?.message || "Unknown error")
      )
    }
    profile = createdProfile
  }

  const profileWithKeys = addApiKeysToProfile(profile)

  return profileWithKeys
}

function addApiKeysToProfile(profile: Tables<"profiles">) {
  const apiKeys = {
    [VALID_ENV_KEYS.OPENAI_API_KEY]: "openai_api_key",
    [VALID_ENV_KEYS.ANTHROPIC_API_KEY]: "anthropic_api_key",
    [VALID_ENV_KEYS.GOOGLE_GEMINI_API_KEY]: "google_gemini_api_key",
    [VALID_ENV_KEYS.MISTRAL_API_KEY]: "mistral_api_key",
    [VALID_ENV_KEYS.GROQ_API_KEY]: "groq_api_key",
    [VALID_ENV_KEYS.PERPLEXITY_API_KEY]: "perplexity_api_key",
    [VALID_ENV_KEYS.AZURE_OPENAI_API_KEY]: "azure_openai_api_key",
    [VALID_ENV_KEYS.OPENROUTER_API_KEY]: "openrouter_api_key",

    [VALID_ENV_KEYS.OPENAI_ORGANIZATION_ID]: "openai_organization_id",

    [VALID_ENV_KEYS.AZURE_OPENAI_ENDPOINT]: "azure_openai_endpoint",
    [VALID_ENV_KEYS.AZURE_GPT_35_TURBO_NAME]: "azure_openai_35_turbo_id",
    [VALID_ENV_KEYS.AZURE_GPT_45_VISION_NAME]: "azure_openai_45_vision_id",
    [VALID_ENV_KEYS.AZURE_GPT_45_TURBO_NAME]: "azure_openai_45_turbo_id",
    [VALID_ENV_KEYS.AZURE_EMBEDDINGS_NAME]: "azure_openai_embeddings_id"
  }

  for (const [envKey, profileKey] of Object.entries(apiKeys)) {
    if (process.env[envKey]) {
      ;(profile as any)[profileKey] = process.env[envKey]
    }
  }

  return profile
}

export function checkApiKey(apiKey: string | null, keyName: string) {
  if (apiKey === null || apiKey === "") {
    throw new Error(`${keyName} API Key not found`)
  }
}
