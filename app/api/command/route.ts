import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits"
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import OpenAI from "openai"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const json = await request.json()
  const { input } = json as {
    input: string
  }

  console.log("🧠 Received input:", input)

  try {
    // 🧠 Intercept "edit:" requests for coding agent
    if (input.toLowerCase().startsWith("edit:")) {
      const { handleCodeEditRequest } = await import(
        "@/app/api/assistant/coding-agent/chat-helpers.js"
      ) // adjust if your helper file is elsewhere

      const instruction = input.slice(5).trim()
      const fileName = "assistant/coding-agent/tempTestFile.js" // hardcoded for now

      const { diff } = await handleCodeEditRequest(instruction, fileName)

      console.log("🛠️ Running code edit with instruction:", instruction)

      return new Response(
        JSON.stringify({ content: `Here is the proposed diff:\n\n${diff}` }),
        {
          status: 200
        }
      )
    }

    // 🧠 Default: Use OpenAI chat completion
    const profile = await getServerProfile()
    checkApiKey(profile.openai_api_key, "OpenAI")

    const openai = new OpenAI({
      apiKey: profile.openai_api_key || "",
      organization: profile.openai_organization_id
    })

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Respond to the user." },
        { role: "user", content: input }
      ],
      temperature: 0,
      max_tokens:
        CHAT_SETTING_LIMITS["gpt-4-turbo-preview"].MAX_TOKEN_OUTPUT_LENGTH
    })

    const content = response.choices[0].message.content

    return new Response(JSON.stringify({ content }), {
      status: 200
    })
  } catch (error: any) {
    const errorMessage = error.error?.message || "An unexpected error occurred"
    const errorCode = error.status || 500
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
