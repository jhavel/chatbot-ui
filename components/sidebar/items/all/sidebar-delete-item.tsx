import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { ChatbotUIContext } from "@/context/context"
import { deleteAssistant } from "@/db/assistants"
import { deleteChat } from "@/db/chats"
import { deleteCollection } from "@/db/collections"

import { deleteModel } from "@/db/models"
import { deletePreset } from "@/db/presets"
import { deletePrompt } from "@/db/prompts"
import { deleteTool } from "@/db/tools"
import { Tables } from "@/supabase/types"
import { ContentType, DataItemType } from "@/types"
import { FC, useContext, useRef, useState } from "react"
import { toast } from "sonner"
import { getFileOperationMessage } from "@/lib/error-messages"
import { logFileOperation } from "@/lib/error-logging"

interface SidebarDeleteItemProps {
  item: DataItemType
  contentType: ContentType
}

export const SidebarDeleteItem: FC<SidebarDeleteItemProps> = ({
  item,
  contentType
}) => {
  const {
    setChats,
    setPresets,
    setPrompts,
    setFiles,
    setCollections,
    setAssistants,
    setTools,
    setModels
  } = useContext(ChatbotUIContext)

  const buttonRef = useRef<HTMLButtonElement>(null)

  const [showDialog, setShowDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const deleteFunctions = {
    chats: async (chat: Tables<"chats">) => {
      await deleteChat(chat.id)
    },
    presets: async (preset: Tables<"presets">) => {
      await deletePreset(preset.id)
    },
    prompts: async (prompt: Tables<"prompts">) => {
      await deletePrompt(prompt.id)
    },
    files: async (file: Tables<"files">) => {
      try {
        const response = await fetch(`/api/files/${file.id}`, {
          method: "DELETE",
          credentials: "include"
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Delete failed")
        }

        logFileOperation("delete", file.id, true)
        toast.success(getFileOperationMessage("delete", true))
      } catch (error) {
        logFileOperation("delete", file.id, false, error)
        toast.error(getFileOperationMessage("delete", false, error))
        throw error
      }
    },
    collections: async (collection: Tables<"collections">) => {
      await deleteCollection(collection.id)
    },
    assistants: async (assistant: Tables<"assistants">) => {
      await deleteAssistant(assistant.id)
      setChats(prevState =>
        prevState.filter(chat => chat.assistant_id !== assistant.id)
      )
    },
    tools: async (tool: Tables<"tools">) => {
      await deleteTool(tool.id)
    },
    models: async (model: Tables<"models">) => {
      await deleteModel(model.id)
    }
  }

  const stateUpdateFunctions = {
    chats: setChats,
    presets: setPresets,
    prompts: setPrompts,
    files: setFiles,
    collections: setCollections,
    assistants: setAssistants,
    tools: setTools,
    models: setModels
  }

  const handleDelete = async () => {
    const deleteFunction = deleteFunctions[contentType]
    const setStateFunction = stateUpdateFunctions[contentType]

    if (!deleteFunction || !setStateFunction) return

    setIsDeleting(true)

    try {
      await deleteFunction(item as any)

      setStateFunction((prevItems: any) =>
        prevItems.filter((prevItem: any) => prevItem.id !== item.id)
      )

      setShowDialog(false)
    } catch (error) {
      // Error is already handled in the delete function for files
      // For other content types, show a generic error
      if (contentType !== "files") {
        toast.error("Failed to delete item. Please try again.")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.stopPropagation()
      buttonRef.current?.click()
    }
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="text-red-500" variant="ghost">
          Delete
        </Button>
      </DialogTrigger>

      <DialogContent onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Delete {contentType.slice(0, -1)}</DialogTitle>

          <DialogDescription>
            Are you sure you want to delete {item.name}?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setShowDialog(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>

          <Button
            ref={buttonRef}
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
