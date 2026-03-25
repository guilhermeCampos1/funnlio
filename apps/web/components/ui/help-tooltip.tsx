'use client'

import * as Tooltip from '@radix-ui/react-tooltip'
import { HelpCircle } from 'lucide-react'

interface HelpTooltipProps {
  text: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function HelpTooltip({ text, side = 'top', className }: HelpTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ${className ?? ''}`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            sideOffset={4}
            className="z-50 max-w-xs rounded-md bg-popover border px-3 py-2 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          >
            {text}
            <Tooltip.Arrow className="fill-popover" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
