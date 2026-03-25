'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

interface HelpStep {
  text: string
}

interface HelpDrawerProps {
  label?: string
  steps: HelpStep[]
  link?: { url: string; label: string }
  note?: string
}

export function HelpDrawer({ label = 'Como obter?', steps, link, note }: HelpDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        {label}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="mt-2 rounded-md border bg-muted/30 p-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
          <ol className="space-y-1.5 text-xs text-foreground">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>

          {note && (
            <p className="text-[11px] text-muted-foreground italic border-t pt-2">
              {note}
            </p>
          )}

          {link && (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {link.label}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
