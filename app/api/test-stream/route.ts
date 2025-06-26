export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 5; i++) {
        controller.enqueue(
          encoder.encode(
            `data: {"choices":[{"delta":{"content":"chunk${i} "}}]}` + "\n"
          )
        )
        await new Promise(res => setTimeout(res, 1000))
      }
      controller.enqueue(encoder.encode("data: [DONE]\n"))
      controller.close()
    }
  })
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" }
  })
}
