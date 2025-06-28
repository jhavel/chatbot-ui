"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error caught:", error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 bg-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">
              Something went wrong!
            </h2>
            <p className="mt-2 text-gray-600">
              An unexpected error occurred. Please try again.
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
            <button
              onClick={reset}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Try again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
