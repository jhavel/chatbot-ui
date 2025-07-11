"use client"

import { useState, useEffect, useCallback } from "react"
import { Tables } from "@/supabase/types"
import { FileIcon } from "@/components/ui/file-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Brain
} from "lucide-react"
import { toast } from "sonner"
import { getFileFromStorage } from "@/db/storage/files"
import { formatFileSize } from "./file-item"
import { AIFileUpload } from "@/components/chat/ai-file-upload"

interface FileFilters {
  search: string
  tags: string[]
  fileTypes: string[]
  sortBy: "name" | "uploaded_at" | "size" | "type"
  sortOrder: "ASC" | "DESC"
  viewMode: "grid" | "list"
}

interface EnhancedFileManagerProps {
  workspaceId: string
  onFileSelect?: (file: Tables<"files">) => void
  selectedFileIds?: string[]
  className?: string
}

export const EnhancedFileManager: React.FC<EnhancedFileManagerProps> = ({
  workspaceId,
  onFileSelect,
  selectedFileIds = [],
  className = ""
}) => {
  const [files, setFiles] = useState<Tables<"files">[]>([])
  const [filteredFiles, setFilteredFiles] = useState<Tables<"files">[]>([])
  const [filters, setFilters] = useState<FileFilters>({
    search: "",
    tags: [],
    fileTypes: [],
    sortBy: "uploaded_at",
    sortOrder: "DESC",
    viewMode: "list" // changed from 'grid' to 'list'
  })
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<Tables<"files"> | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    tags: ""
  })
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    fileTypes: {} as Record<string, number>
  })

  // Fetch files from API
  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.search) params.append("search", filters.search)
      if (filters.tags.length > 0) params.append("tags", filters.tags.join(","))
      if (filters.fileTypes.length > 0)
        params.append("types", filters.fileTypes.join(","))
      params.append("sort_by", filters.sortBy)
      params.append("sort_order", filters.sortOrder)

      const response = await fetch(`/api/files/list?${params.toString()}`, {
        credentials: "include"
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch files")
      }

      const data = await response.json()
      setFiles(data.files || [])

      // Extract available tags and types
      const tags = new Set<string>()
      const types = new Set<string>()

      data.files?.forEach((file: Tables<"files">) => {
        if (file.tags) {
          file.tags.forEach(tag => tags.add(tag))
        }
        types.add(file.type)
      })

      setAvailableTags(Array.from(tags))
      setAvailableTypes(Array.from(types))

      // Calculate stats
      const totalSize =
        data.files?.reduce(
          (sum: number, file: Tables<"files">) => sum + (file.size || 0),
          0
        ) || 0
      const fileTypes =
        data.files?.reduce(
          (acc: Record<string, number>, file: Tables<"files">) => {
            acc[file.type] = (acc[file.type] || 0) + 1
            return acc
          },
          {}
        ) || {}

      setStats({
        totalFiles: data.files?.length || 0,
        totalSize,
        fileTypes
      })
    } catch (error) {
      console.error("Error fetching files:", error)
      toast.error("Failed to load files")
    } finally {
      setLoading(false)
    }
  }, [workspaceId, filters])

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...files]

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(
        file =>
          file.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          file.description
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          file.tags?.some(tag =>
            tag.toLowerCase().includes(filters.search.toLowerCase())
          )
      )
    }

    // Apply tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(file =>
        file.tags?.some(tag => filters.tags.includes(tag))
      )
    }

    // Apply file type filter
    if (filters.fileTypes.length > 0) {
      filtered = filtered.filter(file => filters.fileTypes.includes(file.type))
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filters.sortBy) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "uploaded_at":
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case "size":
          aValue = a.size || 0
          bValue = b.size || 0
          break
        case "type":
          aValue = a.type.toLowerCase()
          bValue = b.type.toLowerCase()
          break
        default:
          return 0
      }

      if (filters.sortOrder === "ASC") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredFiles(filtered)
  }, [files, filters])

  // Load files on mount and when filters change
  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // Handle file edit
  const handleEdit = async () => {
    if (!editingFile) return

    try {
      setLoading(true)
      const response = await fetch(`/api/files/${editingFile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          tags: editForm.tags
            .split(",")
            .map(tag => tag.trim())
            .filter(Boolean)
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Update failed")
      }

      toast.success("File updated successfully")
      setIsEditDialogOpen(false)
      setEditingFile(null)
      fetchFiles()
    } catch (error) {
      console.error("Update error:", error)
      toast.error("Failed to update file")
    } finally {
      setLoading(false)
    }
  }

  // Handle file deletion
  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    try {
      setLoading(true)
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
        credentials: "include"
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Delete failed")
      }

      toast.success("File deleted successfully")
      fetchFiles()
    } catch (error) {
      console.error("Delete error:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to delete file"
      )
    } finally {
      setLoading(false)
    }
  }

  // Handle file download
  const handleDownload = async (file: Tables<"files">) => {
    try {
      const link = await getFileFromStorage(file.file_path)
      window.open(link, "_blank")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download file")
    }
  }

  // Handle file selection
  const handleFileSelect = (file: Tables<"files">) => {
    if (onFileSelect) {
      onFileSelect(file)
    }
  }

  // Open edit dialog
  const openEditDialog = (file: Tables<"files">) => {
    setEditingFile(file)
    setEditForm({
      name: file.name,
      description: file.description || "",
      tags: file.tags?.join(", ") || ""
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">File Manager</h2>
          <p className="text-muted-foreground text-sm">
            {stats.totalFiles} files • {formatFileSize(stats.totalSize)}
          </p>
        </div>
        <div className="flex gap-2">
          <AIFileUpload
            workspaceId={workspaceId}
            onFileUploaded={file => {
              toast.success(`AI uploaded: ${file.name}`)
              fetchFiles()
            }}
            showManualOption={true}
          />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search files..."
              value={filters.search}
              onChange={e =>
                setFilters(prev => ({ ...prev, search: e.target.value }))
              }
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() =>
              setFilters(prev => ({
                ...prev,
                tags: [],
                fileTypes: [],
                search: ""
              }))
            }
          >
            Clear Filters
          </Button>
        </div>

        {/* Tags Filter */}
        {availableTags.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag className="text-muted-foreground size-4" />
            <span className="text-sm font-medium">Tags:</span>
            <div className="flex gap-1 overflow-x-auto">
              {availableTags.map(tag => (
                <Badge
                  key={tag}
                  variant={filters.tags.includes(tag) ? "default" : "outline"}
                  onClick={() =>
                    setFilters(prev => ({
                      ...prev,
                      tags: prev.tags.includes(tag)
                        ? prev.tags.filter(t => t !== tag)
                        : [...prev.tags, tag]
                    }))
                  }
                  className="cursor-pointer whitespace-nowrap"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* File Types Filter */}
        {availableTypes.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="text-muted-foreground size-4" />
            <span className="text-sm font-medium">Types:</span>
            <div className="flex gap-1 overflow-x-auto">
              {availableTypes.map(type => (
                <Badge
                  key={type}
                  variant={
                    filters.fileTypes.includes(type) ? "default" : "outline"
                  }
                  onClick={() =>
                    setFilters(prev => ({
                      ...prev,
                      fileTypes: prev.fileTypes.includes(type)
                        ? prev.fileTypes.filter(t => t !== type)
                        : [...prev.fileTypes, type]
                    }))
                  }
                  className="cursor-pointer whitespace-nowrap"
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sort and View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sort by:</span>
            <Select
              value={filters.sortBy}
              onValueChange={(value: any) =>
                setFilters(prev => ({ ...prev, sortBy: value }))
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="uploaded_at">Date</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilters(prev => ({
                  ...prev,
                  sortOrder: prev.sortOrder === "ASC" ? "DESC" : "ASC"
                }))
              }
            >
              {filters.sortOrder === "ASC" ? "↑" : "↓"}
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant={filters.viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setFilters(prev => ({ ...prev, viewMode: "grid" }))
              }
            >
              <Grid3X3 className="size-4" />
            </Button>
            <Button
              variant={filters.viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setFilters(prev => ({ ...prev, viewMode: "list" }))
              }
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* File List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading files...</div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="text-muted-foreground mb-4 size-12" />
          <h3 className="mb-2 text-lg font-medium">No files found</h3>
          <p className="text-muted-foreground mb-4">
            {filters.search ||
            filters.tags.length > 0 ||
            filters.fileTypes.length > 0
              ? "Try adjusting your filters"
              : "Upload your first file to get started"}
          </p>
          {!filters.search &&
            filters.tags.length === 0 &&
            filters.fileTypes.length === 0 && (
              <AIFileUpload
                workspaceId={workspaceId}
                onFileUploaded={file => {
                  toast.success(`AI uploaded: ${file.name}`)
                  fetchFiles()
                }}
                showManualOption={true}
              />
            )}
        </div>
      ) : (
        <div
          className={
            filters.viewMode === "grid"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-2"
          }
        >
          {filteredFiles.map(file => (
            <Card
              key={file.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedFileIds.includes(file.id) ? "ring-primary ring-2" : ""
              }`}
              onClick={() => handleFileSelect(file)}
            >
              <CardContent
                className={`p-4 ${filters.viewMode === "list" ? "flex items-center gap-4" : ""}`}
              >
                <div
                  className={`flex items-center gap-3 ${filters.viewMode === "list" ? "flex-1" : ""}`}
                >
                  <FileIcon
                    type={file.type}
                    size={filters.viewMode === "list" ? 40 : 32}
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
                  className={`flex items-center gap-1 ${filters.viewMode === "list" ? "ml-auto" : "mt-3"}`}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation()
                      handleDownload(file)
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
                      openEditDialog(file)
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
                      handleDelete(file.id)
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
      )}

      {/* Edit File Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit File</DialogTitle>
            <DialogDescription>
              Update the file name, description, and tags. Changes will be saved
              immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={e =>
                  setEditForm(prev => ({
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
                value={editForm.description}
                onChange={e =>
                  setEditForm(prev => ({
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
                value={editForm.tags}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    tags: e.target.value
                  }))
                }
                placeholder="e.g., project, important, draft"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
