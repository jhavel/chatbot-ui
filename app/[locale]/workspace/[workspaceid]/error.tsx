"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function WorkspaceError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Workspace error caught:", error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600">Workspace Error</h2>
        <p className="mt-2 text-gray-600">
          There was an error loading the workspace. Please try again.
        </p>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              Error details (development only)
            </summary>
            <pre className="mt-2 rounded bg-gray-100 p-2 text-xs">
              {error.message}
            </pre>
          </details>
        )}
      </div>
      <div className="flex space-x-4">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Button onClick={() => (window.location.href = "/")} variant="outline">
          Go home
        </Button>
      </div>
    </div>
  )
}
