import React, { ReactNode, forwardRef } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "./tooltip"

interface WithTooltipProps {
  display: ReactNode
  children: ReactNode
  delayDuration?: number
  side?: "left" | "right" | "top" | "bottom"
  asChild?: boolean
}

export const WithTooltip = forwardRef<HTMLDivElement, WithTooltipProps>(
  (
    { display, children, delayDuration = 500, side = "right", asChild = false },
    _ref // ref isn't needed unless you're passing it through
  ) => {
    return (
      <TooltipProvider delayDuration={delayDuration}>
        <Tooltip>
          <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
          <TooltipContent side={side}>{display}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
)

WithTooltip.displayName = "WithTooltip"
