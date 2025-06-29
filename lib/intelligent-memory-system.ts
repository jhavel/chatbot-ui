// Types for the intelligent memory system
export interface MemoryCandidate {
  content: string
  confidence: number
  type: MemoryType
  source: "user_message" | "ai_response" | "conversation_context"
  timestamp: Date
  metadata?: Record<string, any>
}

export type MemoryType =
  | "personal"
  | "preference"
  | "technical"
  | "project"
  | "conversation_context"
  | "goal"
  | "experience"

export interface MemoryExtractionResult {
  candidates: MemoryCandidate[]
  shouldProcess: boolean
  processingPriority: "high" | "medium" | "low" | "skip"
}

export interface ConversationContext {
  topic: string
  sentiment: "positive" | "negative" | "neutral"
  complexity: "simple" | "moderate" | "complex"
  userIntent: "question" | "statement" | "request" | "casual"
  containsPersonalInfo: boolean
  conversationDepth: number
}

// Configuration for intelligent memory system
export const INTELLIGENT_MEMORY_CONFIG = {
  // Extraction thresholds
  highConfidenceThreshold: 0.85,
  mediumConfidenceThreshold: 0.7,
  lowConfidenceThreshold: 0.5,

  // Processing limits
  maxMemoriesPerConversation: 3,
  maxProcessingTimeMs: 2000, // 2 seconds max processing time
  batchSize: 5,

  // Context analysis
  enableContextAnalysis: true,
  enableSentimentAnalysis: true,
  enableIntentDetection: true,

  // Caching
  enableMemoryCache: true,
  cacheExpiryMs: 5 * 60 * 1000, // 5 minutes

  // Adaptive behavior
  enableAdaptiveExtraction: true,
  userEngagementThreshold: 0.6,

  // Performance optimizations
  enableLazyProcessing: true,
  enableBackgroundSummarization: true,
  enableSmartDeduplication: true
}

