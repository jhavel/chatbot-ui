import { saveEnhancedMemory } from "@/lib/memory-system"
import { checkForDuplicates } from "@/lib/memory-deduplication"
import { summarizeMemory } from "@/lib/memory-summarization"

export interface MemoryExtractionConfig {
  enableProactiveExtraction: boolean
  extractionThreshold: number
  maxMemoriesPerConversation: number
  enableSummarization: boolean
  enableDuplicateDetection: boolean
}

export const extractMemoriesFromMessages = async (
  messages: any[],
  user_id: string,
  config: MemoryExtractionConfig
): Promise<string[]> => {
  const extractedMemories: string[] = []

  for (const message of messages) {
    if (message.role === "user") {
      const content = message.content.toLowerCase()

      // Extract personal information
      if (containsPersonalInfo(content)) {
        extractedMemories.push(message.content)
      }

      // Extract preferences and opinions
      if (containsPreferences(content)) {
        extractedMemories.push(message.content)
      }

      // Extract technical information
      if (containsTechnicalInfo(content)) {
        extractedMemories.push(message.content)
      }

      // Extract project/task information
      if (containsProjectInfo(content)) {
        extractedMemories.push(message.content)
      }
    }
  }

  return extractedMemories.slice(0, config.maxMemoriesPerConversation)
}

const containsPersonalInfo = (content: string): boolean => {
  // Aggressive phone number detection (US and international formats)
  const phoneRegex =
    /(?:\+\d{1,3}[ .-]?)?(?:\(\d{1,4}\)[ .-]?|\d{1,4}[ .-]?)?\d{3}[ .-]?\d{3,4}[ .-]?\d{4}/
  if (phoneRegex.test(content)) return true

  // Existing patterns
  const patterns = [
    /my name is/i,
    /i am/i,
    /i'm/i,
    /call me/i,
    /my name's/i,
    /i work as/i,
    /my job is/i,
    /i'm a/i,
    /my role is/i,
    /i live in/i,
    /i'm from/i,
    /my age is/i,
    /i'm \d+ years old/i,
    /my email is/i,
    /my phone is/i,
    /my location is/i
  ]
  if (patterns.some(pattern => pattern.test(content))) return true

  // For testing: always return true to save all user messages as memories
  return true
}

const containsPreferences = (content: string): boolean => {
  const patterns = [
    /i like/i,
    /i prefer/i,
    /i don't like/i,
    /i love/i,
    /i hate/i,
    /i enjoy/i,
    /my favorite/i,
    /i'm into/i,
    /i'm interested in/i,
    /i dislike/i,
    /i can't stand/i,
    /i'm passionate about/i,
    /i'm obsessed with/i,
    /i'm a fan of/i,
    /i'm not a fan of/i
  ]
  return patterns.some(pattern => pattern.test(content))
}

const containsTechnicalInfo = (content: string): boolean => {
  const patterns = [
    /programming/i,
    /coding/i,
    /development/i,
    /software/i,
    /technology/i,
    /framework/i,
    /language/i,
    /tool/i,
    /stack/i,
    /api/i,
    /database/i,
    /server/i,
    /frontend/i,
    /backend/i,
    /algorithm/i,
    /data structure/i,
    /git/i,
    /deployment/i,
    /testing/i,
    /debugging/i
  ]
  return patterns.some(pattern => pattern.test(content))
}

const containsProjectInfo = (content: string): boolean => {
  const patterns = [
    /project/i,
    /task/i,
    /goal/i,
    /objective/i,
    /deadline/i,
    /timeline/i,
    /milestone/i,
    /sprint/i,
    /iteration/i,
    /deliverable/i,
    /requirement/i,
    /feature/i,
    /bug/i,
    /issue/i,
    /roadmap/i,
    /plan/i,
    /strategy/i
  ]
  return patterns.some(pattern => pattern.test(content))
}

