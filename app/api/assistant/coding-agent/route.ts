import { generateEdit } from "./generateEdit"
import { NextRequest } from "next/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { filePath, instruction } = body // ✅ Match the parameter names

  try {
    await generateEdit(filePath, instruction) // ✅ Pass both arguments
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }
}
