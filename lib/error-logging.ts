export const logError = (context: string, error: any, metadata?: any) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    metadata,
    environment: process.env.NODE_ENV
  }

  console.error("Application Error:", errorLog)

  // In production, send to error tracking service
  if (process.env.NODE_ENV === "production") {
    // Send to Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error, { extra: metadata })
  }
}

export const logFileOperation = (
  operation: string,
  fileId: string,
  success: boolean,
  error?: any
) => {
  const logData = {
    timestamp: new Date().toISOString(),
    operation,
    fileId,
    success,
    error: error
      ? {
          message: error.message,
          name: error.name
        }
      : null,
    environment: process.env.NODE_ENV
  }

  if (success) {
    console.log("File operation successful:", logData)
  } else {
    console.error("File operation failed:", logData)
  }
}
