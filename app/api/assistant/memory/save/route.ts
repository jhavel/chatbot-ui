// File: app/api/assistant/memory/save/route.ts

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export async function POST(req: Request) {
  const { user_id, content } = await req.json()

  if (!user_id || !content) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400
    })
  }

  const { error } = await supabase.from("memories").insert([
    {
      user_id,
      content
    }
  ])

  if (error) {
    console.error("Supabase insert failed:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
