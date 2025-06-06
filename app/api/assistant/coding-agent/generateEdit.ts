import fs from "fs"
import { OpenAI } from "openai"
import path from "path"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateEdit(filePath: string, instruction: string) {
  try {
    const absolutePath = path.resolve(filePath)
    const originalCode = fs.readFileSync(absolutePath, "utf-8")

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

    console.log(`✅ Committed changes to ${absolutePath}`)
    console.log("File after edit:\n", updatedCode)
  } catch (error) {
    console.error("❌ Failed to apply edit:", error)
  }
}
