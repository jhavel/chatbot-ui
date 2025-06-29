// Only used in use-chat-handler.tsx to keep it clean

import { createChatFiles } from "@/db/chat-files"
import { createChat } from "@/db/chats"
import { createMessageFileItems } from "@/db/message-file-items"
import { createMessages, updateMessage } from "@/db/messages"
import { uploadMessageImage } from "@/db/storage/message-images"
import {
  buildFinalMessages,
  adaptMessagesForGoogleGemini
} from "@/lib/build-prompt"
import { consumeReadableStream } from "@/lib/consume-stream"
import { Tables, TablesInsert } from "@/supabase/types"
import {
  ChatFile,
  ChatMessage,
  ChatPayload,
  ChatSettings,
  LLM,
  MessageImage
} from "@/types"
import React from "react"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import { saveMemory } from "@/db/memories"
import { validateMemoryContent } from "@/lib/memory-validation"

export type ProcessResponseResult =
  | string
  | {
      message?: {
        content?: string
        role?: string
        [key: string]: any
      }
      [key: string]: any
    }

export const validateChatSettings = (
  chatSettings: ChatSettings | null,
  modelData: LLM | undefined,
  profile: Tables<"profiles"> | null,
  selectedWorkspace: Tables<"workspaces"> | null,
  messageContent: string
) => {
  if (!chatSettings) {
    throw new Error("Chat settings not found")
  }

  if (!modelData) {
    throw new Error("Model not found")
  }

  if (!profile) {
    throw new Error("Profile not found")
  }

  if (!selectedWorkspace) {
    throw new Error("Workspace not found")
  }

  if (!messageContent) {
    throw new Error("Message content not found")
  }
}

export const handleRetrieval = async (
  userInput: string,
  newMessageFiles: ChatFile[],
  chatFiles: ChatFile[],
  embeddingsProvider: "openai" | "local",
  sourceCount: number
) => {
  const response = await fetch("/api/retrieval/retrieve", {
    method: "POST",
    body: JSON.stringify({
      userInput,
      fileIds: [...newMessageFiles, ...chatFiles].map(file => file.id),
      embeddingsProvider,
      sourceCount
    })
  })

  if (!response.ok) {
    console.error("Error retrieving:", response)
  }

  const { results } = (await response.json()) as {
    results: Tables<"file_items">[]
  }

  return results
}

export const createTempMessages = (
  messageContent: string,
  chatMessages: ChatMessage[],
  chatSettings: ChatSettings,
  b64Images: string[],
  isRegeneration: boolean,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  selectedAssistant: Tables<"assistants"> | null,
  profile: Tables<"profiles"> | null
) => {
  let tempUserChatMessage: ChatMessage = {
    message: {
      chat_id: "",
      assistant_id: null,
      content: messageContent,
      created_at: "",
      id: uuidv4(),
      image_paths: b64Images,
      model: chatSettings.model,
      role: "user",
      sequence_number: chatMessages.length,
      updated_at: "",
      user_id: profile?.user_id || ""
    },
    fileItems: []
  }

  let tempAssistantChatMessage: ChatMessage = {
    message: {
      chat_id: "",
      assistant_id: selectedAssistant?.id || null,
      content: "",
      created_at: "",
      id: `temp-${uuidv4()}`,
      image_paths: [],
      model: chatSettings.model,
      role: "assistant",
      sequence_number: chatMessages.length + 1,
      updated_at: "",
      user_id: profile?.user_id || ""
    },
    fileItems: []
  }

  let newMessages = []

  if (isRegeneration) {
    const lastMessageIndex = chatMessages.length - 1
    chatMessages[lastMessageIndex].message.content = ""
    newMessages = [...chatMessages]
  } else {
    newMessages = [
      ...chatMessages,
      tempUserChatMessage,
      tempAssistantChatMessage
    ]
  }

  setChatMessages(newMessages)

  return {
    tempUserChatMessage,
    tempAssistantChatMessage
  }
}

