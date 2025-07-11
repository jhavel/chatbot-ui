import { useState } from "react"
import { Tables } from "@/supabase/types"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog"
import { EnhancedFileManager } from "./enhanced-file-manager"
import { FileIcon } from "../ui/file-icon"
import { Badge } from "../ui/badge"
import { FileText, Calendar, Tag, Download, ExternalLink } from "lucide-react"

interface FileIntegrationExampleProps {
  workspaceId: string
  currentChatId?: string
  onFilesSelected?: (files: Tables<"files">[]) => void
}

export const FileIntegrationExample: React.FC<FileIntegrationExampleProps> = ({
  workspaceId,
  currentChatId,
  onFilesSelected
}) => {
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Tables<"files">[]>([])
  const [relatedFiles, setRelatedFiles] = useState<Tables<"files">[]>([])

  // Handle file selection from the enhanced file manager
  const handleFileSelect = (file: Tables<"files">) => {
    setSelectedFiles(prev => {
      const exists = prev.find(f => f.id === file.id)
      if (exists) {
        return prev.filter(f => f.id !== file.id)
      } else {
        return [...prev, file]
      }
    })
  }

  // Load related files for current chat
  const loadRelatedFiles = async () => {
    if (!currentChatId) return

    try {
      const params = new URLSearchParams({
        related_entity_id: currentChatId,
        related_entity_type: "chat",
        limit: "5"
      })

      const response = await fetch(`/api/files/list?${params}`)
      const data = await response.json()

      if (data.success) {
        setRelatedFiles(data.files)
      }
    } catch (error) {
      console.error("Error loading related files:", error)
    }
  }

  // Link selected files to current chat
  const linkFilesToChat = async () => {
    if (!currentChatId || selectedFiles.length === 0) return

    try {
      const promises = selectedFiles.map(file =>
        fetch(`/api/files/${file.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            related_entity_id: currentChatId,
            related_entity_type: "chat"
          })
        })
      )

      await Promise.all(promises)

      // Notify parent component
      onFilesSelected?.(selectedFiles)

      // Clear selection
      setSelectedFiles([])
      setIsFileManagerOpen(false)

      // Reload related files
      loadRelatedFiles()
    } catch (error) {
      console.error("Error linking files:", error)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      {/* File Manager Integration */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">File Management</h3>
        <Dialog open={isFileManagerOpen} onOpenChange={setIsFileManagerOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <FileText className="mr-2 size-4" />
              Manage Files
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>File Manager</DialogTitle>
            </DialogHeader>
            <EnhancedFileManager
              workspaceId={workspaceId}
              onFileSelect={handleFileSelect}
              selectedFileIds={selectedFiles.map(f => f.id)}
            />
            {selectedFiles.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">
                    {selectedFiles.length} file(s) selected
                  </span>
                  <Button onClick={linkFilesToChat} size="sm">
                    Link to Chat
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedFiles.map(file => (
                    <div
                      key={file.id}
                      className="bg-muted flex items-center gap-2 rounded p-2"
                    >
                      <FileIcon type={file.type} size={20} />
                      <span className="truncate text-sm">{file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatFileSize(file.size)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Related Files Section */}
      {currentChatId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Files Related to This Chat</h4>
            <Button variant="ghost" size="sm" onClick={loadRelatedFiles}>
              Refresh
            </Button>
          </div>

          {relatedFiles.length === 0 ? (
            <div className="text-muted-foreground py-4 text-center">
              No files linked to this chat yet
            </div>
          ) : (
            <div className="grid gap-3">
              {relatedFiles.map(file => (
                <div
                  key={file.id}
                  className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3"
                >
                  <FileIcon type={file.type} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h5 className="truncate font-medium">{file.name}</h5>
                      <Badge variant="secondary" className="text-xs">
                        Linked
                      </Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-1 text-sm">
                      {file.description || "No description"}
                    </p>
                    <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <FileText className="size-3" />
                        {formatFileSize(file.size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(file.created_at)}
                      </span>
                      {file.tags && file.tags.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Tag className="size-3" />
                          {file.tags.slice(0, 2).join(", ")}
                          {file.tags.length > 2 && ` +${file.tags.length - 2}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost">
                      <Download className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Integration Example */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="mb-2 font-medium">AI File Suggestions</h4>
        <p className="text-muted-foreground mb-3 text-sm">
          The AI can help you find and manage files. Try these commands:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Command
            </Badge>
            <span>&ldquo;Show me all documentation files&rdquo;</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Command
            </Badge>
            <span>
              &ldquo;Find files tagged with &apos;important&apos;&rdquo;
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Command
            </Badge>
            <span>&ldquo;Link the current file to this chat&rdquo;</span>
          </div>
        </div>
      </div>
    </div>
  )
}
