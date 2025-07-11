import { useState, useEffect, useCallback } from "react"
import { Tables } from "@/supabase/types"
import { FileIcon } from "../ui/file-icon"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select"
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
  X
} from "lucide-react"
import { toast } from "sonner"

interface EnhancedFileManagerProps {
  workspaceId: string
  onFileSelect?: (file: Tables<"files">) => void
  selectedFileIds?: string[]
}

interface FileFilters {
  search: string
  tags: string[]
  fileTypes: string[]
  sortBy: string
  sortOrder: "ASC" | "DESC"
}

export const EnhancedFileManager: React.FC<EnhancedFileManagerProps> = ({
  workspaceId,
  onFileSelect,
  selectedFileIds = []
}) => {
  const [files, setFiles] = useState<Tables<"files">[]>([])
  const [filteredFiles, setFilteredFiles] = useState<Tables<"files">[]>([])
  const [filters, setFilters] = useState<FileFilters>({
    search: "",
    tags: [],
    fileTypes: [],
    sortBy: "uploaded_at",
    sortOrder: "DESC"
  })
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<Tables<"files"> | null>(null)
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    tags: "",
    file: null as File | null
  })
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    tags: ""
  })
  const [loading, setLoading] = useState(false)

  // Fetch files
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

      if (data.success) {
        setFiles(data.files)
        setFilteredFiles(data.files)

        // Extract available tags and types
        const tags = new Set<string>()
        const types = new Set<string>()

        data.files.forEach((file: Tables<"files">) => {
          if (file.tags) {
            file.tags.forEach(tag => tags.add(tag))
          }
          types.add(file.type)
        })

        setAvailableTags(Array.from(tags))
        setAvailableTypes(Array.from(types))
      }
    } catch (error) {
      console.error("Error fetching files:", error)
      toast.error("Failed to fetch files")
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Fetch file stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/files/stats", {
        credentials: "include"
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch stats")
      }

      const data = await response.json()

      if (data.success) {
        // Could use stats for additional UI elements
        console.log("File stats:", data.stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
    fetchStats()
  }, [fetchFiles, fetchStats])

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name) {
      toast.error("Please select a file and provide a name")
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append("file", uploadForm.file)
      formData.append("name", uploadForm.name)
      formData.append("description", uploadForm.description)
      formData.append("tags", uploadForm.tags)
      formData.append("workspace_id", workspaceId)

      const response = await fetch("/api/files/upload", {
        method: "POST",
        credentials: "include",
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Upload failed")
      }

      const data = await response.json()

      if (data.success) {
        toast.success("File uploaded successfully")
        setIsUploadDialogOpen(false)
        setUploadForm({ name: "", description: "", tags: "", file: null })
        fetchFiles()
      } else {
        toast.error(data.error || "Failed to upload file")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload file")
    } finally {
      setLoading(false)
    }
  }

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
            .filter(tag => tag.length > 0)
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Update failed")
      }

      const data = await response.json()

      if (data.success) {
        toast.success("File updated successfully")
        setIsEditDialogOpen(false)
        setEditingFile(null)
        setEditForm({ name: "", description: "", tags: "" })
        fetchFiles()
      } else {
        toast.error(data.error || "Failed to update file")
      }
    } catch (error) {
      console.error("Edit error:", error)
      toast.error("Failed to update file")
    } finally {
      setLoading(false)
    }
  }

  // Handle file delete
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

      const data = await response.json()

      if (data.success) {
        toast.success("File deleted successfully")
        fetchFiles()
      } else {
        toast.error(data.error || "Failed to delete file")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete file")
    } finally {
      setLoading(false)
    }
  }

  // Handle file download
  const handleDownload = async (file: Tables<"files">) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`, {
        credentials: "include"
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Download failed")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download file")
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">File Manager</h2>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 size-4" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New File</DialogTitle>
              <DialogDescription>
                Upload a new file to your workspace. Supported formats include
                documents, images, and other file types.
              </DialogDescription>
            </DialogHeader>
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
                  placeholder="Enter tags"
                />
              </div>
              <Button onClick={handleUpload} disabled={loading}>
                {loading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Search</Label>
              <div className="relative">
                <Search className="text-muted-foreground absolute left-3 top-3 size-4" />
                <Input
                  placeholder="Search files..."
                  value={filters.search}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      search: e.target.value
                    }))
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label>Sort By</Label>
              <Select
                value={filters.sortBy}
                onValueChange={value =>
                  setFilters(prev => ({
                    ...prev,
                    sortBy: value
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uploaded_at">Upload Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Label>Order</Label>
              <Select
                value={filters.sortOrder}
                onValueChange={(value: "ASC" | "DESC") =>
                  setFilters(prev => ({
                    ...prev,
                    sortOrder: value
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESC">Desc</SelectItem>
                  <SelectItem value="ASC">Asc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tag filters */}
          {availableTags.length > 0 && (
            <div>
              <Label>Filter by Tags</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      setFilters(prev => ({
                        ...prev,
                        tags: prev.tags.includes(tag)
                          ? prev.tags.filter(t => t !== tag)
                          : [...prev.tags, tag]
                      }))
                    }
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Type filters */}
          {availableTypes.length > 0 && (
            <div>
              <Label>Filter by Type</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableTypes.map(type => (
                  <Badge
                    key={type}
                    variant={
                      filters.fileTypes.includes(type) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() =>
                      setFilters(prev => ({
                        ...prev,
                        fileTypes: prev.fileTypes.includes(type)
                          ? prev.fileTypes.filter(t => t !== type)
                          : [...prev.fileTypes, type]
                      }))
                    }
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="py-8 text-center">Loading files...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No files found
          </div>
        ) : (
          filteredFiles.map(file => (
            <Card key={file.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 items-start gap-4">
                    <FileIcon type={file.type} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="truncate font-semibold">{file.name}</h3>
                        {selectedFileIds.includes(file.id) && (
                          <Badge variant="secondary">Selected</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
                        {file.description || "No description"}
                      </p>
                      <div className="text-muted-foreground flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <FileText className="size-3" />
                          {formatFileSize(file.size)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDate(file.created_at)}
                        </span>
                        <span>{file.tokens?.toLocaleString()} tokens</span>
                      </div>
                      {file.tags && file.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {file.tags.map(tag => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onFileSelect && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onFileSelect(file)}
                      >
                        Select
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(file)}
                    >
                      <Edit3 className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(file.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
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
              />
            </div>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