export const handleLocalChat = async (
  payload: ChatPayload,
  profile: Tables<"profiles">,
  chatSettings: ChatSettings,
  tempAssistantMessage: ChatMessage,
  isRegeneration: boolean,
  newAbortController: AbortController,
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>,
  setFirstTokenReceived: React.Dispatch<React.SetStateAction<boolean>>,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setToolInUse: React.Dispatch<React.SetStateAction<string>>
) => {
  const formattedMessages = await buildFinalMessages(payload, profile, [])

  // Ollama API: https://github.com/jmorganca/ollama/blob/main/docs/api.md
  const response = await fetchChatResponse(
    process.env.NEXT_PUBLIC_OLLAMA_URL + "/api/chat",
    {
      model: chatSettings.model,
      messages: formattedMessages,
      options: {
        temperature: payload.chatSettings.temperature
      }
    },
    false,
    newAbortController,
    setIsGenerating,
    setChatMessages
  )
  console.log(
    "[handleLocalChat] fetchChatResponse returned:",
    response,
    "response.body:",
    response.body
  )
  return await processResponse(
    response,
    isRegeneration
      ? payload.chatMessages[payload.chatMessages.length - 1]
      : tempAssistantMessage,
    false,
    newAbortController,
    setFirstTokenReceived,
    setChatMessages,
    setToolInUse
  )
}

export const handleHostedChat = async (
  payload: ChatPayload,
  profile: Tables<"profiles">,
  modelData: LLM,
  tempAssistantChatMessage: ChatMessage,
  isRegeneration: boolean,
  newAbortController: AbortController,
  newMessageImages: MessageImage[],
  chatImages: MessageImage[],
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>,
  setFirstTokenReceived: React.Dispatch<React.SetStateAction<boolean>>,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setToolInUse: React.Dispatch<React.SetStateAction<string>>
) => {
  const provider =
    modelData.provider === "openai" && profile.use_azure_openai
      ? "azure"
      : modelData.provider

  let draftMessages = await buildFinalMessages(payload, profile, chatImages)

  let formattedMessages: any[] = []
  if (provider === "google") {
    formattedMessages = await adaptMessagesForGoogleGemini(
      payload,
      draftMessages
    )
  } else {
    formattedMessages = draftMessages
  }

  const apiEndpoint =
    provider === "custom" ? "/api/chat/custom" : `/api/chat/${provider}`

  const requestBody = {
    chatSettings: payload.chatSettings,
    messages: formattedMessages,
    customModelId: provider === "custom" ? modelData.hostedId : ""
  }

  const response = await fetchChatResponse(
    apiEndpoint,
    requestBody,
    true,
    newAbortController,
    setIsGenerating,
    setChatMessages
  )
  console.log(
    "[handleHostedChat] fetchChatResponse returned:",
    response,
    "response.body:",
    response.body
  )
  return await processResponse(
    response,
    isRegeneration
      ? payload.chatMessages[payload.chatMessages.length - 1]
      : tempAssistantChatMessage,
    true,
    newAbortController,
    setFirstTokenReceived,
    setChatMessages,
    setToolInUse
  )
}

export const fetchChatResponse = async (
  url: string,
  body: object,
  isHosted: boolean,
  controller: AbortController,
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      signal: controller.signal
    })

    if (!response.ok) {
      if (response.status === 404 && !isHosted) {
        toast.error(
          "Model not found. Make sure you have it downloaded via Ollama."
        )
      }

      let errorMessage = "An error occurred"
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (parseError) {
        // If JSON parsing fails, try to get the response as text
        try {
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        } catch (textError) {
          console.error(
            "[fetchChatResponse] Failed to parse error response:",
            textError
          )
        }
      }

      toast.error(errorMessage)

      setIsGenerating(false)
      setChatMessages(prevMessages => prevMessages.slice(0, -2))
      console.error(
        "[fetchChatResponse] Error response:",
        response,
        errorMessage
      )
    }

    return response
  } catch (err) {
    console.error("[fetchChatResponse] Thrown error:", err)
    throw err
  }
}

