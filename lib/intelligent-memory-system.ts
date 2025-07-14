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
  enableSmartDeduplication: true,

  // Quality thresholds
  minQualityScore: 0.3,
  minContentLength: 10,
  maxContentLength: 1000
}

// Enhanced conversation analysis
class ConversationAnalyzer {
  async analyzeConversation(messages: any[]): Promise<{
    hasPersonalInfo: boolean
    hasPreferences: boolean
    hasProjectInfo: boolean
    isQuestionAnswer: boolean
    conversationLength: number
    userEngagement: number
    topics: string[]
  }> {
    const userMessages = messages.filter(msg => msg.role === "user")
    const assistantMessages = messages.filter(msg => msg.role === "assistant")

    const allContent = userMessages.map(msg => msg.content).join(" ")
    const lowerContent = allContent.toLowerCase()

    // Analyze content patterns
    const hasPersonalInfo =
      /my name is|i am|i'm|i work as|my job is|i live in|i'm from|my age is/i.test(
        lowerContent
      )
    const hasPreferences =
      /i like|i prefer|i love|i hate|i enjoy|my favorite|i'm interested in/i.test(
        lowerContent
      )
    const hasProjectInfo =
      /project|goal|objective|deadline|timeline|milestone|i'm working on|i'm building/i.test(
        lowerContent
      )

    // Detect question-answer pattern
    const isQuestionAnswer = userMessages.some(msg =>
      /^(what|how|when|where|why|who|which|do you|can you|could you|would you|are you|is this|does this)/i.test(
        msg.content.trim()
      )
    )

    // Calculate engagement based on message length and frequency
    const avgMessageLength =
      userMessages.reduce((sum, msg) => sum + msg.content.length, 0) /
      userMessages.length
    const userEngagement = Math.min(
      1,
      (avgMessageLength / 100) *
        (userMessages.length / Math.max(1, assistantMessages.length))
    )

    // Extract topics
    const topics = this.extractTopics(allContent)

    return {
      hasPersonalInfo,
      hasPreferences,
      hasProjectInfo,
      isQuestionAnswer,
      conversationLength: messages.length,
      userEngagement,
      topics
    }
  }

  private extractTopics(content: string): string[] {
    const topics: string[] = []
    const lowerContent = content.toLowerCase()

    // Extract common topics
    if (/project|goal|objective/i.test(lowerContent)) topics.push("project")
    if (/work|job|career|profession/i.test(lowerContent)) topics.push("work")
    if (/family|wife|husband|children|kids/i.test(lowerContent))
      topics.push("family")
    if (/hobby|interest|passion|enjoy/i.test(lowerContent)) topics.push("hobby")
    if (/technology|tech|software|programming|coding/i.test(lowerContent))
      topics.push("technology")
    if (/business|company|startup|entrepreneur/i.test(lowerContent))
      topics.push("business")

    return topics
  }
}

// Enhanced memory candidate extraction
class MemoryCandidateExtractor {
  private analyzer = new ConversationAnalyzer()

