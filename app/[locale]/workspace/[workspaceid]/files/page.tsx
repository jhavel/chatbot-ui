"use client"

import { EnhancedFileManager } from "@/components/sidebar/items/files/enhanced-file-manager"
import { ChatbotUIContext } from "@/context/context"
import { Tables } from "@/supabase/types"
import { useContext } from "react"

export default function FilesPage() {
  const { selectedWorkspace } = useContext(ChatbotUIContext)

  const handleFileSelect = (file: Tables<"files">) => {
    // Handle file selection - could open preview, add to chat, etc.
    console.log("Selected file:", file)
  }

  if (!selectedWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">No Workspace Selected</h2>
          <p className="text-muted-foreground">
            Please select a workspace to manage files.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-6">
      <EnhancedFileManager
        workspaceId={selectedWorkspace.id}
        onFileSelect={handleFileSelect}
        className="h-full"
      />
    </div>
  )
}