export const processResponse = async (
  response: Response,
  lastChatMessage: ChatMessage,
  isHosted: boolean,
  controller: AbortController,
  setFirstTokenReceived: React.Dispatch<React.SetStateAction<boolean>>,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setToolInUse: React.Dispatch<React.SetStateAction<string>>
): Promise<ProcessResponseResult> => {
  console.log("[processResponse] called. Response:", response)

  // Check if this is a non-streaming JSON response (from tools route when no tool calls)
  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    try {
      const jsonResponse = await response.json()
      console.log(
        "[processResponse] Non-streaming JSON response:",
        jsonResponse
      )

      if (jsonResponse.content) {
        const content = jsonResponse.content
        setFirstTokenReceived(true)
        setToolInUse("none")
        setChatMessages(prev => {
          const updated = prev.map((chatMessage, idx, arr) => {
            const isLastTempAssistant =
              chatMessage.message.role === "assistant" &&
              typeof chatMessage.message.id === "string" &&
              chatMessage.message.id.startsWith("temp-") &&
              idx ===
                arr.map(m => m.message.id).lastIndexOf(chatMessage.message.id)
            if (isLastTempAssistant) {
              return {
                ...chatMessage,
                message: {
                  ...chatMessage.message,
                  content: content
                }
              }
            }
            return chatMessage
          })
          return [...updated]
        })
        return content
      }

      return jsonResponse
    } catch (error) {
      console.error("[processResponse] Error parsing JSON response:", error)
      throw error
    }
  }

  // Handle streaming response
  let fullText = ""
  if (!response.body) {
    console.error("[processResponse] ERROR: response.body is null")
    throw new Error("Response body is null")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder("utf-8")
  let done = false
  let buffer = ""

  // Log the first chunk
  const firstRead = await reader.read()
  console.log("[processResponse] First chunk from stream:", firstRead)
  if (firstRead.value) {
    const firstDecoded = decoder.decode(firstRead.value)
    console.log("[processResponse] First decoded buffer:", firstDecoded)
    buffer += firstDecoded
    let lines = buffer.split("\n")
    buffer = lines.pop() || ""
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const messageData = line.replace(/^data: /, "")
      if (messageData === "[DONE]") continue
      try {
        const parsed = JSON.parse(messageData)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) {
          fullText += content
          setFirstTokenReceived(true)
          setToolInUse("none")
          setChatMessages(prev => {
            console.log("[processResponse] setChatMessages updater called")
            let newFullText = ""
            const updated = prev.map((chatMessage, idx, arr) => {
              const isLastTempAssistant =
                chatMessage.message.role === "assistant" &&
                typeof chatMessage.message.id === "string" &&
                chatMessage.message.id.startsWith("temp-") &&
                idx ===
                  arr.map(m => m.message.id).lastIndexOf(chatMessage.message.id)
              if (isLastTempAssistant) {
                newFullText = (chatMessage.message.content || "") + content
                const newMsg = {
                  ...chatMessage,
                  message: {
                    ...chatMessage.message,
                    content: newFullText
                  }
                }
                return newMsg
              }
              return chatMessage
            })
            // Debug log
            console.log("[processResponse] setChatMessages prev:", prev)
            console.log("[processResponse] setChatMessages updated:", updated)
            console.log(
              "[processResponse] Updating temp assistant message with content:",
              newFullText
            )
            return [...updated]
          })
        }
      } catch (err) {
        console.error("Streaming parse error:", err, messageData)
      }
    }
  }
  done = firstRead.done

  while (!done) {
    const { value, done: doneReading } = await reader.read()
    console.log("[processResponse] Streaming loop chunk:", {
      value,
      done: doneReading
    })
    const decoded = value ? decoder.decode(value) : ""
    console.log("[processResponse] Decoded chunk:", decoded)
    done = doneReading
    buffer += decoded

    let lines = buffer.split("\n")
    buffer = lines.pop() || "" // Save incomplete line for next chunk

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const messageData = line.replace(/^data: /, "")
      if (messageData === "[DONE]") continue
      try {
        const parsed = JSON.parse(messageData)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) {
          fullText += content
          setFirstTokenReceived(true)
          setToolInUse("none")
          setChatMessages(prev => {
            console.log("[processResponse] setChatMessages updater called")
            let newFullText = ""
            const updated = prev.map((chatMessage, idx, arr) => {
              const isLastTempAssistant =
                chatMessage.message.role === "assistant" &&
                typeof chatMessage.message.id === "string" &&
                chatMessage.message.id.startsWith("temp-") &&
                idx ===
                  arr.map(m => m.message.id).lastIndexOf(chatMessage.message.id)
              if (isLastTempAssistant) {
                newFullText = (chatMessage.message.content || "") + content
                const newMsg = {
                  ...chatMessage,
                  message: {
                    ...chatMessage.message,
                    content: newFullText
                  }
                }
                return newMsg
              }
              return chatMessage
            })
            // Debug log
            console.log("[processResponse] setChatMessages prev:", prev)
            console.log("[processResponse] setChatMessages updated:", updated)
            console.log(
              "[processResponse] Updating temp assistant message with content:",
              newFullText
            )
            return [...updated]
          })
        }
      } catch (err) {
        console.error("Streaming parse error:", err, messageData)
      }
    }
  }

  // Handle any remaining buffer after the stream ends
  if (buffer.trim() && buffer.startsWith("data: ")) {
    const messageData = buffer.replace(/^data: /, "")
    if (messageData !== "[DONE]") {
      try {
        const parsed = JSON.parse(messageData)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) {
          fullText += content
          setFirstTokenReceived(true)
          setToolInUse("none")
          setChatMessages(prev => {
            console.log("[processResponse] setChatMessages updater called")
            let newFullText = ""
            const updated = prev.map((chatMessage, idx, arr) => {
              const isLastTempAssistant =
                chatMessage.message.role === "assistant" &&
                typeof chatMessage.message.id === "string" &&
                chatMessage.message.id.startsWith("temp-") &&
                idx ===
                  arr.map(m => m.message.id).lastIndexOf(chatMessage.message.id)
              if (isLastTempAssistant) {
                newFullText = (chatMessage.message.content || "") + content
                const newMsg = {
                  ...chatMessage,
                  message: {
                    ...chatMessage.message,
                    content: newFullText
                  }
                }
                return newMsg
              }
              return chatMessage
            })
            // Debug log
            console.log("[processResponse] setChatMessages prev:", prev)
            console.log("[processResponse] setChatMessages updated:", updated)
            console.log(
              "[processResponse] Updating temp assistant message with content:",
              newFullText
            )
            return [...updated]
          })
        }
      } catch (err) {
        console.error("Streaming parse error (final buffer):", err, messageData)
      }
    }
  }

  console.log("[processResponse] Final fullText:", fullText)
  return fullText
}

