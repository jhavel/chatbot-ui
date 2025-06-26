import { ChatbotUIContext } from "@/context/context"
import { IconCheck, IconCopy, IconEdit, IconRepeat } from "@tabler/icons-react"
import { FC, useContext, useEffect, useState } from "react"
import { WithTooltip } from "../ui/with-tooltip"

export const MESSAGE_ICON_SIZE = 18

interface MessageActionsProps {
  isAssistant: boolean
  isLast: boolean
  isEditing: boolean
  isHovering: boolean
  onCopy: () => void
  onEdit: () => void
  onRegenerate: () => void
}

export const MessageActions: FC<MessageActionsProps> = ({
  isAssistant,
  isLast,
  isEditing,
  isHovering,
  onCopy,
  onEdit,
  onRegenerate
}) => {
  const { isGenerating } = useContext(ChatbotUIContext)

  const [showCheckmark, setShowCheckmark] = useState(false)

  const handleCopy = () => {
    onCopy()
    setShowCheckmark(true)
  }

  const handleForkChat = async () => {}

  useEffect(() => {
    if (showCheckmark) {
      const timer = setTimeout(() => {
        setShowCheckmark(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [showCheckmark])

  return (isLast && isGenerating) || isEditing ? null : (
    <div className="text-muted-foreground flex items-center space-x-2">
      {/* {((isAssistant && isHovering) || isLast) && (
        <WithTooltip
          delayDuration={1000}
          side="bottom"
          display={<div>Fork Chat</div>}
        >
          <IconGitFork
            className="cursor-pointer hover:opacity-50"
            size={MESSAGE_ICON_SIZE}
            onClick={handleForkChat}
          />
        </WithTooltip>
      )} */}

      {!isAssistant && isHovering && (
        <WithTooltip
          delayDuration={1000}
          side="bottom"
          display={<div>Edit</div>}
        >
          <IconEdit
            className="cursor-pointer hover:opacity-50"
            size={MESSAGE_ICON_SIZE}
            onClick={onEdit}
          />
        </WithTooltip>
      )}

      {(isHovering || isLast) && (
        <WithTooltip
          delayDuration={1000}
          side="bottom"
          display={<div>Copy</div>}
        >
          {showCheckmark ? (
            <IconCheck size={MESSAGE_ICON_SIZE} />
          ) : (
            <IconCopy
              className="cursor-pointer hover:opacity-50"
              size={MESSAGE_ICON_SIZE}
              onClick={handleCopy}
            />
          )}
        </WithTooltip>
      )}

      {isLast && (
        <WithTooltip
          delayDuration={1000}
          side="bottom"
          display={<div>Regenerate</div>}
        >
          <IconRepeat
            className="cursor-pointer hover:opacity-50"
            size={MESSAGE_ICON_SIZE}
            onClick={onRegenerate}
          />
        </WithTooltip>
      )}

      {/* {1 > 0 && isAssistant && <MessageReplies />} */}
    </div>
  )
}