  async extractMemoryCandidates(
    messages: any[],
    context: any,
    priority: string
  ): Promise<MemoryCandidate[]> {
    const candidates: MemoryCandidate[] = []
    const userMessages = messages.filter(msg => msg.role === "user")

    // Process each user message
    for (const message of userMessages) {
      const content = message.content

      // Skip if content is too short or too long
      if (
        content.length < INTELLIGENT_MEMORY_CONFIG.minContentLength ||
        content.length > INTELLIGENT_MEMORY_CONFIG.maxContentLength
      ) {
        continue
      }

      // Skip questions
      if (this.isQuestion(content)) {
        continue
      }

      // Calculate confidence based on content type and priority
      const confidence = this.calculateConfidence(content, context, priority)

      if (confidence >= INTELLIGENT_MEMORY_CONFIG.minQualityScore) {
        candidates.push({
          content,
          confidence,
          type: this.determineMemoryType(content),
          source: "user_message",
          timestamp: new Date()
        })
      }
    }

    // Sort by confidence and limit
    return candidates
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, INTELLIGENT_MEMORY_CONFIG.maxMemoriesPerConversation)
  }

  private isQuestion(content: string): boolean {
    const trimmed = content.trim()
    return /^(what|how|when|where|why|who|which|do you|can you|could you|would you|are you|is this|does this)/i.test(
      trimmed
    )
  }

  private calculateConfidence(
    content: string,
    context: any,
    priority: string
  ): number {
    let confidence = 0.5 // Base confidence

    // Boost based on priority
    switch (priority) {
      case "high":
        confidence += 0.3
        break
      case "medium":
        confidence += 0.1
        break
      case "low":
        confidence -= 0.1
        break
    }

    // Boost based on content type
    const lowerContent = content.toLowerCase()
    if (/my name is|i am|i'm|i work as|my job is/i.test(lowerContent)) {
      confidence += 0.2 // Personal info
    }
    if (
      /i like|i prefer|i love|i hate|i enjoy|my favorite/i.test(lowerContent)
    ) {
      confidence += 0.15 // Preferences
    }
    if (/project|goal|objective|deadline|timeline/i.test(lowerContent)) {
      confidence += 0.15 // Project info
    }

    // Boost based on context relevance
    if (context.topics.some((topic: string) => lowerContent.includes(topic))) {
      confidence += 0.1
    }

    // Penalize very short or very long content
    const wordCount = content.split(/\s+/).length
    if (wordCount < 5) confidence -= 0.2
    if (wordCount > 200) confidence -= 0.1

    return Math.max(0, Math.min(1, confidence))
  }

  private determineMemoryType(content: string): MemoryType {
    const lowerContent = content.toLowerCase()

    if (
      /my name is|i am|i'm|i work as|my job is|i live in|i'm from/i.test(
        lowerContent
      )
    ) {
      return "personal"
    }
    if (
      /i like|i prefer|i love|i hate|i enjoy|my favorite/i.test(lowerContent)
    ) {
      return "preference"
    }
    if (
      /project|goal|objective|deadline|timeline|i'm working on/i.test(
        lowerContent
      )
    ) {
      return "project"
    }
    if (
      /technology|tech|software|programming|coding|framework/i.test(
        lowerContent
      )
    ) {
      return "technical"
    }

    return "conversation_context"
  }
}

// Enhanced intelligent memory extractor
export class IntelligentMemoryExtractor {
  private analyzer = new ConversationAnalyzer()
  private extractor = new MemoryCandidateExtractor()
  private processingCache = new Map<string, MemoryExtractionResult>()

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
    const candidates = await this.extractor.extractMemoryCandidates(
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

    const trimmed = content.trim()

    // Very short questions
    if (trimmed.length < 20) return true

    // Simple yes/no questions
    if (
      /^(are you|is this|does this|do you|can you|could you|would you)/i.test(
        trimmed
      )
    ) {
      return true
    }

    // Questions that don't provide context
    if (/^(what is|what are|how do|when do|where do)/i.test(trimmed)) {
      return true
    }

    return false
  }

  private determineProcessingPriority(
    context: any,
    messages: any[]
  ): "high" | "medium" | "low" | "skip" {
    // High priority: Personal information or high engagement
    if (context.hasPersonalInfo || context.userEngagement > 0.7) {
      return "high"
    }

    // Medium priority: Preferences, project info, or moderate engagement
    if (
      context.hasPreferences ||
      context.hasProjectInfo ||
      context.userEngagement > 0.4
    ) {
      return "medium"
    }

    // Low priority: General conversation with some engagement
    if (context.userEngagement > 0.2 && context.conversationLength > 2) {
      return "low"
    }

    // Skip: Low engagement or question-answer patterns
    if (context.userEngagement < 0.2 || context.isQuestionAnswer) {
      return "skip"
    }

    return "low"
  }

  private generateCacheKey(messages: any[]): string {
    const recentMessages = messages.slice(-3) // Last 3 messages for cache key
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
