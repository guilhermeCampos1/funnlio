'use client'

import { useState } from 'react'
import { ChevronsUpDown, Check, Building2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'

export function OrgSwitcher() {
  const [open, setOpen] = useState(false)
  const { data: orgs = [] } = trpc.organizations.listMyOrgs.useQuery()

  const currentOrg = orgs.find((o) => o.isCurrent)

  if (orgs.length <= 1) {
    // Single org — show name but no switcher
    return currentOrg ? (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium truncate">{currentOrg.name}</span>
      </div>
    ) : null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
      >
        <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="font-medium truncate flex-1 text-left">
          {currentOrg?.name ?? 'Organização'}
        </span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-40 mt-1 rounded-md border bg-popover shadow-md">
            {orgs.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  // Switching org requires a server-side session update
                  // For now, navigate to trigger a fresh session lookup
                  window.location.href = `/dashboard?org=${org.slug}`
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <span className="flex-1 text-left truncate">{org.name}</span>
                {org.isCurrent && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
