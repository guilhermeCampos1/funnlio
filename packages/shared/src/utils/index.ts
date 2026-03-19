import type { DateRange, DateRangePreset } from '../types/index.js'

export function getDateRange(preset: DateRangePreset): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case 'today':
      return { start: today, end: now }
    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return { start: yesterday, end: today }
    }
    case 'last7d': {
      const start = new Date(today)
      start.setDate(start.getDate() - 7)
      return { start, end: now }
    }
    case 'last30d': {
      const start = new Date(today)
      start.setDate(start.getDate() - 30)
      return { start, end: now }
    }
    case 'last90d': {
      const start = new Date(today)
      start.setDate(start.getDate() - 90)
      return { start, end: now }
    }
    default:
      return { start: today, end: now }
  }
}

export function formatMetricValue(value: number, type: 'number' | 'currency' | 'percentage' | 'duration'): string {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    case 'percentage':
      return `${value.toFixed(1)}%`
    case 'duration':
      return `${Math.floor(value / 60)}m ${Math.round(value % 60)}s`
    default:
      return new Intl.NumberFormat('pt-BR').format(value)
  }
}

export function calculateConversionRate(from: number | null, to: number | null): number | null {
  if (!from || !to || from === 0) return null
  return (to / from) * 100
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