export const handleCreateChat = async (
  chatSettings: ChatSettings,
  profile: Tables<"profiles">,
  selectedWorkspace: Tables<"workspaces">,
  messageContent: string,
  selectedAssistant: Tables<"assistants">,
  newMessageFiles: ChatFile[],
  setSelectedChat: React.Dispatch<React.SetStateAction<Tables<"chats"> | null>>,
  setChats: React.Dispatch<React.SetStateAction<Tables<"chats">[]>>,
  setChatFiles: React.Dispatch<React.SetStateAction<ChatFile[]>>
) => {
  const createdChat = await createChat({
    user_id: profile.user_id,
    workspace_id: selectedWorkspace.id,
    assistant_id: selectedAssistant?.id || null,
    context_length: chatSettings.contextLength,
    include_profile_context: chatSettings.includeProfileContext,
    include_workspace_instructions: chatSettings.includeWorkspaceInstructions,
    model: chatSettings.model,
    name: messageContent.substring(0, 100),
    prompt: chatSettings.prompt,
    temperature: chatSettings.temperature,
    embeddings_provider: chatSettings.embeddingsProvider
  })

  setSelectedChat(createdChat)
  setChats(chats => [createdChat, ...chats])

  await createChatFiles(
    newMessageFiles.map(file => ({
      user_id: profile.user_id,
      chat_id: createdChat.id,
      file_id: file.id
    }))
  )

  setChatFiles(prev => [...prev, ...newMessageFiles])

  return createdChat
}

