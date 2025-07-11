export const getErrorMessage = (error: any, context: string) => {
  if (error.message?.includes("Could not resolve host")) {
    return "Connection to database failed. Please check your internet connection and try again."
  }

  if (error.message?.includes("File not found")) {
    return "The file you are trying to delete could not be found."
  }

  if (error.message?.includes("Unauthorized")) {
    return "You do not have permission to perform this action."
  }

  if (error.message?.includes("Storage deletion failed")) {
    return "The file was removed from your library but there was an issue cleaning up the storage. This will be resolved automatically."
  }

  if (error.message?.includes("Database deletion failed")) {
    return "There was an issue removing the file from the database. Please try again."
  }

  if (error.message?.includes("Missing required environment variables")) {
    return "System configuration error. Please contact support."
  }

  if (error.message?.includes("Invalid NEXT_PUBLIC_SUPABASE_URL format")) {
    return "System configuration error. Please contact support."
  }

  return "An unexpected error occurred. Please try again."
}

export const getFileOperationMessage = (
  operation: string,
  success: boolean,
  error?: any
) => {
  if (success) {
    switch (operation) {
      case "delete":
        return "File deleted successfully"
      case "update":
        return "File updated successfully"
      case "upload":
        return "File uploaded successfully"
      default:
        return "Operation completed successfully"
    }
  } else {
    return getErrorMessage(error, operation)
  }
}
