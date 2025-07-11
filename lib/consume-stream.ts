export async function consumeReadableStream(
  stream: ReadableStream<Uint8Array>,
  callback: (chunk: string) => void,
  signal: AbortSignal
): Promise<void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder("utf-8")

  signal.addEventListener("abort", () => reader.cancel(), { once: true })

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // Flush any remaining bytes
        const finalChunk = decoder.decode()
        if (finalChunk) {
          callback(finalChunk)
        }
        break
      }

      if (value) {
        const decodedChunk = decoder.decode(value, { stream: true })
        callback(decodedChunk)
      }
    }
  } catch (error) {
    if (signal.aborted) {
      console.error("Stream reading was aborted:", error)
    } else {
      console.error("Error consuming stream:", error)
    }
  } finally {
    reader.releaseLock()
  }
}

// Enhanced streaming utility specifically for chat responses
export async function consumeChatStream(
  stream: ReadableStream<Uint8Array>,
  onChunk: (content: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
  signal: AbortSignal
): Promise<void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder("utf-8")
  let buffer = ""

  signal.addEventListener("abort", () => reader.cancel(), { once: true })

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // Process any remaining buffer
        const finalChunk = decoder.decode()
        if (finalChunk) {
          buffer += finalChunk
        }

        // Process final buffer
        const lines = buffer.split("\n")
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const messageData = line.replace(/^data: /, "")
          if (messageData === "[DONE]") {
            onComplete()
            return
          }

          try {
            const parsed = JSON.parse(messageData)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              onChunk(content)
            }
          } catch (err) {
            console.error("Error parsing final chunk:", err, messageData)
          }
        }
        break
      }

      if (value) {
        const decodedChunk = decoder.decode(value, { stream: true })
        buffer += decodedChunk

        // Process complete lines
        const lines = buffer.split("\n")
        buffer = lines.pop() || "" // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const messageData = line.replace(/^data: /, "")
          if (messageData === "[DONE]") {
            onComplete()
            return
          }

          try {
            const parsed = JSON.parse(messageData)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              onChunk(content)
            }
          } catch (err) {
            console.error("Error parsing chunk:", err, messageData)
          }
        }
      }
    }
  } catch (error) {
    if (signal.aborted) {
      console.error("Chat stream reading was aborted:", error)
    } else {
      console.error("Error consuming chat stream:", error)
      onError(error instanceof Error ? error.message : "Unknown error")
    }
  } finally {
    reader.releaseLock()
  }
}