export const handleCreateMessages = async (
  chatMessages: ChatMessage[],
  currentChat: Tables<"chats">,
  profile: Tables<"profiles">,
  modelData: LLM,
  messageContent: string,
  generatedText: string,
  newMessageImages: MessageImage[],
  isRegeneration: boolean,
  retrievedFileItems: Tables<"file_items">[],
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setChatFileItems: React.Dispatch<
    React.SetStateAction<Tables<"file_items">[]>
  >,
  setChatImages: React.Dispatch<React.SetStateAction<MessageImage[]>>,
  selectedAssistant: Tables<"assistants"> | null
) => {
  console.log("🔍 [DEBUG] handleCreateMessages called!")
  console.log(
    "🔍 [DEBUG] messageContent:",
    messageContent.substring(0, 100) + "..."
  )
  console.log(
    "🔍 [DEBUG] generatedText:",
    generatedText.substring(0, 100) + "..."
  )

  const finalUserMessage: TablesInsert<"messages"> = {
    chat_id: currentChat.id,
    assistant_id: null,
    user_id: profile.user_id,
    content: messageContent,
    model: modelData.modelId,
    role: "user",
    sequence_number: chatMessages.length,
    image_paths: []
  }

  const finalAssistantMessage: TablesInsert<"messages"> = {
    chat_id: currentChat.id,
    assistant_id: selectedAssistant?.id || null,
    user_id: profile.user_id,
    content: generatedText,
    model: modelData.modelId,
    role: "assistant",
    sequence_number: chatMessages.length + 1,
    image_paths: []
  }

  console.log("🔍 [DEBUG] finalUserMessage content:", finalUserMessage.content)
  console.log(
    "🔍 [DEBUG] finalAssistantMessage content:",
    finalAssistantMessage.content
  )
  console.log(
    "🔍 [DEBUG] finalAssistantMessage content length:",
    finalAssistantMessage.content.length
  )

  let finalChatMessages: ChatMessage[] = []

  if (isRegeneration) {
    const lastStartingMessage = chatMessages[chatMessages.length - 1].message

    const updatedMessage = await updateMessage(lastStartingMessage.id, {
      ...lastStartingMessage,
      content: generatedText
    })

    chatMessages[chatMessages.length - 1].message = updatedMessage

    finalChatMessages = [...chatMessages]

    setChatMessages(finalChatMessages)
  } else {
    const createdMessages = await createMessages([
      finalUserMessage,
      finalAssistantMessage
    ])

    // Upload each image (stored in newMessageImages) for the user message to message_images bucket
    const uploadPromises = newMessageImages
      .filter(obj => obj.file !== null)
      .map(obj => {
        let filePath = `${profile.user_id}/${currentChat.id}/${
          createdMessages[0].id
        }/${uuidv4()}`

        return uploadMessageImage(filePath, obj.file as File).catch(error => {
          console.error(`Failed to upload image at ${filePath}:`, error)
          return null
        })
      })

    const paths = (await Promise.all(uploadPromises)).filter(
      Boolean
    ) as string[]

    setChatImages(prevImages => [
      ...prevImages,
      ...newMessageImages.map((obj, index) => ({
        ...obj,
        messageId: createdMessages[0].id,
        path: paths[index]
      }))
    ])

    const updatedMessage = await updateMessage(createdMessages[0].id, {
      ...createdMessages[0],
      image_paths: paths
    })

    const createdMessageFileItems = await createMessageFileItems(
      retrievedFileItems.map(fileItem => {
        return {
          user_id: profile.user_id,
          message_id: createdMessages[1].id,
          file_item_id: fileItem.id
        }
      })
    )

    finalChatMessages = [
      ...chatMessages,
      {
        message: updatedMessage,
        fileItems: []
      },
      {
        message: createdMessages[1],
        fileItems: retrievedFileItems.map(fileItem => fileItem.id)
      }
    ]

    // Debug log: print the assistant message being saved
    const assistantMsg = finalChatMessages.find(
      m => m.message.role === "assistant"
    )
    console.log(
      "[handleCreateMessages] Persisting assistant message:",
      assistantMsg?.message.content
    )
    console.log("[handleCreateMessages] finalChatMessages:", finalChatMessages)

    setChatFileItems(prevFileItems => {
      const newFileItems = retrievedFileItems.filter(
        fileItem => !prevFileItems.some(prevItem => prevItem.id === fileItem.id)
      )

      return [...prevFileItems, ...newFileItems]
    })

    setChatMessages(finalChatMessages)
  }

  // Enhanced memory saving with semantic processing
  // Use AI-powered memory detection
  const shouldSaveAsMemory = async (
    userMessage: string,
    aiResponse: string
  ): Promise<boolean> => {
    // Only use client-safe detection here. Do NOT import server-only code.
    console.log("🔍 [DEBUG] Memory detection called with:")
    console.log("👤 User message:", userMessage.substring(0, 100) + "...")
    console.log("🤖 AI response:", aiResponse.substring(0, 100) + "...")
    // Fallback to keyword-based detection only (client-safe)
    const personalInfoKeywords = [
      "name",
      "work",
      "job",
      "company",
      "business",
      "startup",
      "founded",
      "sold",
      "acquired",
      "like",
      "prefer",
      "favorite",
      "enjoy",
      "love",
      "hate",
      "dislike",
      "family",
      "wife",
      "husband",
      "children",
      "kids",
      "parents",
      "education",
      "studied",
      "graduated",
      "school",
      "university",
      "skills",
      "expertise",
      "experience",
      "background",
      "goals",
      "dreams",
      "aspirations",
      "values",
      "beliefs",
      "location",
      "from",
      "live",
      "age",
      "birthday"
    ]
    const lowerResponse = aiResponse.toLowerCase()
    const lowerUserMessage = userMessage.toLowerCase()
    // Check if conversation contains personal information keywords
    const hasPersonalKeywords = personalInfoKeywords.some(
      keyword =>
        lowerResponse.includes(keyword) || lowerUserMessage.includes(keyword)
    )
    // Check if the conversation contains first-person statements
    const firstPersonPatterns = [
      /i (am|am a|work|do|like|love|hate|prefer|enjoy|studied|graduated|started|founded|sold|bought|own|have|went|experienced|learned|discovered|want|hope|plan|believe|feel|think|value|care)/i,
      /my (name|job|work|company|business|startup|family|wife|husband|children|kids|parents|education|school|university|skills|expertise|experience|goals|dreams|aspirations|values|beliefs|location|age|favorite|preference)/i,
      /i'm (from|a|an|the|working|studying|trying|planning|hoping)/i
    ]
    const hasFirstPersonInfo = firstPersonPatterns.some(pattern =>
      pattern.test(lowerUserMessage)
    )
    // Check if AI is acknowledging personal information
    const aiAcknowledgmentPatterns = [
      /that's (amazing|great|interesting|fascinating|impressive)/i,
      /it's (great|amazing|interesting|fascinating|impressive) that/i,
      /you (are|have|seem|appear|sound)/i,
      /your (experience|background|skills|expertise|company|business|startup|family|education)/i,
      /congratulations on/i,
      /i understand you/i,
      /based on your/i,
      /given your/i
    ]
    const aiIsAcknowledging = aiAcknowledgmentPatterns.some(pattern =>
      pattern.test(lowerResponse)
    )
    const fallbackResult =
      hasPersonalKeywords && (hasFirstPersonInfo || aiIsAcknowledging)
    console.log("🔍 [DEBUG] Fallback detection result:", {
      hasPersonalKeywords,
      hasFirstPersonInfo,
      aiIsAcknowledging,
      fallbackResult
    })
    return fallbackResult
  }

  console.log("🔍 [DEBUG] About to call shouldSaveAsMemory...")
  const shouldSave = await shouldSaveAsMemory(messageContent, generatedText)
  console.log("🔍 [DEBUG] shouldSave result:", shouldSave)

  if (shouldSave) {
    console.log(
      "🧠 Personal information detected in conversation, attempting to save memory..."
    )
    console.log("👤 User message:", messageContent.substring(0, 100) + "...")

    try {
      await fetch("/api/memory/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent,
          user_id: profile.user_id,
          source: "user",
          context: { chatId: currentChat?.id }
        })
      })
      console.log("✅ Unified memory saved with user's personal information")
    } catch (err) {
      console.error("❌ Failed to save unified memory:", err)
    }
  } else {
    console.log("🔍 No personal information detected in conversation")
  }
}
