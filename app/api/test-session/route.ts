import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get session
    const sessionResult = await supabase.auth.getSession()
    console.log("[test-session] Session result:", {
      hasSession: !!sessionResult.data.session,
      sessionUser: sessionResult.data.session?.user?.id,
      error: sessionResult.error
    })

    // Get user
    const userResult = await supabase.auth.getUser()
    console.log("[test-session] User result:", {
      hasUser: !!userResult.data.user,
      userId: userResult.data.user?.id,
      error: userResult.error
    })

    // Get all cookies for debugging
    const allCookies = cookieStore.getAll()
    console.log(
      "[test-session] All cookies:",
      allCookies.map(c => c.name)
    )

    return NextResponse.json({
      session: {
        hasSession: !!sessionResult.data.session,
        userId: sessionResult.data.session?.user?.id,
        error: sessionResult.error
      },
      user: {
        hasUser: !!userResult.data.user,
        userId: userResult.data.user?.id,
        error: userResult.error
      },
      cookies: allCookies.map(c => c.name)
    })
  } catch (error: any) {
    console.error("[test-session] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
