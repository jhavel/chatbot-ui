"use client"

import { Button } from "@/components/ui/button"
import { ChatbotUIContext } from "@/context/context"
import { Grid3X3, Upload } from "lucide-react"
import { FC, useContext } from "react"

interface FileManagerButtonProps {
  className?: string
}

export const FileManagerButton: FC<FileManagerButtonProps> = ({
  className = ""
}) => {
  const { selectedWorkspace } = useContext(ChatbotUIContext)

  const openEnhancedFileManager = () => {
    if (selectedWorkspace) {
      window.location.href = `/workspace/${selectedWorkspace.id}/files`
    }
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={openEnhancedFileManager}
        className="flex-1"
      >
        <Grid3X3 className="mr-2 size-4" />
        Enhanced File Manager
      </Button>
      <Button variant="outline" size="sm" onClick={openEnhancedFileManager}>
        <Upload className="size-4" />
      </Button>
    </div>
  )
}
