import { ChatbotUIContext } from "@/context/context"
import { getAssistantCollectionsByAssistantId } from "@/db/assistant-collections"
import { getAssistantFilesByAssistantId } from "@/db/assistant-files"
import { getAssistantToolsByAssistantId } from "@/db/assistant-tools"
import { updateChat } from "@/db/chats"
import { getCollectionFilesByCollectionId } from "@/db/collection-files"
import { deleteMessagesIncludingAndAfter } from "@/db/messages"
import { buildFinalMessages } from "@/lib/build-prompt"
import { Tables } from "@/supabase/types"
import { ChatMessage, ChatPayload, LLMID, ModelProvider } from "@/types"
import { useRouter } from "next/navigation"
import { fileTools } from "@/lib/tools/fileTools"
import { useContext, useEffect, useRef } from "react"
import { LLM_LIST } from "../../../lib/models/llm/llm-list"
import {
  createTempMessages,
  handleCreateChat,
  handleCreateMessages,
  handleHostedChat,
  handleLocalChat,
  handleRetrieval,
  processResponse,
  validateChatSettings
} from "../chat-helpers"
import type { ProcessResponseResult } from "../chat-helpers"
import { getMemories } from "@/db/tools"

export const useChatHandler = () => {
  const router = useRouter()

  const {
    userInput,
    chatFiles,
    setUserInput,
    setNewMessageImages,
    profile,
    setIsGenerating,
    setChatMessages,
    setFirstTokenReceived,
    selectedChat,
    selectedWorkspace,
    setSelectedChat,
    setChats,
    setSelectedTools,
    availableLocalModels,
    availableOpenRouterModels,
    abortController,
    setAbortController,
    chatSettings,
    newMessageImages,
    selectedAssistant,
    chatMessages,
    chatImages,
    setChatImages,
    setChatFiles,
    setNewMessageFiles,
    setShowFilesDisplay,
    newMessageFiles,
    chatFileItems,
    setChatFileItems,
    setToolInUse,
    useRetrieval,
    sourceCount,
    setIsPromptPickerOpen,
    setIsFilePickerOpen,
    selectedTools,
    selectedPreset,
    setChatSettings,
    models,
    isPromptPickerOpen,
    isFilePickerOpen,
    isToolPickerOpen
  } = useContext(ChatbotUIContext)

  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isPromptPickerOpen || !isFilePickerOpen || !isToolPickerOpen) {
      chatInputRef.current?.focus()
    }
  }, [isPromptPickerOpen, isFilePickerOpen, isToolPickerOpen])

  const handleNewChat = async () => {
    if (!selectedWorkspace) return

    setUserInput("")
    console.log("[DEBUG] setChatMessages([]) called in handleNewChat")
    setChatMessages([])
    setSelectedChat(null)
    setChatFileItems([])

    setIsGenerating(false)
    setFirstTokenReceived(false)

    setChatFiles([])
    setChatImages([])
    setNewMessageFiles([])
    setNewMessageImages([])
    setShowFilesDisplay(false)
    setIsPromptPickerOpen(false)
    setIsFilePickerOpen(false)

    setSelectedTools([])
    setToolInUse("none")

    if (selectedAssistant) {
      setChatSettings({
        model: selectedAssistant.model as LLMID,
        prompt: selectedAssistant.prompt,
        temperature: selectedAssistant.temperature,
        contextLength: selectedAssistant.context_length,
        includeProfileContext: selectedAssistant.include_profile_context,
        includeWorkspaceInstructions:
          selectedAssistant.include_workspace_instructions,
        embeddingsProvider: selectedAssistant.embeddings_provider as
          | "openai"
          | "local"
      })

      let allFiles = []

      const assistantFiles = (
        await getAssistantFilesByAssistantId(selectedAssistant.id)
      ).files
      allFiles = [...assistantFiles]
      const assistantCollections = (
        await getAssistantCollectionsByAssistantId(selectedAssistant.id)
      ).collections
      for (const collection of assistantCollections) {
        const collectionFiles = (
          await getCollectionFilesByCollectionId(collection.id)
        ).files
        allFiles = [...allFiles, ...collectionFiles]
      }
      const assistantTools = (
        await getAssistantToolsByAssistantId(selectedAssistant.id)
      ).tools

      setSelectedTools(assistantTools)
      setChatFiles(
        allFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          file: null
        }))
      )

      if (allFiles.length > 0) setShowFilesDisplay(true)
    } else if (selectedPreset) {
      setChatSettings({
        model: selectedPreset.model as LLMID,
        prompt: selectedPreset.prompt,
        temperature: selectedPreset.temperature,
        contextLength: selectedPreset.context_length,
        includeProfileContext: selectedPreset.include_profile_context,
        includeWorkspaceInstructions:
          selectedPreset.include_workspace_instructions,
        embeddingsProvider: selectedPreset.embeddings_provider as
          | "openai"
          | "local"
      })
    } else if (selectedWorkspace) {
      // setChatSettings({
      //   model: (selectedWorkspace.default_model ||
      //     "gpt-4o") as LLMID,
      //   prompt:
      //     selectedWorkspace.default_prompt ||
      //     "You are a friendly, helpful AI assistant.",
      //   temperature: selectedWorkspace.default_temperature || 0.5,
      //   contextLength: selectedWorkspace.default_context_length || 4096,
      //   includeProfileContext:
      //     selectedWorkspace.include_profile_context || true,
      //   includeWorkspaceInstructions:
      //     selectedWorkspace.include_workspace_instructions || true,
      //   embeddingsProvider:
      //     (selectedWorkspace.embeddings_provider as "openai" | "local") ||
      //     "openai"
      // })
    }

    return router.push(`/workspace/${selectedWorkspace.id}/chat`)
  }

  const handleFocusChatInput = () => {
    chatInputRef.current?.focus()
  }

  const handleStopMessage = () => {
    if (abortController) {
      abortController.abort()
    }
  }

  const handleSendMessage = async (
    messageContent: string,
    chatMessages: ChatMessage[],
    isRegeneration: boolean
  ) => {
    const startingInput = messageContent

    // 🧠 Handle "how many memories" command
    if (messageContent.toLowerCase().includes("how many memories")) {
      const memories = await getMemories()

      setChatMessages(prev => [
        ...prev,
        {
          role: "assistant",
          message: {
            id: crypto.randomUUID(),
            chat_id: selectedChat?.id || "temp-chat",
            user_id: profile?.user_id || "temp-user",
            assistant_id: selectedAssistant?.id || null,
            model: chatSettings?.model || "gpt-4",
            role: "assistant",
            content: `You currently have ${memories.length} memories stored.`,
            image_paths: [],
            sequence_number: prev.length,
            created_at: new Date().toISOString(),
            updated_at: null
          },
          fileItems: []
        }
      ])

      setIsGenerating(false)
      return
    }

    try {
      setUserInput("")
      setIsGenerating(true)
      setIsPromptPickerOpen(false)
      setIsFilePickerOpen(false)
      setNewMessageImages([])

      const newAbortController = new AbortController()
      setAbortController(newAbortController)

      const modelData = [
        ...models.map(model => ({
          modelId: model.model_id as LLMID,
          modelName: model.name,
          provider: "custom" as ModelProvider,
          hostedId: model.id,
          platformLink: "",
          imageInput: false
        })),
        ...LLM_LIST,
        ...availableLocalModels,
        ...availableOpenRouterModels
      ].find(llm => llm.modelId === chatSettings?.model)

      validateChatSettings(
        chatSettings,
        modelData,
        profile,
        selectedWorkspace,
        messageContent
      )

      let currentChat = selectedChat ? { ...selectedChat } : null

      const b64Images = newMessageImages.map(image => image.base64)

      let retrievedFileItems: Tables<"file_items">[] = []

      if (
        (newMessageFiles.length > 0 || chatFiles.length > 0) &&
        useRetrieval
      ) {
        setToolInUse("retrieval")

        retrievedFileItems = await handleRetrieval(
          userInput,
          newMessageFiles,
          chatFiles,
          chatSettings!.embeddingsProvider,
          sourceCount
        )
      }

      const { tempUserChatMessage, tempAssistantChatMessage } =
        createTempMessages(
          messageContent,
          chatMessages,
          chatSettings!,
          b64Images,
          isRegeneration,
          setChatMessages,
          selectedAssistant,
          profile
        )

      // 🛠️ Route edit requests to coding-agent API
      if (messageContent.toLowerCase().startsWith("edit file")) {
        const match = messageContent.match(/^edit file ([^:]+):\s*(.+)$/i)

        if (!match) {
          throw new Error(
            "Invalid format. Use: edit file <path>: <instruction>"
          )
        }

        const [, filePath, instruction] = match

        const editRes = await fetch("/api/assistant/coding-agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ filePath, instruction })
        })

        const editData = await editRes.json()

        setChatMessages(prev => [
          ...prev,
          {
            role: "assistant",
            message: {
              id: crypto.randomUUID(),
              chat_id: selectedChat?.id || "temp-chat",
              user_id: profile?.user_id || "temp-user",
              assistant_id: selectedAssistant?.id || null,
              model: chatSettings?.model || "gpt-4",
              role: "assistant",
              content: editData.response || "Done editing.",
              image_paths: [],
              sequence_number: prev.length,
              created_at: new Date().toISOString(),
              updated_at: null
            },
            fileItems: []
          }
        ])

        setIsGenerating(false)
        return
      }

      if (messageContent.toLowerCase().startsWith("show file")) {
        const match = messageContent.match(/^show file (.+)$/i)

        if (!match) {
          throw new Error("Invalid format. Use: show file <path>")
        }

        const [, filePath] = match

        const fileRes = await fetch("/api/assistant/file-reader", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ filePath })
        })

        const fileData = await fileRes.json()

        // Detect language
        const ext = filePath.split(".").pop()?.toLowerCase()
        const lang =
          ext === "md"
            ? "markdown"
            : ext === "tsx"
              ? "typescript"
              : ext === "ts"
                ? "typescript"
                : ext === "js"
                  ? "javascript"
                  : ext === "json"
                    ? "json"
                    : ext === "py"
                      ? "python"
                      : ext === "html"
                        ? "html"
                        : ext === "css"
                          ? "css"
                          : "text"

        setChatMessages(prev => [
          ...prev,
          {
            role: "assistant",
            message: {
              id: crypto.randomUUID(),
              chat_id: selectedChat?.id || "temp-chat",
              user_id: profile?.user_id || "temp-user",
              assistant_id: selectedAssistant?.id || null,
              model: chatSettings?.model || "gpt-4",
              role: "assistant",
              content: fileData.content,
              image_paths: [],
              sequence_number: prev.length,
              created_at: new Date().toISOString(),
              updated_at: null
            },
            fileItems: []
          }
        ])

        setIsGenerating(false)
        return
      }

      let payload: ChatPayload = {
        chatSettings: chatSettings!,
        workspaceInstructions: selectedWorkspace!.instructions || "",

        chatMessages: isRegeneration
          ? [...chatMessages]
          : [...chatMessages, tempUserChatMessage],
        assistant: selectedChat?.assistant_id ? selectedAssistant : null,
        messageFileItems: retrievedFileItems,
        chatFileItems: chatFileItems
      }

      let generatedText = ""

      const formattedMessages = await buildFinalMessages(
        payload,
        profile!,
        chatImages
      )

      console.log("[DEBUG] About to fetch /api/chat/openai with:", {
        chatSettings: payload.chatSettings,
        messages: formattedMessages,
        tools: fileTools.map(({ name, description, parameters }) => ({
          type: "function",
          function: { name, description, parameters }
        }))
      })
      const response = await fetch("/api/chat/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chatSettings: payload.chatSettings,
          messages: formattedMessages,
          tools: fileTools.map(({ name, description, parameters }) => ({
            type: "function",
            function: { name, description, parameters }
          }))
        })
      }).catch(err => {
        console.error("[DEBUG] fetch /api/chat/openai error:", err)
        throw err
      })

      let resData: any = {}
      // ❗ Don't parse response or clone it before streaming

      const toolCall = resData?.message?.tool_calls?.[0]

      if (toolCall) {
        const tool = fileTools.find(t => t.name === toolCall.function.name)

        if (tool) {
          const args = JSON.parse(toolCall.function.arguments)
          const result = await tool.function(args)

          const followupRes = await fetch("/api/chat/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatSettings: payload.chatSettings,
              messages: [
                ...formattedMessages,
                resData.choices[0].message,
                {
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: JSON.stringify(result)
                }
              ]
            })
          })

          const toolRes: ProcessResponseResult = await processResponse(
            followupRes,
            tempAssistantChatMessage,
            true,
            newAbortController,
            setFirstTokenReceived,
            setChatMessages,
            setToolInUse
          )

          generatedText =
            typeof toolRes === "string"
              ? toolRes
              : toolRes?.message?.content ||
                "Tool responded but no content was returned."

          // ✅ Ensure the chat exists before saving messages
          if (!currentChat) {
            currentChat = await handleCreateChat(
              chatSettings!,
              profile!,
              selectedWorkspace!,
              messageContent,
              selectedAssistant!,
              newMessageFiles,
              setSelectedChat,
              setChats,
              setChatFiles
            )
          }

          // ✅ Save tool-generated message
          await handleCreateMessages(
            chatMessages,
            currentChat,
            profile!,
            modelData!,
            messageContent,
            generatedText,
            newMessageImages,
            isRegeneration,
            retrievedFileItems,
            setChatMessages,
            setChatFileItems,
            setChatImages,
            selectedAssistant
          )

          return
        }
      }

      setToolInUse("none")

      if (!chatSettings || !selectedWorkspace) {
        throw new Error("Missing chat settings or workspace.")
      }

      const finalRes: ProcessResponseResult = await processResponse(
        response,
        isRegeneration
          ? payload.chatMessages[payload.chatMessages.length - 1]
          : tempAssistantChatMessage,
        false,
        newAbortController,
        setFirstTokenReceived,
        setChatMessages,
        setToolInUse
      )

      generatedText =
        typeof finalRes === "string"
          ? finalRes
          : finalRes?.message?.content ||
            "Assistant responded but no content was returned."

      if (!currentChat) {
        currentChat = await handleCreateChat(
          chatSettings!,
          profile!,
          selectedWorkspace!,
          messageContent,
          selectedAssistant!,
          newMessageFiles,
          setSelectedChat,
          setChats,
          setChatFiles
        )
      } else {
        const updatedChat = await updateChat(currentChat.id, {
          updated_at: new Date().toISOString()
        })

        setChats(prevChats => {
          const updatedChats = prevChats.map(prevChat =>
            prevChat.id === updatedChat.id ? updatedChat : prevChat
          )

          return updatedChats
        })
      }

      // Persist the streamed assistant message after streaming ends
      await handleCreateMessages(
        chatMessages,
        currentChat,
        profile!,
        modelData!,
        messageContent,
        generatedText,
        newMessageImages,
        isRegeneration,
        retrievedFileItems,
        setChatMessages,
        setChatFileItems,
        setChatImages,
        selectedAssistant
      )

      setIsGenerating(false)
      setFirstTokenReceived(false)
    } catch (error) {
      console.error("Send message failed:", error)
      setIsGenerating(false)
      setFirstTokenReceived(false)
      setUserInput(startingInput)
    }
  }

  const handleSendEdit = async (
    editedContent: string,
    sequenceNumber: number
  ) => {
    if (!selectedChat) return

    await deleteMessagesIncludingAndAfter(
      selectedChat.user_id,
      selectedChat.id,
      sequenceNumber
    )

    const filteredMessages = chatMessages.filter(
      chatMessage => chatMessage.message.sequence_number < sequenceNumber
    )

    console.log(
      "[DEBUG] setChatMessages(filteredMessages) called in handleSendEdit"
    )
    setChatMessages(filteredMessages)

    handleSendMessage(editedContent, filteredMessages, false)
  }

  return {
    chatInputRef,
    prompt,
    handleNewChat,
    handleSendMessage,
    handleFocusChatInput,
    handleStopMessage,
    handleSendEdit
  }
}
export const prompt = `You are a helpful AI assistant. Please respond to the user's queries in a friendly and informative manner. If you need to edit code, please provide the full modified source code without any additional explanations or comments.`