// Enhanced extraction with confidence scoring
export const extractMemoriesWithConfidence = async (
  messages: any[],
  user_id: string,
  config: MemoryExtractionConfig
): Promise<Array<{ content: string; confidence: number; type: string }>> => {
  const extractedMemories: Array<{
    content: string
    confidence: number
    type: string
  }> = []

  for (const message of messages) {
    if (message.role === "user") {
      const content = message.content
      const lowerContent = content.toLowerCase()

      // Personal information (high confidence)
      if (containsPersonalInfo(lowerContent)) {
        extractedMemories.push({
          content,
          confidence: 0.9,
          type: "personal"
        })
      }

      // Preferences (high confidence)
      if (containsPreferences(lowerContent)) {
        extractedMemories.push({
          content,
          confidence: 0.85,
          type: "preference"
        })
      }

      // Technical information (medium-high confidence)
      if (containsTechnicalInfo(lowerContent)) {
        extractedMemories.push({
          content,
          confidence: 0.8,
          type: "technical"
        })
      }

      // Project information (medium confidence)
      if (containsProjectInfo(lowerContent)) {
        extractedMemories.push({
          content,
          confidence: 0.75,
          type: "project"
        })
      }
    }
  }

  // Filter by confidence threshold and limit
  return extractedMemories
    .filter(memory => memory.confidence >= config.extractionThreshold)
    .slice(0, config.maxMemoriesPerConversation)
}

// Save extracted memories with enhanced processing
export const saveExtractedMemories = async (
  extractedMemories: Array<{
    content: string
    confidence: number
    type: string
  }>,
  user_id: string,
  config: MemoryExtractionConfig,
  supabase: any
): Promise<void> => {
  for (const memory of extractedMemories) {
    try {
      // Summarize if enabled and content is long
      let finalContent = memory.content
      if (config.enableSummarization && memory.content.length > 200) {
        finalContent = await summarizeMemory(memory.content)
        console.log(`📝 Summarized memory: ${finalContent.substring(0, 50)}...`)
      }

      // Save the memory
      await saveEnhancedMemory(supabase, finalContent, user_id)
      console.log(
        `💾 Saved extracted memory (${memory.type}, confidence: ${memory.confidence}): ${finalContent.substring(0, 50)}...`
      )
    } catch (error) {
      console.error(`❌ Failed to save extracted memory: ${error}`)
    }
  }
}

// AI-powered memory detection
export const shouldRememberThis = async (
  userMessage: string,
  aiResponse: string
): Promise<{ shouldRemember: boolean; reason: string }> => {
  try {
    // Use OpenAI to determine if this conversation contains memorable personal information
    const openai = new (await import("openai")).default({
      apiKey: process.env.OPENAI_API_KEY
    })

    const prompt = `Analyze this conversation and determine if the USER shared personal information that should be remembered for future conversations.

User: "${userMessage}"
AI: "${aiResponse}"

Focus primarily on what the USER shared. Consider these types of information as memorable:
- Personal details (name, age, location, family)
- Work/career information (job, company, achievements, skills, business ventures)
- Preferences and interests (likes, dislikes, hobbies, favorites)
- Life experiences (education, travel, challenges overcome, companies founded/sold)
- Goals and aspirations
- Values and beliefs
- Business achievements (startups, acquisitions, sales)

The AI response should only be used for context to understand if the user shared personal information. If the user shared personal details, remember it regardless of what the AI said.

Respond with JSON only:
{
  "shouldRemember": true/false,
  "reason": "Brief explanation of what personal information the user shared"
}`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 200
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return { shouldRemember: false, reason: "No response from AI" }
    }

    try {
      const result = JSON.parse(content)
      return {
        shouldRemember: result.shouldRemember || false,
        reason: result.reason || "No reason provided"
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      return { shouldRemember: false, reason: "Error parsing AI response" }
    }
  } catch (error) {
    console.error("Error in AI-powered memory detection:", error)
    return { shouldRemember: false, reason: "Error in memory detection" }
  }
}
