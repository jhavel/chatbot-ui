"use client"

import { FileIcon } from "@/components/ui/file-icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { FILE_DESCRIPTION_MAX, FILE_NAME_MAX } from "@/db/limits"
import { getFileFromStorage } from "@/db/storage/files"
import { Tables } from "@/supabase/types"
import { FC, useState, useContext } from "react"
import { SidebarItem } from "../all/sidebar-display-item"
import { Grid3X3 } from "lucide-react"
import { ChatbotUIContext } from "@/context/context"

interface FileItemProps {
  file: Tables<"files">
}

export const FileItem: FC<FileItemProps> = ({ file }) => {
  const [name, setName] = useState(file.name)
  const [isTyping, setIsTyping] = useState(false)
  const [description, setDescription] = useState(file.description)
  const { selectedWorkspace } = useContext(ChatbotUIContext)

  const getLinkAndView = async () => {
    const link = await getFileFromStorage(file.file_path)
    window.open(link, "_blank")
  }

  const openEnhancedFileManager = () => {
    // Navigate to the enhanced file manager page using current workspace
    if (selectedWorkspace) {
      window.location.href = `/workspace/${selectedWorkspace.id}/files`
    }
  }

  return (
    <SidebarItem
      item={file}
      isTyping={isTyping}
      contentType="files"
      icon={<FileIcon type={file.type} size={30} />}
      updateState={{ name, description }}
      renderInputs={() => (
        <>
          <div className="mb-4 flex items-center gap-2">
            <div
              className="cursor-pointer underline hover:opacity-50"
              onClick={getLinkAndView}
            >
              View {file.name}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={openEnhancedFileManager}
              className="ml-auto"
            >
              <Grid3X3 className="mr-1 size-4" />
              Enhanced View
            </Button>
          </div>

          <div className="mb-4 flex flex-col justify-between">
            <div>{file.type}</div>

            <div>{formatFileSize(file.size)}</div>

            <div>{file.tokens.toLocaleString()} tokens</div>
          </div>

          <div className="space-y-1">
            <Label>Name</Label>

            <Input
              placeholder="File name..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={FILE_NAME_MAX}
            />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>

            <Input
              placeholder="File description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={FILE_DESCRIPTION_MAX}
            />
          </div>
        </>
      )}
    />
  )
}

export const formatFileSize = (sizeInBytes: number): string => {
  let size = sizeInBytes
  let unit = "bytes"

  if (size >= 1024) {
    size /= 1024
    unit = "KB"
  }

  if (size >= 1024) {
    size /= 1024
    unit = "MB"
  }

  if (size >= 1024) {
    size /= 1024
    unit = "GB"
  }

  return `${size.toFixed(2)} ${unit}`
}
