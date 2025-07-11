"use client"

import { useState } from "react"
import { Tables } from "@/supabase/types"
import { FileIcon } from "@/components/ui/file-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Search,
  Filter,
  Upload,
  Tag,
  Calendar,
  FileText,
  Download,
  Edit3,
  Trash2,
  Plus,
  X,
  Grid3X3,
  List,
  Star,
  Eye,
  Link,
  Brain,
  FolderOpen
} from "lucide-react"
import { toast } from "sonner"
import { getFileFromStorage } from "@/db/storage/files"
import { formatFileSize } from "@/components/sidebar/items/files/file-item"
import { AIFileUpload } from "./ai-file-upload"

interface FileManagerDemoProps {
  workspaceId: string
  className?: string
}

export const FileManagerDemo: React.FC<FileManagerDemoProps> = ({
  workspaceId,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [files, setFiles] = useState<Tables<"files">[]>([])
  const [filteredFiles, setFilteredFiles] = useState<Tables<"files">[]>([])
  const [search, setSearch] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [loading, setLoading] = useState(false)

  // Mock data for demo
  const mockFiles: Tables<"files">[] = [
    {
      id: "1",
      name: "Project Requirements.pdf",
      description: "Detailed project requirements document",
      file_path: "/files/requirements.pdf",
      type: "pdf",
      size: 2048576,
      tokens: 1500,
      tags: ["project", "requirements", "important"],
      created_at: "2024-01-15T10:00:00Z",
      updated_at: null,
      user_id: "user1",
      folder_id: null,
      sharing: "private",
      related_entity_id: null,
      related_entity_type: null,
      uploaded_at: "2024-01-15T10:00:00Z",
      uploaded_by: "user1",
      url: null
    },
    {
      id: "2",
      name: "API Documentation.md",
      description: "API endpoints and usage examples",
      file_path: "/files/api-docs.md",
      type: "markdown",
      size: 512000,
      tokens: 800,
      tags: ["api", "documentation", "technical"],
      created_at: "2024-01-14T14:30:00Z",
      updated_at: null,
      user_id: "user1",
      folder_id: null,
      sharing: "private",
      related_entity_id: null,
      related_entity_type: null,
      uploaded_at: "2024-01-14T14:30:00Z",
      uploaded_by: "user1",
      url: null
    },
    {
      id: "3",
      name: "Budget Analysis.xlsx",
      description: "Financial analysis and budget planning",
      file_path: "/files/budget.xlsx",
      type: "excel",
      size: 1048576,
      tokens: 1200,
      tags: ["finance", "budget", "analysis"],
      created_at: "2024-01-13T09:15:00Z",
      updated_at: null,
      user_id: "user1",
      folder_id: null,
      sharing: "private",
      related_entity_id: null,
      related_entity_type: null,
      uploaded_at: "2024-01-13T09:15:00Z",
      uploaded_by: "user1",
      url: null
    }
  ]

  // Get all available tags
  const allTags = Array.from(
    new Set(mockFiles.flatMap(file => file.tags || []))
  )

  // Filter files based on search and tags
  const getFilteredFiles = () => {
    return mockFiles.filter(file => {
      const matchesSearch =
        file.name.toLowerCase().includes(search.toLowerCase()) ||
        file.description.toLowerCase().includes(search.toLowerCase())
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some(tag => file.tags?.includes(tag))
      return matchesSearch && matchesTags
    })
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setFilteredFiles(getFilteredFiles())
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleFileAction = (action: string, file: Tables<"files">) => {
    switch (action) {
      case "download":
        toast.success(`Downloading ${file.name}`)
        break
      case "edit":
        toast.info(`Editing ${file.name}`)
        break
      case "delete":
        toast.success(`Deleted ${file.name}`)
        break
      case "view":
        toast.info(`Viewing ${file.name}`)
        break
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className={className}>
            <FolderOpen className="mr-2 size-4" />
            Enhanced File Manager
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Enhanced File Manager
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Header with Stats */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">File Management</h3>
                <p className="text-muted-foreground text-sm">
                  {mockFiles.length} files •{" "}
                  {formatFileSize(
                    mockFiles.reduce((sum, f) => sum + f.size, 0)
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <AIFileUpload
                  workspaceId={workspaceId}
                  onFileUploaded={file => {
                    toast.success(`AI uploaded: ${file.name}`)
                  }}
                  showManualOption={true}
                />
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    placeholder="Search files..."
                    value={search}
                    onChange={e => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("")
                    setSelectedTags([])
                  }}
                >
                  Clear Filters
                </Button>
              </div>

              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="text-muted-foreground size-4" />
                  <span className="text-sm font-medium">Tags:</span>
                  <div className="flex gap-1 overflow-x-auto">
                    {allTags.map(tag => (
                      <Badge
                        key={tag}
                        variant={
                          selectedTags.includes(tag) ? "default" : "outline"
                        }
                        onClick={() => handleTagToggle(tag)}
                        className="cursor-pointer whitespace-nowrap"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">View Mode:</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="size-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* File List */}
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-2"
              }
            >
              {getFilteredFiles().map(file => (
                <Card
                  key={file.id}
                  className="cursor-pointer transition-all hover:shadow-md"
                >
                  <CardContent
                    className={`p-4 ${viewMode === "list" ? "flex items-center gap-4" : ""}`}
                  >
                    <div
                      className={`flex items-center gap-3 ${viewMode === "list" ? "flex-1" : ""}`}
                    >
                      <FileIcon
                        type={file.type}
                        size={viewMode === "list" ? 40 : 32}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {file.name}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {formatFileSize(file.size)} • {file.type}
                        </div>
                        {file.description && (
                          <div className="text-muted-foreground mt-1 truncate text-xs">
                            {file.description}
                          </div>
                        )}
                        {file.tags && file.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {file.tags.slice(0, 3).map(tag => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {file.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{file.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-1 ${viewMode === "list" ? "ml-auto" : "mt-3"}`}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation()
                          handleFileAction("view", file)
                        }}
                        title="View"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation()
                          handleFileAction("download", file)
                        }}
                        title="Download"
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation()
                          handleFileAction("edit", file)
                        }}
                        title="Edit"
                      >
                        <Edit3 className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation()
                          handleFileAction("delete", file)
                        }}
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {getFilteredFiles().length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="text-muted-foreground mb-4 size-12" />
                <h3 className="mb-2 text-lg font-medium">No files found</h3>
                <p className="text-muted-foreground">
                  {search || selectedTags.length > 0
                    ? "Try adjusting your filters"
                    : "Upload your first file to get started"}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
