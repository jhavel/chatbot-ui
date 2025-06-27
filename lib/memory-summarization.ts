import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const summarizeMemory = async (content: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content:
            "Summarize the following information in a concise, clear way that captures the key points for future reference. Keep it under 100 words and maintain the essential meaning. Focus on actionable or important details."
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    })

    return response.choices[0].message.content || content
  } catch (error) {
    console.error("Error summarizing memory:", error)
    return content
  }
}

export const shouldSummarize = (content: string): boolean => {
  return content.length > 200 // Summarize memories longer than 200 characters
}

export const summarizeMemoryWithType = async (
  content: string,
  memoryType: string
): Promise<string> => {
  try {
    const typeSpecificPrompts = {
      personal:
        "Summarize this personal information in a clear, concise way. Focus on key details like name, role, location, or important personal facts.",
      preference:
        "Summarize this preference or opinion in a clear way. Focus on what the person likes, dislikes, or prefers.",
      technical:
        "Summarize this technical information in a concise way. Focus on technologies, tools, skills, or technical preferences.",
      project:
        "Summarize this project information in a clear way. Focus on goals, deadlines, requirements, or project details.",
      general:
        "Summarize this information in a concise, clear way that captures the key points for future reference."
    }

    const prompt =
      typeSpecificPrompts[memoryType as keyof typeof typeSpecificPrompts] ||
      typeSpecificPrompts.general

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    })

    return response.choices[0].message.content || content
  } catch (error) {
    console.error("Error summarizing memory with type:", error)
    return content
  }
}

// Batch summarization for multiple memories
export const summarizeMemories = async (
  memories: Array<{ content: string; type?: string }>
): Promise<Array<{ original: string; summarized: string }>> => {
  const results: Array<{ original: string; summarized: string }> = []

  for (const memory of memories) {
    if (shouldSummarize(memory.content)) {
      const summarized = memory.type
        ? await summarizeMemoryWithType(memory.content, memory.type)
        : await summarizeMemory(memory.content)

      results.push({
        original: memory.content,
        summarized
      })
    } else {
      results.push({
        original: memory.content,
        summarized: memory.content
      })
    }
  }

  return results
}