// Conversation context analyzer
export class ConversationAnalyzer {
  async analyzeConversation(messages: any[]): Promise<ConversationContext> {
    const recentMessages = messages.slice(-3) // Last 3 messages for context
    const conversationText = recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join("\n")

    try {
      // Lazy import OpenAI to avoid webpack issues
      const { default: OpenAI } = await import("openai")
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Analyze this conversation snippet and return JSON with:
            - topic: main subject being discussed
            - sentiment: positive/negative/neutral
            - complexity: simple/moderate/complex
            - userIntent: question/statement/request/casual
            - containsPersonalInfo: true/false
            - conversationDepth: 1-5 (how deep/meaningful the conversation is)`
          },
          {
            role: "user",
            content: conversationText
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        return JSON.parse(content)
      }
    } catch (error) {
      console.warn("Failed to analyze conversation context:", error)
    }

    // Fallback analysis
    return this.fallbackAnalysis(messages)
  }

  private fallbackAnalysis(messages: any[]): ConversationContext {
    const lastMessage = messages[messages.length - 1]
    const content = lastMessage?.content?.toLowerCase() || ""

    return {
      topic: "general",
      sentiment: "neutral",
      complexity: content.length > 100 ? "moderate" : "simple",
      userIntent: this.detectIntent(content),
      containsPersonalInfo: this.containsPersonalInfo(content),
      conversationDepth: Math.min(messages.length, 3)
    }
  }

  private detectIntent(
    content: string
  ): "question" | "statement" | "request" | "casual" {
    if (content.includes("?")) return "question"
    if (
      content.includes("please") ||
      content.includes("can you") ||
      content.includes("help")
    )
      return "request"
    if (content.length < 20) return "casual"
    return "statement"
  }

  private containsPersonalInfo(content: string): boolean {
    const personalPatterns = [
      /my name is/i,
      /i am/i,
      /i'm/i,
      /i work/i,
      /i live/i,
      /i like/i,
      /i prefer/i,
      /my job/i,
      /my company/i,
      /my family/i,
      /my age/i,
      /my email/i
    ]
    return personalPatterns.some(pattern => pattern.test(content))
  }
}

// Intelligent memory extractor
export class IntelligentMemoryExtractor {
  private analyzer: ConversationAnalyzer
  private processingCache: Map<string, MemoryExtractionResult> = new Map()

  constructor() {
    this.analyzer = new ConversationAnalyzer()
  }

  async shouldExtractMemories(
    messages: any[]
  ): Promise<MemoryExtractionResult> {
    const startTime = Date.now()

    // Check cache first
    const cacheKey = this.generateCacheKey(messages)
    const cached = this.processingCache.get(cacheKey)
    if (
      cached &&
      Date.now() - startTime < INTELLIGENT_MEMORY_CONFIG.cacheExpiryMs
    ) {
      return cached
    }

    // Quick heuristic check - if this is a simple question, skip extraction
    const lastMessage = messages[messages.length - 1]
    if (this.isSimpleQuestion(lastMessage?.content)) {
      const result: MemoryExtractionResult = {
        candidates: [],
        shouldProcess: false,
        processingPriority: "skip"
      }
      this.processingCache.set(cacheKey, result)
      return result
    }

    // Analyze conversation context
    const context = await this.analyzer.analyzeConversation(messages)

    // Determine processing priority based on context
    const processingPriority = this.determineProcessingPriority(
      context,
      messages
    )

    // If priority is skip, return early
    if (processingPriority === "skip") {
      const result: MemoryExtractionResult = {
        candidates: [],
        shouldProcess: false,
        processingPriority: "skip"
      }
      this.processingCache.set(cacheKey, result)
      return result
    }

    // Extract memory candidates based on priority
    const candidates = await this.extractMemoryCandidates(
      messages,
      context,
      processingPriority
    )

    const result: MemoryExtractionResult = {
      candidates,
      shouldProcess: candidates.length > 0,
      processingPriority
    }

    this.processingCache.set(cacheKey, result)
    return result
  }

  private isSimpleQuestion(content: string): boolean {
    if (!content) return true

    const simpleQuestions = [
      "where were we",
      "what were we talking about",
      "can you repeat that",
      "what did you say",
      "huh",
      "what",
      "sorry",
      "pardon",
      "excuse me"
    ]

    const lowerContent = content.toLowerCase().trim()
    return simpleQuestions.some(q => lowerContent.includes(q))
  }

  private determineProcessingPriority(
    context: ConversationContext,
    messages: any[]
  ): "high" | "medium" | "low" | "skip" {
    // High priority: Personal info + complex conversation
    if (context.containsPersonalInfo && context.complexity === "complex") {
      return "high"
    }

    // Medium priority: Personal info OR complex conversation
    if (context.containsPersonalInfo || context.complexity === "complex") {
      return "medium"
    }

    // Low priority: Simple conversation with some depth
    if (context.conversationDepth > 2) {
      return "low"
    }

    // Skip: Simple, casual conversations
    return "skip"
  }

  private async extractMemoryCandidates(
    messages: any[],
    context: ConversationContext,
    priority: "high" | "medium" | "low"
  ): Promise<MemoryCandidate[]> {
    const candidates: MemoryCandidate[] = []

    // Only process user messages
    const userMessages = messages.filter(msg => msg.role === "user")

    // Limit processing based on priority
    const maxMessages =
      priority === "high"
        ? userMessages.length
        : priority === "medium"
          ? Math.min(userMessages.length, 2)
          : 1

    for (let i = 0; i < Math.min(maxMessages, userMessages.length); i++) {
      const message = userMessages[i]
      const content = message.content

      // Extract based on content type
      const personalInfo = this.extractPersonalInfo(content)
      const preferences = this.extractPreferences(content)
      const technicalInfo = this.extractTechnicalInfo(content)
      const projectInfo = this.extractProjectInfo(content)

      // Add candidates with appropriate confidence
      if (personalInfo) {
        candidates.push({
          content: personalInfo,
          confidence: 0.9,
          type: "personal",
          source: "user_message",
          timestamp: new Date()
        })
      }

      if (preferences) {
        candidates.push({
          content: preferences,
          confidence: 0.85,
          type: "preference",
          source: "user_message",
          timestamp: new Date()
        })
      }

      if (technicalInfo) {
        candidates.push({
          content: technicalInfo,
          confidence: 0.8,
          type: "technical",
          source: "user_message",
          timestamp: new Date()
        })
      }

      if (projectInfo) {
        candidates.push({
          content: projectInfo,
          confidence: 0.75,
          type: "project",
          source: "user_message",
          timestamp: new Date()
        })
      }
    }

    // Filter by confidence threshold and limit
    return candidates
      .filter(
        candidate =>
          candidate.confidence >=
          INTELLIGENT_MEMORY_CONFIG.mediumConfidenceThreshold
      )
      .slice(0, INTELLIGENT_MEMORY_CONFIG.maxMemoriesPerConversation)
  }

  private extractPersonalInfo(content: string): string | null {
    const patterns = [
      {
        pattern: /my name is (.+?)(?:\.|$)/i,
        extract: (match: RegExpMatchArray) => `Name: ${match[1].trim()}`
      },
      {
        pattern: /i work (?:as|at) (.+?)(?:\.|$)/i,
        extract: (match: RegExpMatchArray) => `Work: ${match[1].trim()}`
      },
      {
        pattern: /i live in (.+?)(?:\.|$)/i,
        extract: (match: RegExpMatchArray) => `Location: ${match[1].trim()}`
      },
      {
        pattern: /i'm (\d+) years old/i,
        extract: (match: RegExpMatchArray) => `Age: ${match[1]} years old`
      }
    ]

    for (const { pattern, extract } of patterns) {
      const match = content.match(pattern)
      if (match) {
        return extract(match)
      }
    }

    return null
  }

  private extractPreferences(content: string): string | null {
    const patterns = [
      {
        pattern: /i (?:like|love|enjoy) (.+?)(?:\.|$)/i,
        extract: (match: RegExpMatchArray) => `Likes: ${match[1].trim()}`
      },
      {
        pattern: /i (?:don't like|hate|dislike) (.+?)(?:\.|$)/i,
        extract: (match: RegExpMatchArray) => `Dislikes: ${match[1].trim()}`
      },
      {
        pattern: /i prefer (.+?) over (.+?)(?:\.|$)/i,
        extract: (match: RegExpMatchArray) =>
          `Preference: ${match[1].trim()} over ${match[2].trim()}`
      }
    ]

    for (const { pattern, extract } of patterns) {
      const match = content.match(pattern)
      if (match) {
        return extract(match)
      }
    }

    return null
  }

  private extractTechnicalInfo(content: string): string | null {
    const techPatterns = [
      /(?:i use|i work with|i know|i'm familiar with) (.+?)(?:\.|$)/i,
      /(?:programming|coding|development|software|technology|framework|language|tool|stack|api|database|server|frontend|backend|algorithm|data structure|git|deployment|testing|debugging)/i
    ]

    for (const pattern of techPatterns) {
      if (pattern.test(content)) {
        return content.length > 100
          ? content.substring(0, 100) + "..."
          : content
      }
    }

    return null
  }

  private extractProjectInfo(content: string): string | null {
    const projectPatterns = [
      /(?:project|task|goal|objective|deadline|timeline|milestone|sprint|iteration|deliverable|requirement|feature|bug|issue|roadmap|plan|strategy)/i
    ]

    for (const pattern of projectPatterns) {
      if (pattern.test(content)) {
        return content.length > 100
          ? content.substring(0, 100) + "..."
          : content
      }
    }

    return null
  }

  private generateCacheKey(messages: any[]): string {
    const recentMessages = messages.slice(-2) // Last 2 messages for cache key
    return recentMessages
      .map(msg => `${msg.role}:${msg.content.substring(0, 50)}`)
      .join("|")
  }

  // Getter for cache size
  get cacheSize(): number {
    return this.processingCache.size
  }
}

// Memory processor with background processing
export class MemoryProcessor {
  private processingQueue: Array<{
    candidate: MemoryCandidate
    userId: string
  }> = []
  private isProcessing = false

  // Getter for queue size
  get queueSize(): number {
    return this.processingQueue.length
  }

  async processMemoryCandidate(
    candidate: MemoryCandidate,
    userId: string
  ): Promise<void> {
    // Add to processing queue
    this.processingQueue.push({ candidate, userId })

    // Start background processing if not already running
    if (!this.isProcessing) {
      this.startBackgroundProcessing()
    }
  }

  private async startBackgroundProcessing(): Promise<void> {
    this.isProcessing = true

    while (this.processingQueue.length > 0) {
      const batch = this.processingQueue.splice(
        0,
        INTELLIGENT_MEMORY_CONFIG.batchSize
      )

      await Promise.all(
        batch.map(async ({ candidate, userId }) => {
          try {
            await this.processSingleMemory(candidate, userId)
          } catch (error) {
            console.error("Error processing memory candidate:", error)
          }
        })
      )

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.isProcessing = false
  }

  private async processSingleMemory(
    candidate: MemoryCandidate,
    userId: string
  ): Promise<void> {
    try {
      // Create Supabase client for memory saving
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      // Import and use the actual memory saving function
      const { saveEnhancedMemory } = await import("./memory-system")
      await saveEnhancedMemory(supabase, candidate.content, userId)

      console.log(
        `💾 Saved memory (${candidate.type}, ${candidate.confidence}): ${candidate.content.substring(0, 50)}...`
      )
    } catch (error) {
      console.error("Error processing memory:", error)
    }
  }
}

// Main intelligent memory system
export class IntelligentMemorySystem {
  private extractor: IntelligentMemoryExtractor
  private processor: MemoryProcessor

  constructor() {
    this.extractor = new IntelligentMemoryExtractor()
    this.processor = new MemoryProcessor()
  }

  async handleConversation(
    messages: any[],
    userId: string
  ): Promise<{
    shouldProcess: boolean
    processingPriority: string
    candidatesCount: number
    processingTime: number
  }> {
    const startTime = Date.now()

    // Check if we should extract memories
    const extractionResult =
      await this.extractor.shouldExtractMemories(messages)

    // If we should process, add candidates to background processing
    if (extractionResult.shouldProcess) {
      for (const candidate of extractionResult.candidates) {
        this.processor.processMemoryCandidate(candidate, userId)
      }
    }

    const processingTime = Date.now() - startTime

    return {
      shouldProcess: extractionResult.shouldProcess,
      processingPriority: extractionResult.processingPriority,
      candidatesCount: extractionResult.candidates.length,
      processingTime
    }
  }

  // Get memory statistics for monitoring
  async getMemoryStats(userId: string): Promise<{
    totalMemories: number
    processingQueueSize: number
    cacheSize: number
    averageProcessingTime: number
  }> {
    try {
      // Create Supabase client for database queries
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      // Get actual memory statistics from database
      const { data: memories, error } = await supabase
        .from("memories")
        .select("id, relevance_score")
        .eq("user_id", userId)

      if (error) {
        console.error("Error fetching memory stats:", error)
        return {
          totalMemories: 0,
          processingQueueSize: this.processor.queueSize,
          cacheSize: this.extractor.cacheSize,
          averageProcessingTime: 0
        }
      }

      const totalMemories = memories?.length || 0
      const avgRelevanceScore =
        memories && memories.length > 0
          ? memories.reduce((sum, m) => sum + (m.relevance_score || 1.0), 0) /
            memories.length
          : 0

      return {
        totalMemories,
        processingQueueSize: this.processor.queueSize,
        cacheSize: this.extractor.cacheSize,
        averageProcessingTime: avgRelevanceScore // Using as a simple metric for now
      }
    } catch (error) {
      console.error("Error getting memory stats:", error)
      return {
        totalMemories: 0,
        processingQueueSize: this.processor.queueSize,
        cacheSize: this.extractor.cacheSize,
        averageProcessingTime: 0
      }
    }
  }
}

// Export singleton instance
export const intelligentMemorySystem = new IntelligentMemorySystem()
