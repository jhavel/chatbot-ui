"use client"

import { useState, useCallback } from "react"
import { Tables } from "@/supabase/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation,
  Code,
  File,
  Brain,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface AIFileUploadProps {
  workspaceId: string
  onFileUploaded?: (file: Tables<"files">) => void
  className?: string
  showManualOption?: boolean
}

interface AIAnalysis {
  title: string
  description: string
  tags: string[]
  category: string
}

export const AIFileUpload: React.FC<AIFileUploadProps> = ({
  workspaceId,
  onFileUploaded,
  className = "",
  showManualOption = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{
      file: File
      analysis?: AIAnalysis
      status: "uploading" | "success" | "error"
      error?: string
    }>
  >([])

  const getFileIcon = (fileType: string, fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()

    if (fileType.startsWith("image/")) return <Image className="size-8" />
    if (
      fileType.includes("spreadsheet") ||
      extension === "xlsx" ||
      extension === "csv"
    )
      return <FileSpreadsheet className="size-8" />
    if (fileType.includes("presentation") || extension === "pptx")
      return <Presentation className="size-8" />
    if (
      fileType.startsWith("text/") ||
      extension === "md" ||
      extension === "txt" ||
      extension === "json"
    )
      return <FileText className="size-8" />
    if (
      extension === "js" ||
      extension === "ts" ||
      extension === "py" ||
      extension === "java" ||
      extension === "cpp"
    )
      return <Code className="size-8" />
    return <File className="size-8" />
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = async (files: File[]) => {
    setIsUploading(true)
    setUploadedFiles(
      files.map(file => ({ file, status: "uploading" as const }))
    )

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("workspace_id", workspaceId)

        const response = await fetch("/api/files/ai-upload", {
          method: "POST",
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Upload failed")
        }

        const result = await response.json()

        // Update the file status
        setUploadedFiles(prev =>
          prev.map((item, index) =>
            index === i
              ? {
                  ...item,
                  status: "success" as const,
                  analysis: result.aiAnalysis
                }
              : item
          )
        )

        if (onFileUploaded && result.file) {
          onFileUploaded(result.file)
        }

        toast.success(`Uploaded: ${result.aiAnalysis.title}`)
      } catch (error) {
        console.error("Upload error:", error)

        // Update the file status with error
        setUploadedFiles(prev =>
          prev.map((item, index) =>
            index === i
              ? {
                  ...item,
                  status: "error" as const,
                  error:
                    error instanceof Error ? error.message : "Upload failed"
                }
              : item
          )
        )

        toast.error(
          `Failed to upload ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      }
    }

    setIsUploading(false)
  }

  const resetUploads = () => {
    setUploadedFiles([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          <Brain className="mr-2 size-4" />
          AI File Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="size-5" />
            AI-Powered File Upload
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          <div
            className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="text-muted-foreground mx-auto mb-4 size-12" />
            <h3 className="mb-2 text-lg font-semibold">
              Drop files here or click to select
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              AI will automatically generate titles, descriptions, and tags for
              your files
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label htmlFor="file-upload">
              <Button variant="outline" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Select Files"
                )}
              </Button>
            </label>
          </div>

          {/* Manual Upload Option */}
          {showManualOption && (
            <div className="border-t pt-4">
              <div className="text-center">
                <p className="text-muted-foreground mb-3 text-sm">
                  Or upload manually without AI processing
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Upload className="mr-2 size-4" />
                      Manual Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Manual File Upload</DialogTitle>
                    </DialogHeader>
                    <ManualUploadForm
                      workspaceId={workspaceId}
                      onFileUploaded={onFileUploaded}
                      onClose={() => setIsOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Upload Progress</h4>
                <Button variant="ghost" size="sm" onClick={resetUploads}>
                  Clear
                </Button>
              </div>

              {uploadedFiles.map((item, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0">
                        {getFileIcon(item.file.type, item.file.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="truncate font-medium">
                            {item.analysis?.title || item.file.name}
                          </span>
                          {item.status === "uploading" && (
                            <Loader2 className="text-muted-foreground size-4 animate-spin" />
                          )}
                          {item.status === "success" && (
                            <CheckCircle className="size-4 text-green-500" />
                          )}
                          {item.status === "error" && (
                            <AlertCircle className="size-4 text-red-500" />
                          )}
                        </div>

                        {item.analysis && (
                          <div className="space-y-2">
                            <p className="text-muted-foreground text-sm">
                              {item.analysis.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {item.analysis.tags.map((tag, tagIndex) => (
                                <Badge
                                  key={tagIndex}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.error && (
                          <p className="mt-1 text-sm text-red-500">
                            Error: {item.error}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="mb-2 flex items-center gap-2 font-medium">
              <Brain className="size-4" />
              How it works
            </h4>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>
                • AI analyzes your file content and generates descriptive titles
              </li>
              <li>• Automatically creates relevant tags and categories</li>
              <li>• Works with documents, images, spreadsheets, and more</li>
              <li>• Supports multiple file uploads at once</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Manual Upload Form Component
interface ManualUploadFormProps {
  workspaceId: string
  onFileUploaded?: (file: Tables<"files">) => void
  onClose: () => void
}

const ManualUploadForm: React.FC<ManualUploadFormProps> = ({
  workspaceId,
  onFileUploaded,
  onClose
}) => {
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    tags: "",
    file: null as File | null
  })
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!uploadForm.file) {
      toast.error("Please select a file")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", uploadForm.file)
      formData.append("name", uploadForm.name || uploadForm.file.name)
      formData.append("description", uploadForm.description)
      formData.append("tags", uploadForm.tags)
      formData.append("workspace_id", workspaceId)

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const result = await response.json()

      if (onFileUploaded && result.file) {
        onFileUploaded(result.file)
      }

      toast.success(`Uploaded: ${result.file.name}`)
      onClose()
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(
        `Failed to upload: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>File</Label>
        <Input
          type="file"
          onChange={e =>
            setUploadForm(prev => ({
              ...prev,
              file: e.target.files?.[0] || null
            }))
          }
        />
      </div>
      <div>
        <Label>Name</Label>
        <Input
          value={uploadForm.name}
          onChange={e =>
            setUploadForm(prev => ({
              ...prev,
              name: e.target.value
            }))
          }
          placeholder="Enter file name"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={uploadForm.description}
          onChange={e =>
            setUploadForm(prev => ({
              ...prev,
              description: e.target.value
            }))
          }
          placeholder="Enter file description"
        />
      </div>
      <div>
        <Label>Tags (comma-separated)</Label>
        <Input
          value={uploadForm.tags}
          onChange={e =>
            setUploadForm(prev => ({
              ...prev,
              tags: e.target.value
            }))
          }
          placeholder="e.g., project, important, draft"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </div>
  )
}
