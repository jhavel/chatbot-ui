import fs from "fs"
import { OpenAI } from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateEdit(filePath: string, instruction: string) {
  const originalCode = fs.readFileSync(filePath, "utf-8")

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a senior software engineer. Only output the full modified source code."
      },
      {
        role: "user",
        content: `Here is the original code from ${filePath}:\n\n${originalCode}`
      },
      { role: "user", content: `Please apply this change: ${instruction}` }
    ],
    temperature: 0.2
  })

  return response.choices[0].message.content
}
