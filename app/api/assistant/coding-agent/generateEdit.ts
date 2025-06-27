import fs from "fs"
import { OpenAI } from "openai"
import path from "path"
import {
  getAssistantMemoryContextWithDebug,
  saveAssistantMemory
} from "@/lib/assistant-memory-helpers"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateEdit(filePath: string, instruction: string) {
  try {
    const absolutePath = path.resolve(filePath)
    const originalCode = fs.readFileSync(absolutePath, "utf-8")

    // Get relevant memories for coding context
    const memoryContext = await getAssistantMemoryContextWithDebug(
      `${instruction} ${originalCode}`,
      3,
      0.4
    )

    // Build enhanced system prompt with memory context
    let systemPrompt =
      "You are a senior software engineer with access to the user's preferences and coding style."

    if (memoryContext) {
      systemPrompt += memoryContext
    }

    systemPrompt += "\n\nOnly output the full modified source code."

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Here is the original code from ${filePath}:

${originalCode}`
        },
        { role: "user", content: `Please apply this change: ${instruction}` }
      ],
      temperature: 0.2
    })

    const updatedCode = response.choices[0].message.content

    if (!updatedCode) throw new Error("No response from OpenAI.")

    const cleanCode = updatedCode.replace(/^```[\s\S]*?\n|\n```$/g, "").trim()
    fs.writeFileSync(absolutePath, cleanCode, "utf-8")

    // Save this coding interaction as a memory for future reference
    await saveAssistantMemory(
      `User requested code edit: ${instruction} for file ${filePath}. The edit was successfully applied.`
    )

    console.log(`✅ Committed changes to ${absolutePath}`)
    console.log("File after edit:\n", updatedCode)
  } catch (error) {
    console.error("❌ Failed to apply edit:", error)
  }
}
