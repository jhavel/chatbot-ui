export const monitorOperation = async <T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> => {
  const startTime = Date.now()

  try {
    const result = await operation()
    const duration = Date.now() - startTime

    console.log(`${context} completed in ${duration}ms`)
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`${context} failed after ${duration}ms:`, error)
    throw error
  }
}

export const monitorFileOperation = async <T>(
  operation: () => Promise<T>,
  fileId: string,
  operationType: string
): Promise<T> => {
  return monitorOperation(operation, `File ${operationType} for ${fileId}`)
}
