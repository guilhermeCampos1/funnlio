'use client'

import { useState } from 'react'
import {
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Lock,
} from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import { hasFeatureAccess, FEATURE_GATES } from '@funnlio/shared'
import type { Plan } from '@funnlio/shared'

interface ExportButtonProps {
  funnelId: string
}

export function ExportButton({ funnelId }: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const { data: subscription } = trpc.billing.getSubscription.useQuery()

  const exportCSV = trpc.exports.exportCSV.useMutation({
    onSuccess: (data) => {
      downloadFile(data.content, data.filename, data.mimeType)
      setOpen(false)
    },
  })

  const exportPDF = trpc.exports.exportPDF.useMutation({
    onSuccess: (data) => {
      const content = JSON.stringify(data.data, null, 2)
      downloadFile(content, data.filename, data.mimeType)
      setOpen(false)
    },
  })

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const plan = (subscription?.plan as Plan) ?? 'trial'
  const trialExpired = subscription?.trialExpired ?? false
  const canCSV = hasFeatureAccess(plan, 'export_csv', trialExpired)
  const canPDF = hasFeatureAccess(plan, 'export_pdf', trialExpired)

  const isExporting = exportCSV.isPending || exportPDF.isPending

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isExporting}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border hover:bg-muted transition-colors disabled:opacity-50"
      >
        <Download className="w-3.5 h-3.5" />
        {isExporting ? 'Exportando...' : 'Exportar'}
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border bg-card shadow-lg py-1">
            {/* CSV option */}
            <button
              onClick={() => {
                if (canCSV) {
                  exportCSV.mutate({ funnelId })
                } else {
                  window.location.href = '/settings/billing'
                }
              }}
              disabled={exportCSV.isPending}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <div className="flex-1 text-left">
                <p className="font-medium">Exportar CSV</p>
                <p className="text-xs text-muted-foreground">Dados em formato de planilha</p>
              </div>
              {!canCSV && (
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span className="rounded-full bg-green-100 text-green-700 px-1.5 py-px text-[10px] font-medium">
                    {FEATURE_GATES.export_csv.requiredPlan}
                  </span>
                </div>
              )}
            </button>

            {/* Divider */}
            <div className="border-t my-1" />

            {/* PDF option */}
            <button
              onClick={() => {
                if (canPDF) {
                  exportPDF.mutate({ funnelId })
                } else {
                  window.location.href = '/settings/billing'
                }
              }}
              disabled={exportPDF.isPending}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <div className="flex-1 text-left">
                <p className="font-medium">Exportar PDF</p>
                <p className="text-xs text-muted-foreground">Relatorio profissional</p>
              </div>
              {!canPDF && (
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span className="rounded-full bg-purple-100 text-purple-700 px-1.5 py-px text-[10px] font-medium">
                    {FEATURE_GATES.export_pdf.requiredPlan}
                  </span>
                </div>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
