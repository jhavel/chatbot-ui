import { validateMemoryContent } from "./memory-validation"
import { saveEnhancedMemory } from "./memory-system"

export interface MemorySaveRequest {
  content: string
  user_id: string
  source: string // e.g., 'user', 'assistant', 'system', 'api', etc.
  context?: any
  validationLevel?: "strict" | "normal" | "lenient"
}

async function auditMemorySave(
  content: string,
  user_id: string,
  source: string,
  context?: any,
  status?: string,
  error?: any
) {
  // Detailed audit log with stack trace
  console.log("[AUDIT] Memory Save Attempt:", {
    user_id,
    source,
    content: content.substring(0, 200),
    context,
    status,
    error,
    stack: new Error().stack
  })
}

export const saveMemoryUnified = async (
  supabase: any,
  request: MemorySaveRequest
) => {
  const {
    content,
    user_id,
    source,
    context,
    validationLevel = "strict"
  } = request

  await auditMemorySave(content, user_id, source, context, "attempt")

  // Only allow user messages to be saved as user memories
  if (source !== "user") {
    await auditMemorySave(
      content,
      user_id,
      source,
      context,
      "rejected",
      "Non-user source"
    )
    throw new Error(
      `Memory save rejected: only user messages can be saved as user memories (source: ${source})`
    )
  }

  const isValid = validateMemoryContent(content, validationLevel)
  if (!isValid) {
    await auditMemorySave(
      content,
      user_id,
      source,
      context,
      "rejected",
      "Validation failed"
    )
    throw new Error("Memory content validation failed")
  }

  const result = await saveEnhancedMemory(supabase, content, user_id)
  await auditMemorySave(content, user_id, source, context, "saved")
  return result
}
